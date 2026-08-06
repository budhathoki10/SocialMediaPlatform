import { Subscription, User } from "./models.js";

const ACCESS_GRANTING_STATUSES = ["active", "past_due"];

// Hard cutoff, independent of Freemius webhooks: any subscription whose
// current_period_end has already passed loses paid access the next time
// this runs, regardless of whether Freemius has confirmed a cancellation
// or is still mid-retry on a failed renewal charge (that dunning window can
// run for days on Freemius's side). Called every minute from /api/cron
// (see app.js's scheduledPostCronTimer / app/api/cron/route.js), so the
// gap between a period actually ending and the user losing access is at
// most about a minute.
export async function expireOverdueSubscriptions(now = new Date()) {
  const overdue = await Subscription.find({
    status: { $in: ACCESS_GRANTING_STATUSES },
    current_period_end: { $ne: null, $lt: now },
  }).select("_id user_id");

  if (overdue.length === 0) {
    return { expired: 0 };
  }

  const subscriptionIds = overdue.map((subscription) => subscription._id);
  const userIds = [...new Set(overdue.map((subscription) => String(subscription.user_id)))];

  await Subscription.updateMany(
    { _id: { $in: subscriptionIds } },
    { $set: { status: "canceled", canceled_at: now, updated_at: now } },
  );

  await User.updateMany({ _id: { $in: userIds } }, { $set: { plan: "free" } });

  return { expired: overdue.length };
}
