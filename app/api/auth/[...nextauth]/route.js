import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { connectDB } from "../../../../lib/db";
import { ConnectedAccount, User } from "../../../../lib/models";

const onboardingPath = "/onboarding";
const sessionMaxAge = 60 * 60 * 24 * 90;
const supportedPlatforms = ["github", "linkedin", "instagram"];

function isUnsafeCallbackPath(path) {
  return (
    path === "/login" ||
    path.startsWith("/login?") ||
    path === "/error" ||
    path.startsWith("/error?") ||
    path === "/api/auth/error" ||
    path.startsWith("/api/auth/error?")
  );
}

function normalizeAuthUser(profile) {
  if (!profile?.email) {
    return null;
  }

  return {
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email.split("@")[0],
    avatar_url: profile.image || profile.picture || null,
    plan: "free",
    timezone: "Asia/Kathmandu",
  };
}

function formatConnection(account) {
  if (!account) {
    return null;
  }

  return {
    connected: true,
    username: account.platform_username,
    connected_at: account.connected_at?.toISOString?.() || account.connected_at || null,
  };
}

function formatConnectedAccounts(accounts) {
  const accountsByPlatform = new Map(accounts.map((account) => [account.platform, account]));

  return {
    github: formatConnection(accountsByPlatform.get("github")),
    linkedin: formatConnection(accountsByPlatform.get("linkedin")),
    instagram: formatConnection(accountsByPlatform.get("instagram")),
  };
}

async function findOrCreateUser(profile) {
  const authUser = normalizeAuthUser(profile);

  if (!authUser) {
    return null;
  }

  await connectDB();

  return User.findOneAndUpdate(
    { email: authUser.email },
    {
      $setOnInsert: {
        email: authUser.email,
        plan: authUser.plan,
        timezone: authUser.timezone,
      },
      $set: {
        name: authUser.name,
        avatar_url: authUser.avatar_url,
      },
    },
    { new: true, upsert: true, runValidators: true },
  );
}

async function loadConnectedAccounts(userId) {
  if (!userId) {
    return { github: null, linkedin: null, instagram: null };
  }

  await connectDB();

  const accounts = await ConnectedAccount.find({
    user_id: userId,
    platform: { $in: supportedPlatforms },
    status: "active",
  })
    .select("platform platform_username connected_at")
    .lean();

  return formatConnectedAccounts(accounts);
}

/** @type {import("next-auth").AuthOptions} */
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAge,
  },
  jwt: {
    maxAge: sessionMaxAge,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) {
        console.error("Google sign-in denied because no email was returned.");
        return false;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.connected_accounts) {
        token.connected_accounts = session.connected_accounts;
      }

      const email = user?.email || token.email;

      if (email && (!token.id || user)) {
        try {
          const dbUser = await findOrCreateUser({
            email,
            name: user?.name || token.name,
            image: user?.image || token.picture,
          });

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.avatar_url;
            token.connected_accounts = await loadConnectedAccounts(dbUser._id);
          }
        } catch (error) {
          console.error("Google sign-in succeeded, but Mongo user sync failed:", error);
          token.email = email;
          token.name = user?.name || token.name;
          token.picture = user?.image || token.picture;
        }
      }

      if (token.id && !token.connected_accounts) {
        token.connected_accounts = await loadConnectedAccounts(token.id);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }

      session.connected_accounts = token.connected_accounts || { github: null, linkedin: null, instagram: null };

      return session;
    },
    async redirect({ url, baseUrl }) {
      const onboardingUrl = `${baseUrl}${onboardingPath}`;

      if (url === baseUrl || url === `${baseUrl}/`) {
        return onboardingUrl;
      }

      if (url.startsWith("/")) {
        if (isUnsafeCallbackPath(url)) {
          return onboardingUrl;
        }

        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);

        if (targetUrl.origin === baseUrl) {
          const targetPath = `${targetUrl.pathname}${targetUrl.search}`;

          if (isUnsafeCallbackPath(targetPath)) {
            return onboardingUrl;
          }

          return url;
        }
      } catch {
        return onboardingUrl;
      }

      return onboardingUrl;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
