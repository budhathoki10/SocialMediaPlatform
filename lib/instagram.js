// Builds the authorization URL for the Instagram-native "Instagram API with
// Instagram Login" product — NOT the old Facebook Login for Business flow.
// This app is configured in the Meta dashboard for the native flow only, which
// means a different host (instagram.com, not facebook.com/dialog/oauth), a
// different client_id/secret pair (INSTAGRAM_APP_ID/SECRET, not the old
// INSTAGRAM_CLIENT_ID/SECRET), and different scope names. Do not swap this
// back to the Facebook flow without also reconfiguring the Meta app.
export function GetInstagramURL() {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`,
    scope: [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
    ].join(","),
    response_type: "code",
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}
