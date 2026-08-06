// PHASE 2 — signature verification. Every request's raw body must produce a
// HMAC-SHA256 hex digest (keyed with the product's Freemius Secret Key,
// found on the product's page — NOT the pk_/sk_ values on individual
// licenses) matching the X-Signature header, or it's rejected before we
// look at it. Still logging only — database writes are Phase 3.
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const LOGGED_EVENT_TYPES = new Set(["payment.created"]);

function isValidFreemiusSignature(rawBody, signatureHeader) {
  const secret = process.env.FREEMIUS_SECRET_KEY;

  if (!secret || !signatureHeader) return false;

  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // console.log(expectedSignature, "expectedSignature");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
    // console.log(expectedBuffer, "expectedBuffer");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");
    // console.log(receivedBuffer, "receivedBuffer");
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

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
    // Not valid JSON — fall through and log the raw text instead.
  }

  if (typeof payload === "object" && payload !== null && LOGGED_EVENT_TYPES.has(payload.type)) {
    console.log("=== FREEMIUS WEBHOOK RECEIVED (verified, payment) ===");
    console.log(JSON.stringify(payload, null, 2));
  }

  return Response.json({ received: true }, { status: 200 });
}
