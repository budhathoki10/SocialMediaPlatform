import { Subscription } from "./models.js";

const ACCESS_GRANTING_STATUSES = ["active", "past_due"];

// Hard cutoff, independent of Freemius webhooks: any subscription whose
// current_period_end has already passed loses paid access the next time
// this runs, regardless of whether Freemius has confirmed a cancellation
// or is still mid-retry on a failed renewal charge (that dunning window can
// run for days on Freemius's side). Called every minute from /api/cron
// (see app.js's scheduledPostCronTimer / app/api/cron/route.js), so the
// gap between a period actually ending and the user losing access is at
// most about a minute.
//
// Marking the Subscription "expired" here is the whole fix — a user's plan
// is derived from Subscription status (see getCurrentPlan in
// lib/entitlements.js), not stored on User, so there's no separate User
// write needed to actually revoke access. Deliberately "expired", not
// "canceled" — nobody cancelled anything, the plan just ran past its paid
// period with no renewal. See the status enum comment in lib/models.js.
export async function expireOverdueSubscriptions(now = new Date()) {
  const result = await Subscription.updateMany(
    { status: { $in: ACCESS_GRANTING_STATUSES }, current_period_end: { $ne: null, $lt: now } },
    { $set: { status: "expired", expired_at: now, updated_at: now } },
  );

  return { expired: result.modifiedCount };
}
