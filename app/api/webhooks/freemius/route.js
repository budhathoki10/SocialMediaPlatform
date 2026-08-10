// Thin route — every Freemius-specific detail lives in lib/billing/freemius.js.
import { connectDB } from "@/lib/db";
import { billing } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(request) {
  await connectDB();
  return billing.handleWebhookRequest(request);
}
