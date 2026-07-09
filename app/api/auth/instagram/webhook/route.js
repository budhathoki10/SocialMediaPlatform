export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("Instagram webhook verification request:", {
    mode,
    token,
    challenge,
    envToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
  });

  if (
    mode === "subscribe" &&
    token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
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

    console.log("Instagram webhook event received:");
    console.log(JSON.stringify(body, null, 2));

    return new Response("EVENT_RECEIVED", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Instagram webhook POST error:", error);

    return new Response("Webhook error", {
      status: 500,
    });
  }
}   