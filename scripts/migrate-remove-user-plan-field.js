// One-off cleanup: `plan` was removed from userSchema (lib/models.js) — a
// user's plan is now derived from their subscriptions collection, not
// stored on the User document. Mongoose dropping a field from the schema
// doesn't retroactively strip it from documents already in MongoDB, so
// this physically unsets it from every existing user.
import "dotenv/config";

import { connectDB } from "../lib/db.js";
import { User } from "../lib/models.js";

async function migrate() {
  await connectDB();

  // Uses the raw driver collection, not User.updateMany — Mongoose's strict
  // mode silently drops $unset on fields no longer declared in the schema
  // (which is exactly `plan` here), turning a Model-level updateMany into a
  // no-op. The raw collection bypasses that schema filtering.
  const result = await User.collection.updateMany({ plan: { $exists: true } }, { $unset: { plan: "" } });

  console.log(`Removed the "plan" field from ${result.modifiedCount} user(s).`);
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
