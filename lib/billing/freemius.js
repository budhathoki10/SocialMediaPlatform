// Freemius adapter — every Freemius-specific detail (the SDK, its event
// names, its payload shapes) lives in this one file. Routes only ever call
// buildCheckoutUrl/buildPortalUrl/handleWebhookRequest and never import the
// SDK or know Freemius's field names — the provider is swappable by
// replacing this file alone, same isolation as any other provider-agnostic
// billing module.
//
// Attribution model: Freemius's checkout has no opaque-metadata passthrough
// — there is no way to hand it our own internal user id and get it echoed
// back on the webhook (verified against the real @freemius/sdk and
// @freemius/checkout type definitions, not assumed). So email is
// unavoidably the only thing we can seed a *brand new* checkout with. Once
// that first purchase succeeds we store Freemius's own license id
// (fs_license_id) against the user, and every event after that — renewals,
// plan changes, cancellations — matches by that stored id instead of
// re-resolving by email. Email is used exactly once, at first attribution,
// never again.
//
// BILLING POLICY — deliberate, not something to "fix":
//   - No refunds are issued. There is no refund/chargeback event handler
//     here on purpose; a refunded subscription is not force-deactivated.
//   - Cancellation is immediate, not prorated. `cancel_at_period_end`
//     exists on the Subscription schema and is surfaced via /api/settings,
//     but is never set to true anywhere; it's a placeholder for a feature
//     this product does not offer, not a bug.
//
// NO CRON: there is no periodic job that sweeps subscriptions and flips a
// status once current_period_end passes. Access is computed live wherever
// it's checked — see activeSubscriptionFilter()/getCurrentPlan() in
// lib/entitlements.js — the same way the SDK's own
// EntitlementService.getActives() decides activity: compare a stored
// expiration timestamp against `now` at read time. license.expired here
// still updates `status` for support/billing-history visibility, but
// nothing depends on that write happening or being timely.
import { activeSubscriptionFilter } from "@/lib/entitlements";
import { freemius, isFreemiusConfigured } from "@/lib/freemius";
import { BillingPlan, Subscription, User, WebhookEvent } from "@/lib/models";

// Every event that represents a change to a license's state. One shared
// handler re-fetches the license's full purchase info and upserts our
// Subscription doc from it — see syncSubscriptionFromLicenseId below.
const LICENSE_SYNC_EVENTS = [
  "license.created",
  "license.extended",
  "license.shortened",
  "license.updated",
  "license.expired",
  "license.cancelled",
  "license.plan.changed",
];

async function findInternalUser(email) {
  if (!email) return null;
  return User.findOne({ email: String(email).toLowerCase() }).select("_id");
}

async function findPlanByProviderId(providerPlanId) {
  if (!providerPlanId) return null;
  return BillingPlan.findOne({ provider_plan_id: String(providerPlanId), is_active: true }).lean();
}

// Shared by both the webhook sync path and the manual link-by-email path
// below — writes a Subscription doc from an already-resolved userId + a
// freshly-fetched PurchaseInfo, never touching email itself. The two
// callers differ only in *how* they resolved userId (an existing
// fs_license_id match, or an explicit user-confirmed link).
async function upsertSubscriptionForUser(userId, licenseId, purchase, billingPlan, existing) {
  const now = new Date();

  await Subscription.findOneAndUpdate(
    { fs_license_id: licenseId },
    {
      $set: {
        user_id: userId,
        plan: billingPlan.plan,
        billing_period: purchase.billingCycle === "yearly" ? "yearly" : "monthly",
        status: purchase.canceled ? "canceled" : "active",
        provider: "freemius",
        provider_customer_id: purchase.userId ? String(purchase.userId) : null,
        provider_subscription_id: purchase.subscriptionId ? String(purchase.subscriptionId) : null,
        fs_license_id: licenseId,
        // Freemius's own reported amount for this purchase, not our listed
        // price — more authoritative than the billing_plans lookup we used
        // before, since it reflects any coupon/discount actually applied.
        amount: purchase.renewalAmount ?? purchase.initialAmount ?? null,
        currency: purchase.currency || billingPlan.currency,
        current_period_end: purchase.expiration,
        cancel_at_period_end: false,
        canceled_at: purchase.canceled ? now : null,
        expired_at: null,
        updated_at: now,
        ...(!existing && { current_period_start: now }),
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

// Re-fetches authoritative purchase state for a license (rather than
// trusting whatever fields a particular event happened to carry) and
// upserts the matching Subscription. Shared by every LICENSE_SYNC_EVENTS
// handler — a license.created, a license.extended (renewal), and a
// license.plan.changed all end up here doing the exact same sync.
async function syncSubscriptionFromLicenseId(licenseId, rawEvent) {
  const purchase = await freemius.purchase.retrievePurchase(licenseId);

  if (!purchase) {
    console.warn(`No Freemius purchase found for license "${licenseId}" — nothing to sync.`);
    return;
  }

  const billingPlan = await findPlanByProviderId(purchase.planId);

  if (!billingPlan) {
    console.warn(`No billing_plans row for Freemius plan_id "${purchase.planId}" — run npm run seed:billing-plans.`);
    return;
  }

  const existing = await Subscription.findOne({ fs_license_id: licenseId }).select("user_id");
  const user = existing ? { _id: existing.user_id } : await findInternalUser(purchase.email);

  if (!user) {
    console.warn(`No User found for email "${purchase.email}" — cannot attribute Freemius license "${licenseId}".`);
    // Full dump for debugging attribution mismatches (e.g. a test checkout
    // using an email that doesn't match any real account) — deliberately
    // only logged on this failure path, not on every event, to avoid noise.
    console.log("=== FREEMIUS WEBHOOK (unattributed) — raw event ===");
    console.log(JSON.stringify(rawEvent, null, 2));
    console.log("=== FREEMIUS WEBHOOK (unattributed) — resolved purchase ===");
    console.log(JSON.stringify(purchase, null, 2));
    return;
  }

  await upsertSubscriptionForUser(user._id, licenseId, purchase, billingPlan, existing);
}

// license.deleted carries `objects.license: false` — the license no longer
// exists to retrieve, so there's nothing to re-fetch. Just mark whatever we
// already have for it as canceled.
async function markLicenseDeleted(licenseId) {
  const now = new Date();

  const updated = await Subscription.findOneAndUpdate(
    { fs_license_id: licenseId },
    { $set: { status: "canceled", canceled_at: now, updated_at: now } },
  );

  if (!updated) {
    console.warn(`license.deleted: no Subscription found for fs_license_id "${licenseId}".`);
  }
}

// Informational only — see BILLING POLICY note above. A failed renewal
// charge doesn't cut access by itself; the live current_period_end check in
// lib/entitlements.js is what actually does that once the paid period runs
// out. This just keeps the status label accurate for support/the dashboard
// in the meantime.
async function markRenewalFailed(licenseId) {
  const updated = await Subscription.findOneAndUpdate(
    { fs_license_id: licenseId, status: { $ne: "canceled" } },
    { $set: { status: "past_due", updated_at: new Date() } },
  );

  if (!updated) {
    console.warn(`subscription.renewal.failed: no active Subscription found for fs_license_id "${licenseId}".`);
  }
}

// Unlike a hand-rolled route that always acks 200, the SDK's processor
// returns a 500 (triggering a real Freemius retry) when a registered
// handler throws. This callback is just for our own server-side visibility
// into that failure.
async function logWebhookError(error) {
  console.error("Freemius webhook handler failed:", error);
}

// The SDK verifies the signature and parses the event but does nothing to
// stop the same event being processed twice — a genuine Freemius retry, or
// a captured payload replayed by an attacker, would otherwise re-run a
// handler (e.g. re-extending a cancelled subscription). Claims event.id for
// this event exactly once via the unique {provider, event_id} index;
// returns true if it was already claimed (skip), false if this delivery
// just claimed it and is safe to process.
async function isDuplicateEvent(eventId, eventType) {
  try {
    await WebhookEvent.create({ provider: "freemius", event_id: String(eventId), event_type: eventType || null });
    return false;
  } catch (error) {
    if (error?.code === 11000) return true;
    throw error;
  }
}

// Wraps every registered handler with the replay guard above so
// buildListener()'s own handlers never have to think about it.
function withReplayGuard(handler) {
  return async (event) => {
    if (!event?.id) {
      // No event id to dedupe against — processing it would leave no way to
      // distinguish a legitimate retry from a replayed payload, so fail
      // closed rather than risk re-running the handler.
      console.error(`Freemius webhook "${event?.type}" has no event.id — skipping (cannot guard against replay).`);
      return;
    }

    if (await isDuplicateEvent(event.id, event.type)) {
      console.warn(`Ignoring duplicate/replayed Freemius webhook event "${event.type}" (id: ${event.id}).`);
      return;
    }

    await handler(event);
  };
}

function buildListener() {
  const listener = freemius.webhook.createListener({ onError: logWebhookError });

  listener.on(
    LICENSE_SYNC_EVENTS,
    withReplayGuard(async (event) => {
      const licenseId = event.objects?.license?.id ? String(event.objects.license.id) : "";
      if (!licenseId) return;

      await syncSubscriptionFromLicenseId(licenseId, event);
    }),
  );

  listener.on(
    "license.deleted",
    withReplayGuard(async ({ data }) => {
      const licenseId = data?.license_id ? String(data.license_id) : "";
      if (!licenseId) return;

      await markLicenseDeleted(licenseId);
    }),
  );

  listener.on(
    ["subscription.renewal.failed", "subscription.renewal.failed.last"],
    withReplayGuard(async ({ objects }) => {
      const licenseId = objects?.license?.id ? String(objects.license.id) : "";
      if (!licenseId) return;

      await markRenewalFailed(licenseId);
    }),
  );

  return listener;
}

// Optional extra guard beyond the SDK's own signature verification — lets
// the webhook URL itself be rotated/revoked instantly (e.g. if it leaks)
// without waiting on a Freemius-side secret rotation. Only enforced if set.
function isAuthorizedWebhookRequest(request) {
  if (!process.env.FREEMIUS_WEBHOOK_TOKEN) return true;

  const token = new URL(request.url).searchParams.get("token");
  return token === process.env.FREEMIUS_WEBHOOK_TOKEN;
}

export const billing = {
  /**
   * Builds a Freemius-hosted checkout link for a plan/period. The buyer's
   * email is locked read-only inside the checkout session (the SDK's
   * builder.setUser(user, true) — the `true` is "readonly"), confirmed live
   * against the real Freemius API (the generated URL carries
   * readonly_user=1) — so a buyer going through this link cannot pay under
   * a different email than their AutoPilot account.
   *
   * @param {{ email: string, name?: string, providerPlanId: string, period: "monthly"|"yearly", existingLicenseId?: string|null }} opts
   */
  async buildCheckoutUrl({ email, name, providerPlanId, period, existingLicenseId }) {
    const [firstName, ...lastNameParts] = (name || "").trim().split(" ");

    const checkout = await freemius.checkout.create({
      user: {
        email,
        ...(firstName ? { firstName } : {}),
        ...(lastNameParts.length ? { lastName: lastNameParts.join(" ") } : {}),
      },
      planId: providerPlanId,
      isSandbox: process.env.NODE_ENV !== "production",
      // When the user already has an active license (any plan/period),
      // this authorizes the checkout as an upgrade against that license
      // instead of starting an unrelated second subscription.
      ...(existingLicenseId ? { licenseId: existingLicenseId } : {}),
    });

    // "yearly" is our/PurchaseInfo's billingCycle value; the checkout
    // builder's own setBillingCycle() expects "annual" — the SDK isn't
    // consistent about this between its two APIs.
    checkout.setBillingCycle(period === "yearly" ? "annual" : "monthly");

    return checkout.getLink();
  },

  /**
   * Mints a short-lived link into Freemius's own hosted customer portal
   * (manage payment method, view invoices, cancel). Prefers the stored
   * Freemius user id (provider_customer_id) over email since it's a stable
   * id rather than something that can be typed wrong or have changed.
   *
   * @param {{ userId: import("mongoose").Types.ObjectId, email: string }} opts
   * @returns {Promise<string|null>} null if no Freemius customer could be resolved.
   */
  async buildPortalUrl({ userId, email }) {
    const subscription = await Subscription.findOne(activeSubscriptionFilter(userId))
      .sort({ created_at: -1 })
      .select("provider_customer_id")
      .lean();

    const portal = subscription?.provider_customer_id
      ? await freemius.api.user.retrieveHostedCustomerPortal(subscription.provider_customer_id)
      : email
        ? await freemius.api.user.retrieveHostedCustomerPortalByEmail(email)
        : null;

    return portal?.link || null;
  },

  /**
   * Fallback for the one case fs_license_id matching can't cover: a
   * purchase made with an email that never matched any AutoPilot account
   * (e.g. checkout happened outside this app's own locked-email link).
   * Looks up active Freemius purchases under a self-reported email and
   * returns a minimal, non-sensitive summary of each — no card/payment
   * details — for the logged-in user to confirm before linking. Excludes
   * anything already linked to a *different* AutoPilot account so one user
   * can't be shown (or later claim) another user's already-claimed license.
   *
   * @param {{ email: string, requestingUserId: import("mongoose").Types.ObjectId }} opts
   */
  async findLinkableEmailMatches({ email, requestingUserId }) {
    if (!email) return [];

    const purchases = await freemius.purchase.retrievePurchasesByEmail(email);
    const candidates = (purchases || []).filter((purchase) => purchase.isActive && !purchase.canceled);

    if (candidates.length === 0) return [];

    const licenseIds = candidates.map((purchase) => purchase.licenseId);
    const alreadyLinked = await Subscription.find({ fs_license_id: { $in: licenseIds } })
      .select("fs_license_id user_id")
      .lean();
    const linkedToOtherUser = new Set(
      alreadyLinked
        .filter((doc) => String(doc.user_id) !== String(requestingUserId))
        .map((doc) => doc.fs_license_id),
    );

    const results = [];

    for (const purchase of candidates) {
      if (linkedToOtherUser.has(purchase.licenseId)) continue;

      const billingPlan = await findPlanByProviderId(purchase.planId);
      if (!billingPlan) continue;

      results.push({
        licenseId: purchase.licenseId,
        plan: billingPlan.plan,
        billingPeriod: purchase.billingCycle === "yearly" ? "yearly" : "monthly",
        currentPeriodEnd: purchase.expiration,
      });
    }

    return results;
  },

  /**
   * Attaches a Freemius license (found via findLinkableEmailMatches and
   * explicitly confirmed by the logged-in user) to their AutoPilot account,
   * bypassing email entirely — the license id itself is the proof, since it
   * can only have come from a real active purchase this same request just
   * looked up. Refuses to reassign a license already linked to a different
   * existing AutoPilot user, so this can't be used to hijack someone else's
   * subscription.
   *
   * @param {{ userId: import("mongoose").Types.ObjectId, licenseId: string }} opts
   */
  async linkPurchaseToUser({ userId, licenseId }) {
    const existing = await Subscription.findOne({ fs_license_id: licenseId }).select("user_id");

    if (existing && String(existing.user_id) !== String(userId)) {
      throw new Error("This license is already linked to a different account.");
    }

    const purchase = await freemius.purchase.retrievePurchase(licenseId);

    if (!purchase || !purchase.isActive || purchase.canceled) {
      throw new Error("This license is no longer active.");
    }

    const billingPlan = await findPlanByProviderId(purchase.planId);

    if (!billingPlan) {
      throw new Error("Unrecognized plan for this license.");
    }

    console.warn(`Manually linking Freemius license "${licenseId}" to user "${userId}" (email-based match, not fs_license_id).`);

    await upsertSubscriptionForUser(userId, licenseId, purchase, billingPlan, existing);
  },

  /**
   * Verifies (via the SDK's own x-signature check) and processes an
   * incoming Freemius webhook request end-to-end — syncing whatever
   * Subscription doc it affects. Returns the Response to send back to
   * Freemius directly; the calling route doesn't need to know anything
   * about Freemius's event shapes.
   */
  async handleWebhookRequest(request) {
    if (!isFreemiusConfigured() || !freemius) {
      return Response.json({ error: "Freemius is not configured" }, { status: 500 });
    }

    if (!isAuthorizedWebhookRequest(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listener = buildListener();
    const processor = freemius.webhook.createRequestProcessor(listener);

    return processor(request);
  },
};
