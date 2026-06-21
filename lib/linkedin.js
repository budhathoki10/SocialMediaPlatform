export  function GetLinkedInUrl() {
  const params = new URLSearchParams({
    response_type: "code", // expect code from linked in to exchange for access token
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`,
    scope: "openid profile email w_member_social",
  });
  console.log("params for linkedin:", params.toString());
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}


