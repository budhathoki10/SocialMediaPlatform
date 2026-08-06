import "dotenv/config";

import { connectDB } from "../lib/db.js";
import { BillingPlan } from "../lib/models.js";

// Freemius Product ID is shared across all plans (Stores > Products > this product).
const FREEMIUS_PRODUCT_ID = process.env.FREEMIUS_PRODUCT_ID || null;

const PLANS = [
  {
    plan: "pro",
    title: "Pro",
    provider_product_id: FREEMIUS_PRODUCT_ID,
    provider_plan_id: process.env.FREEMIUS_PRO_PLAN_ID,
    monthly_price: 15,
    yearly_price: 144,
  },
  {
    plan: "unlimited",
    title: "Unlimited",
    provider_product_id: FREEMIUS_PRODUCT_ID,
    provider_plan_id: process.env.FREEMIUS_UNLIMITED_PLAN_ID || "60634",
    monthly_price: 39,
    yearly_price: 374,
  },
];

async function seed() {
  await connectDB();

  for (const plan of PLANS) {
    if (!plan.provider_plan_id) {
      console.warn(`Skipping "${plan.plan}" — no provider_plan_id set (check env vars).`);
      continue;
    }

    await BillingPlan.findOneAndUpdate(
      { plan: plan.plan },
      { $set: { ...plan, updated_at: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Upserted billing plan "${plan.plan}" -> Freemius plan_id ${plan.provider_plan_id}.`);
  }

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding billing plans failed:", error);
  process.exit(1);
});
