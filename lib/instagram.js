export function GetInstagramURL() {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID,        
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`,
    scope: [
      "instagram_basic",
      "instagram_manage_messages",
      "instagram_content_publish",
      "instagram_manage_comments",
      "pages_manage_metadata",
      "pages_read_engagement",
      "pages_show_list",
        "pages_manage_posts",      
      "business_management", 
    ].join(","),
    response_type: "code",                           
  });

  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
 
}
