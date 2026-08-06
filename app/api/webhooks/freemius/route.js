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
// NOTE: "payment.failed" is my best-guess event name following Freemius's
// own <entity>.<action> convention (payment.created, subscription.created,
// ...) — it has not been observed in a real payload. Confirm the exact name
// against the event checklist on the product's Freemius webhook settings
// page and adjust HANDLED_EVENT_TYPES/EVENT_HANDLERS below if it differs.
import crypto from "node:crypto";

import { connectDB } from "@/lib/db";
import { BillingPlan, Subscription, User } from "@/lib/models";

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
// `next_payment` field — payment.created (a renewal charge) carries no due
// date at all. When it's missing, we approximate one billing cycle forward
// from whichever is later: the subscription's existing current_period_end
// or now. This estimate is what expireOverdueSubscriptions() checks against,
// so it needs to keep advancing on every renewal or paying customers would
// eventually get falsely downgraded.
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
  const resolvedPeriodEnd =
    periodEnd ||
    addBillingCycle(
      existing?.current_period_end && existing.current_period_end > now ? existing.current_period_end : now,
      billingPeriod,
    );

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

  await User.updateOne({ _id: user._id }, { $set: { plan: billingPlan.plan } });
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

// Informational only — does NOT touch User.plan. The hard access cutoff is
// time-based (see file header), not dependent on this event ever arriving.
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
    return;
  }

  await User.updateOne({ _id: updated.user_id }, { $set: { plan: "free" } });
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

  activeSubscription.status = "canceled";
  activeSubscription.canceled_at = new Date();
  activeSubscription.updated_at = new Date();
  await activeSubscription.save();

  await User.updateOne({ _id: user._id }, { $set: { plan: "free" } });
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

  if (eventType && HANDLED_EVENT_TYPES.has(eventType)) {
    console.log(`=== FREEMIUS WEBHOOK RECEIVED (${eventType}) ===`);
    console.log(JSON.stringify(payload, null, 2));

    try {
      await connectDB();
      await EVENT_HANDLERS[eventType](payload);
    } catch (error) {
      // Ack with 200 anyway — retries would just hit the same DB error, and
      // Freemius's own dashboard keeps a delivery log to catch this from.
      console.error(`Failed processing Freemius webhook "${eventType}".`, error);
    }
  }

  return Response.json({ received: true }, { status: 200 });
}
