import "dotenv/config";

import { connectDB } from "../lib/db.js";
import { ActivityLog, GithubEvent } from "../lib/models.js";

async function migrate() {
  await connectDB();

  const events = await GithubEvent.find().lean();
  let migrated = 0;

  for (const event of events) {
    const alreadyLogged = await ActivityLog.exists({
      type: "draft_generated",
      user_id: event.user_id,
      created_at: event.created_at,
    });

    if (alreadyLogged) continue;

    await ActivityLog.create({
      user_id: event.user_id,
      type: "draft_generated",
      platform: "github",
      title: "AI Agent generated a draft post",
      description: `New draft created from ${event.repo_name}.`,
      post_id: event.post_id || null,
      created_at: event.created_at,
    });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} of ${events.length} GitHub events into activity_logs.`);
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
