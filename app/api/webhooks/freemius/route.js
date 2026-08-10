// PHASE 3 — signature verification (Phase 2) + minimal DB writes. Freemius
// fires ~10 event types per checkout; only these affect billing state:
//   - payment.created / subscription.created -> activate a Subscription
//   - payment.failed -> mark it past_due (informational; see note below)
//   - subscription.cancelled / license.expired -> deactivate it
// Everything else (cart.*, card.*, user.*, license.created/shortened, ...)
// is acknowledged with 200 but otherwise ignored — noise for billing state.
//
// Matching a webhook back to our own User: Freemius has no way to carry an
// internal user id through checkout, so app/api/billing/checkout/route.js
// forces the checkout email to equal the logged-in session's email. Every
// handler here looks the user up by that email.
//
// Hard cutoff on non-payment: Freemius runs its own retry/dunning window
// after a failed charge before it ever tells us the subscription is truly
// cancelled/expired — that can be days. We don't wait for it. `past_due`
// here is purely informational; the actual access cutoff is enforced by
// expireOverdueSubscriptions() in lib/subscriptions.js, run every minute
// from /api/cron, which downgrades anyone whose current_period_end has
// passed regardless of whether Freemius has confirmed cancellation yet.
//
// BILLING POLICY — deliberate, not something to "fix":
//   - No refunds are issued. There is no refund/chargeback event handler
//     here on purpose; a refunded subscription is not force-deactivated.
//   - Cancellation is immediate, not prorated. handleSubscriptionCancelled
//     below revokes access the moment the webhook lands, regardless of how
//     much of the current paid period is left — there is no "stay active
//     until period end" plan. `cancel_at_period_end` exists on the
//     Subscription schema and is surfaced via /api/settings, but is never
//     set to true anywhere; it's a placeholder for a feature this product
//     does not offer, not a bug.
//
// NOTE: "payment.failed" is my best-guess event name following Freemius's
// own <entity>.<action> convention (payment.created, subscription.created,
// ...) — it has not been observed in a real payload. The POST handler below
// logs every event type actually received (handled or not), specifically so
// a wrong guess like this one surfaces in the logs instead of silently never
// firing — check there to confirm the real name and adjust
// HANDLED_EVENT_TYPES/EVENT_HANDLERS if it differs.
import crypto from "node:crypto";

import { connectDB } from "@/lib/db";
import { BillingPlan, Subscription, User, WebhookEvent } from "@/lib/models";

export const dynamic = "force-dynamic";

const HANDLED_EVENT_TYPES = new Set([
  "payment.created",
  "payment.failed",
  "subscription.created",
  "subscription.cancelled",
  "license.expired",
]);

function isValidFreemiusSignature(rawBody, signatureHeader) {
  const secret = process.env.FREEMIUS_SECRET_KEY;

  if (!secret || !signatureHeader) return false;

  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

// Freemius sends "YYYY-MM-DD HH:mm:ss" with no timezone marker — it's UTC.
function parseFreemiusDate(value) {
  if (!value) return null;

  const parsed = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addBillingCycle(fromDate, billingPeriod) {
  const base = fromDate instanceof Date && !Number.isNaN(fromDate.getTime()) ? new Date(fromDate) : new Date();

  if (billingPeriod === "yearly") {
    base.setUTCFullYear(base.getUTCFullYear() + 1);
  } else {
    base.setUTCMonth(base.getUTCMonth() + 1);
  }

  return base;
}

// Claims payload.id for this event exactly once via the unique
// {provider, event_id} index — returns true if it was already claimed
// (a retry or a replayed/captured payload), false if this delivery just
// claimed it and is safe to process.
async function isDuplicateEvent(eventId, eventType) {
  try {
    await WebhookEvent.create({ provider: "freemius", event_id: String(eventId), event_type: eventType || null });
    return false;
  } catch (error) {
    if (error?.code === 11000) return true;
    throw error;
  }
}

async function findInternalUser(email) {
  if (!email) return null;
  return User.findOne({ email: String(email).toLowerCase() });
}

async function findPlanByProviderId(providerPlanId) {
  if (!providerPlanId) return null;
  return BillingPlan.findOne({ provider_plan_id: String(providerPlanId), is_active: true }).lean();
}

// Shared by payment.created and subscription.created — both represent an
// active paid plan, and Freemius doesn't guarantee delivery order between
// them, so either one alone must be enough to activate.
//
// periodEnd is only known authoritatively from subscription.created's
// `next_payment` field — payment.created (fired for both the very first
// charge AND every renewal charge) carries no due date at all. When it's
// missing, extend by one cycle ONLY if the existing period has already
// elapsed (a genuine renewal) — otherwise keep the existing value as-is.
// Without that guard, the initial payment.created (which always fires
// alongside subscription.created for the same charge) would extend a
// freshly-created yearly subscription's end date an extra year on top of
// what subscription.created already set (e.g. 2026 -> 2028 instead of
// 2026 -> 2027). This estimate is what expireOverdueSubscriptions() checks
// against, so on actual renewals it still needs to keep advancing.
async function activateSubscription({
  eventType,
  providerSubscriptionId,
  planId,
  billingCycle,
  freemiusUser,
  periodStart,
  periodEnd,
}) {
  if (!providerSubscriptionId) {
    console.warn(`${eventType} had no subscription id — skipping (likely a one-off, non-recurring charge).`);
    return;
  }

  const [billingPlan, user, existing] = await Promise.all([
    findPlanByProviderId(planId),
    findInternalUser(freemiusUser?.email),
    Subscription.findOne({ provider_subscription_id: String(providerSubscriptionId) }).select(
      "billing_period current_period_end",
    ),
  ]);

  if (!billingPlan) {
    console.warn(`${eventType}: no billing_plans row for Freemius plan_id "${planId}" — run npm run seed:billing-plans.`);
    return;
  }

  if (!user) {
    console.warn(`${eventType}: no User found for email "${freemiusUser?.email}" — cannot attribute this subscription.`);
    return;
  }

  const now = new Date();
  const billingPeriod =
    billingCycle != null ? (Number(billingCycle) === 12 ? "yearly" : "monthly") : existing?.billing_period || "monthly";
  const amount = billingPeriod === "yearly" ? billingPlan.yearly_price : billingPlan.monthly_price;

  let resolvedPeriodEnd;

  if (periodEnd) {
    // Authoritative value straight from Freemius (subscription.created's next_payment).
    resolvedPeriodEnd = periodEnd;
  } else if (existing?.current_period_end && existing.current_period_end > now) {
    // Current period hasn't ended yet — this payment.created is confirming
    // the same charge subscription.created already accounted for. Don't extend.
    resolvedPeriodEnd = existing.current_period_end;
  } else {
    // No existing period, or it already elapsed — a genuine renewal.
    resolvedPeriodEnd = addBillingCycle(existing?.current_period_end || now, billingPeriod);
  }

  await Subscription.findOneAndUpdate(
    { provider_subscription_id: String(providerSubscriptionId) },
    {
      $set: {
        user_id: user._id,
        plan: billingPlan.plan,
        billing_period: billingPeriod,
        status: "active",
        provider: "freemius",
        provider_customer_id: freemiusUser?.id ? String(freemiusUser.id) : null,
        provider_subscription_id: String(providerSubscriptionId),
        amount,
        currency: billingPlan.currency,
        current_period_end: resolvedPeriodEnd,
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: now,
        ...(periodStart && { current_period_start: periodStart }),
        ...(!existing && !periodStart && { current_period_start: now }),
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

async function handlePaymentCreated(payload) {
  const payment = payload.objects?.payment;
  const freemiusUser = payload.objects?.user;

  if (!payment) {
    console.warn("payment.created missing objects.payment — skipping.", { id: payload.id });
    return;
  }

  await activateSubscription({
    eventType: "payment.created",
    providerSubscriptionId: payment.subscription_id,
    planId: payment.plan_id,
    billingCycle: null,
    freemiusUser,
    periodStart: null,
    periodEnd: null,
  });
}

async function handleSubscriptionCreated(payload) {
  const subscription = payload.objects?.subscription;
  const freemiusUser = payload.objects?.user;

  if (!subscription) {
    console.warn("subscription.created missing objects.subscription — skipping.", { id: payload.id });
    return;
  }

  await activateSubscription({
    eventType: "subscription.created",
    providerSubscriptionId: subscription.id,
    planId: subscription.plan_id,
    billingCycle: subscription.billing_cycle,
    freemiusUser,
    periodStart: parseFreemiusDate(subscription.created),
    periodEnd: parseFreemiusDate(subscription.next_payment),
  });
}

// Informational only — a past_due Subscription still counts as active plan
// access (see ACTIVE_PLAN_STATUSES in lib/entitlements.js). The hard access
// cutoff is time-based (see file header), not dependent on this event ever
// arriving.
async function handlePaymentFailed(payload) {
  const payment = payload.objects?.payment;

  if (!payment?.subscription_id) {
    console.warn("payment.failed missing objects.payment.subscription_id — skipping.", { id: payload.id });
    return;
  }

  const updated = await Subscription.findOneAndUpdate(
    { provider_subscription_id: String(payment.subscription_id) },
    { $set: { status: "past_due", updated_at: new Date() } },
  );

  if (!updated) {
    console.warn("payment.failed: no Subscription found for provider_subscription_id.", {
      provider_subscription_id: payment.subscription_id,
    });
  }
}

// Revokes access immediately, not at the end of the paid period — this
// product doesn't prorate cancellations or offer refunds (see BILLING
// POLICY note at the top of this file). `cancel_at_period_end` is
// deliberately left false here; it's unused by design, not an oversight.
async function handleSubscriptionCancelled(payload) {
  const subscription = payload.objects?.subscription;

  if (!subscription?.id) {
    console.warn("subscription.cancelled missing objects.subscription.id — skipping.", { id: payload.id });
    return;
  }

  const updated = await Subscription.findOneAndUpdate(
    { provider_subscription_id: String(subscription.id) },
    {
      $set: {
        status: "canceled",
        canceled_at: parseFreemiusDate(subscription.canceled_at) || new Date(),
        updated_at: new Date(),
      },
    },
  );

  if (!updated) {
    console.warn("subscription.cancelled: no Subscription found for provider_subscription_id.", {
      provider_subscription_id: subscription.id,
    });
  }
}

// license.expired doesn't carry a subscription id, only the license's own
// id/user_id — so instead of matching on provider_subscription_id, fall
// back to the user's most recent active Subscription (the same lookup the
// user_id+status+created_at index on Subscription already exists to serve).
async function handleLicenseExpired(payload) {
  const freemiusUser = payload.objects?.user;

  if (!freemiusUser?.email) {
    console.warn("license.expired missing objects.user.email — skipping.", { id: payload.id });
    return;
  }

  const user = await findInternalUser(freemiusUser.email);

  if (!user) {
    console.warn(`license.expired: no User found for email "${freemiusUser.email}".`);
    return;
  }

  const activeSubscription = await Subscription.findOne({
    user_id: user._id,
    status: { $in: ["active", "past_due"] },
  }).sort({ created_at: -1 });

  if (!activeSubscription) return;

  // "expired", not "canceled" — Freemius is telling us the license ran out,
  // not that the user (or anyone) actively cancelled it.
  activeSubscription.status = "expired";
  activeSubscription.expired_at = new Date();
  activeSubscription.updated_at = new Date();
  await activeSubscription.save();
}

const EVENT_HANDLERS = {
  "payment.created": handlePaymentCreated,
  "payment.failed": handlePaymentFailed,
  "subscription.created": handleSubscriptionCreated,
  "subscription.cancelled": handleSubscriptionCancelled,
  "license.expired": handleLicenseExpired,
};

export async function POST(request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-signature");

  if (!process.env.FREEMIUS_SECRET_KEY) {
    console.error("FREEMIUS_SECRET_KEY is not set — cannot verify webhook signatures.");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!isValidFreemiusSignature(rawBody, signatureHeader)) {
    console.warn("Rejected Freemius webhook with invalid signature.", {
      hasSignatureHeader: Boolean(signatureHeader),
    });
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload = rawBody;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Not valid JSON — nothing to process.
  }

  const eventType = typeof payload === "object" && payload !== null ? payload.type : null;

  // Logged for every delivery, handled or not — this is what lets a wrong
  // event-name guess (see the payment.failed NOTE above) get caught from
  // real traffic instead of silently never firing.
  console.log(`Freemius webhook received: ${eventType || "(missing type)"}`);

  if (eventType && HANDLED_EVENT_TYPES.has(eventType)) {
    console.log(`=== FREEMIUS WEBHOOK RECEIVED (${eventType}) ===`);
    console.log(JSON.stringify(payload, null, 2));

    try {
      await connectDB();

      if (!payload.id) {
        // No event id to dedupe against — processing it would leave no way
        // to distinguish a legitimate retry from a captured/replayed
        // payload, so fail closed rather than risk re-activating a
        // cancelled subscription.
        console.error(`Freemius webhook "${eventType}" has no payload.id — skipping (cannot guard against replay).`);
      } else if (await isDuplicateEvent(payload.id, eventType)) {
        console.warn(`Ignoring duplicate/replayed Freemius webhook event "${eventType}" (id: ${payload.id}).`);
      } else {
        await EVENT_HANDLERS[eventType](payload);
      }
    } catch (error) {
      // Ack with 200 anyway — retries would just hit the same DB error, and
      // Freemius's own dashboard keeps a delivery log to catch this from.
      console.error(`Failed processing Freemius webhook "${eventType}".`, error);
    }
  } else if (eventType && /payment|subscription|license/i.test(eventType)) {
    // Looks billing-relevant but isn't in HANDLED_EVENT_TYPES — either a
    // naming mismatch against one of our guessed event names, or a
    // genuinely new event type we don't handle yet. Full payload so it can
    // be confirmed and added rather than silently dropped.
    console.warn(`Unhandled billing-looking Freemius event "${eventType}":`, JSON.stringify(payload, null, 2));
  }

  return Response.json({ received: true }, { status: 200 });
}
