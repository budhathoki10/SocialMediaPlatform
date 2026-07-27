// WhatsApp has no OAuth/connect flow or ConnectedAccount support yet (see
// app/dashboard/socials/whatsapp/page.tsx) — this route exists only to pass
// Meta's webhook verification handshake during WABA onboarding and to
// acknowledge events so Meta doesn't disable the subscription for timing
// out. It does not create drafts or route messages to a user; that needs a
// WhatsApp connect flow + ConnectedAccount platform support first.
export const dynamic = "force-dynamic";

// This GET handler is used by Meta to verify that this webhook endpoint belongs to you.
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("WhatsApp webhook event received (not yet processed — no WhatsApp connect flow exists):", JSON.stringify(body));

    return new Response("EVENT_RECEIVED", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("WhatsApp webhook POST error:", error);

    return new Response("Webhook error", { status: 500 });
  }
}
