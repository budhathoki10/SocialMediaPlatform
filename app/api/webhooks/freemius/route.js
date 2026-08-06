// PHASE 1 — logging only. Receives Freemius webhook POSTs and returns 200
// immediately for every event (Freemius retries on non-2xx / slow
// responses), but only console.logs events that represent a completed
// payment — Freemius fires many events per checkout (cart, user, card,
// subscription, license, ...) and only "payment.created" is the actual
// successful charge.
// PHASE 2 will add signature verification and database writes — do not
// treat anything logged here as verified/trusted yet.

export const dynamic = "force-dynamic";

const LOGGED_EVENT_TYPES = new Set(["payment.created"]);

export async function POST(request) {
  const headers = Object.fromEntries(request.headers.entries());
  const rawBody = await request.text();

  let payload = rawBody;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Not valid JSON — fall through and log the raw text instead.
  }

  if (typeof payload === "object" && payload !== null && LOGGED_EVENT_TYPES.has(payload.type)) {
    console.log("=== FREEMIUS WEBHOOK RECEIVED (payment) ===");
    console.log("--- Headers ---");
    console.log(JSON.stringify(headers, null, 2));
    console.log("--- Payload ---");
    console.log(JSON.stringify(payload, null, 2));
  }

  return Response.json({ received: true }, { status: 200 });
}
