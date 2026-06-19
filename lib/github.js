export function GetGitHubUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: "repo read:user",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
