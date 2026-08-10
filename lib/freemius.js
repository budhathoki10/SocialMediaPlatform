// Official Freemius SDK client (@freemius/sdk) — replaces the hand-rolled
// HMAC signature verification and manually-built checkout URLs that used to
// live in app/api/webhooks/freemius/route.js and app/api/billing/checkout.
// The SDK verifies webhook signatures itself (same x-signature header we
// used to check manually) and builds checkout links via an authenticated
// server-to-server call instead of a client-editable query string.
import { Freemius } from "@freemius/sdk";

export function isFreemiusConfigured() {
  return Boolean(
    process.env.FREEMIUS_PRODUCT_ID &&
      process.env.FREEMIUS_API_KEY &&
      process.env.FREEMIUS_SECRET_KEY &&
      process.env.FREEMIUS_PUBLIC_KEY,
  );
}

export const freemius = isFreemiusConfigured()
  ? new Freemius({
      productId: Number(process.env.FREEMIUS_PRODUCT_ID),
      apiKey: process.env.FREEMIUS_API_KEY,
      secretKey: process.env.FREEMIUS_SECRET_KEY,
      publicKey: process.env.FREEMIUS_PUBLIC_KEY,
    })
  : null;
