// One-off backfill: `amount`/`currency` were added to subscriptionSchema
// (lib/models.js) so the price is visible directly on each Subscription
// document instead of requiring a join to billing_plans. This fills in
// those fields on every subscription that predates the change, using each
// doc's own plan + billing_period to look up the matching billing_plans price.
import "dotenv/config";

import { connectDB } from "../lib/db.js";
import { BillingPlan, Subscription } from "../lib/models.js";

async function migrate() {
  await connectDB();

  const billingPlans = await BillingPlan.find({}).lean();
  let updated = 0;

  for (const billingPlan of billingPlans) {
    for (const billingPeriod of ["monthly", "yearly"]) {
      const amount = billingPeriod === "yearly" ? billingPlan.yearly_price : billingPlan.monthly_price;

      const result = await Subscription.collection.updateMany(
        { plan: billingPlan.plan, billing_period: billingPeriod, amount: { $exists: false } },
        { $set: { amount, currency: billingPlan.currency } },
      );

      updated += result.modifiedCount;
    }
  }

  console.log(`Backfilled amount/currency on ${updated} subscription(s).`);
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
