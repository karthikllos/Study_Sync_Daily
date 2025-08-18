import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import mongoose from "mongoose";
import User from "@/models/user";
import Payment from "@/models/Payment";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  logger: {
    error(code, metadata) {
      console.error("[NextAuth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth][warn]", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[NextAuth][debug]", code, metadata);
      }
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: { params: { scope: "read:user user:email", prompt: "select_account" } }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: { params: { scope: "r_liteprofile r_emailaddress" } },
      profile(profile) {
        // Normalize profile to ensure email when available
        const emailFromElements = profile?.elements?.[0]?.["handle~"]?.emailAddress;
        const email = profile?.email || profile?.emailAddress || emailFromElements || null;
        const firstName = profile?.localizedFirstName || profile?.firstName?.localized?.en_US;
        const lastName = profile?.localizedLastName || profile?.lastName?.localized?.en_US;
        const name = [firstName, lastName].filter(Boolean).join(" ") || profile?.name || "LinkedIn User";
        const image = profile?.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier || null;
        return {
          id: profile.id,
          name,
          email,
          image,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Try to normalize email across providers, especially LinkedIn
        if (!user.email) {
          const maybeEmail = profile?.email || profile?.emailAddress || profile?.elements?.[0]?.["handle~"]?.emailAddress;
          if (maybeEmail) user.email = maybeEmail;
        }

        if (!user.email) {
          console.error("No email found from provider; cannot create account");
          return false;
        }

        try {
          await mongoose.connect(process.env.MONGODB_URI);
        } catch (connErr) {
          console.error("MongoDB connection error during signIn:", connErr);
          // Allow sign-in to proceed to avoid AccessDenied; session callback will degrade gracefully
          return true;
        }

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Generate a unique username
          const baseUsername = (user.name?.replace(/\s+/g, "").toLowerCase() || user.email.split("@")[0]).slice(0, 24);
          let uniqueUsername = baseUsername;
          let suffix = 0;
          // Ensure uniqueness by appending numeric suffix if needed
          while (await User.findOne({ username: uniqueUsername })) {
            suffix += 1;
            uniqueUsername = `${baseUsername}${suffix}`.slice(0, 30);
          }

          await User.create({
            email: user.email,
            name: user.name,
            profilepic: user.image,
            username: uniqueUsername,
          });
        }

        return true;
      } catch (err) {
        console.error("signIn callback unexpected error:", err);
        // Do not block login on unexpected non-auth errors
        return true;
      }
    },

    async session({ session }) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.username = dbUser.username;
          session.user.profilepic = dbUser.profilepic;
        }
        return session;
      } catch (err) {
        console.error("session callback error:", err);
        return session;
      }
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/`;
    }
  }
});

export { handler as GET, handler as POST };
