import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { connectDB } from "../../../../lib/db";
import { User } from "../../../../lib/models";
const onboardingPath = "/onboarding";

/** @type {import("next-auth").AuthOptions} */
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
            prompt: "select_account  ",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    NEXTAUTH_JWT_EXPIRES_IN: 60 * 60 * 24 * 90, // 7 daysT
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      try {
        await connectDB();

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const newUser = new User({
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            plan: "free",
            timezone: "Asia/Kathmandu",
          });

          await newUser.save();
        }

        return true;
      } catch (error) {
        console.error("Error during sign-in:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.avatar_url;
        }
      }
//  console.log("  token.id: ", token.id);
//   console.log("  token.email: ", token.email);
//   console.log("  token.name: ", token.name);
//   console.log("  token.picture: ", token.picture);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      const onboardingUrl = `${baseUrl}${onboardingPath}`;

      if (url === baseUrl || url === `${baseUrl}/`) {
        return onboardingUrl;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);

        if (targetUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        return onboardingUrl;
      }

      return onboardingUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
