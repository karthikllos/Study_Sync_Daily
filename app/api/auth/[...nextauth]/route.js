import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import mongoose from "mongoose";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const authOptions = {
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
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email"
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          console.log("[AUTH] Starting login for:", credentials.email);
          await connectDb();
          
          // Find user by email or username - first check if the static method exists
          let user;
          if (User.findByEmailOrUsername) {
            console.log("[AUTH] Using findByEmailOrUsername method");
            user = await User.findByEmailOrUsername(credentials.email)
              .select("+password +loginAttempts +accountLocked +accountLockedUntil");
          } else {
            console.log("[AUTH] Using fallback user search");
            // Fallback to manual search
            user = await User.findOne({
              $or: [
                { email: credentials.email.toLowerCase() },
                { username: credentials.email.toLowerCase() }
              ]
            }).select("+password +loginAttempts +accountLocked +accountLockedUntil");
          }
          
          console.log("[AUTH] User found:", !!user, user ? `email: ${user.email}` : 'no user');
          
          if (!user) {
            console.log("[AUTH] No user found for:", credentials.email);
            throw new Error("No account found with this email");
          }

          // Check if account is locked
          const isLocked = user.isAccountLocked ? user.isAccountLocked() : 
            (user.accountLocked && user.accountLockedUntil && user.accountLockedUntil > Date.now());
          
          if (isLocked) {
            throw new Error("Account temporarily locked due to too many failed attempts. Try again later.");
          }

          // Check if user has password (not OAuth-only)
          if (!user.password) {
            throw new Error("Please sign in using your social account or reset your password");
          }

          // Verify password
          console.log("[AUTH] Starting password verification");
          console.log("[AUTH] User has password:", !!user.password);
          console.log("[AUTH] User has comparePassword method:", !!user.comparePassword);
          
          let isValidPassword = false;
          try {
            if (user.comparePassword) {
              console.log("[AUTH] Using comparePassword method");
              isValidPassword = await user.comparePassword(credentials.password);
            } else {
              console.log("[AUTH] Using fallback bcrypt compare");
              // Fallback password comparison
              const bcrypt = require('bcryptjs');
              isValidPassword = await bcrypt.compare(credentials.password, user.password);
            }
            console.log("[AUTH] Password comparison result:", isValidPassword);
          } catch (passwordError) {
            console.error("[AUTH] Password comparison error:", passwordError);
            isValidPassword = false;
          }
          
          if (!isValidPassword) {
            // Increment login attempts
            if (user.incrementLoginAttempts) {
              await user.incrementLoginAttempts();
            } else {
              // Fallback increment
              await user.updateOne({ 
                $inc: { loginAttempts: 1 },
                ...(user.loginAttempts + 1 >= 5 ? {
                  $set: {
                    accountLocked: true,
                    accountLockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000)
                  }
                } : {})
              });
            }
            throw new Error("Invalid password");
          }

          // Success - reset login attempts and update last login
          console.log("[AUTH] Password verified successfully, resetting login attempts");
          if (user.resetLoginAttempts) {
            await user.resetLoginAttempts();
          } else {
            // Fallback reset
            await user.updateOne({
              $unset: { accountLockedUntil: 1 },
              $set: { accountLocked: false, loginAttempts: 0 }
            });
          }
          await user.updateOne({ lastLoginAt: new Date() });

          const returnUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.profilepic,
          };
          
          console.log("[AUTH] Login successful for:", returnUser.email);
          return returnUser;
        } catch (error) {
          console.error("Credentials auth error:", error.message);
          throw new Error(error.message);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    GitHubProvider({
      // ✅ Fixed: Use consistent naming with .env.local
      clientId: process.env.GITHUB_CLIENT_ID, // Changed from GITHUB_ID
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // Changed from GITHUB_SECRET
      authorization: {
        params: { scope: "read:user user:email", prompt: "select_account" },
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: { params: { scope: "r_liteprofile r_emailaddress" } },
      profile(profile) {
        // Normalize LinkedIn profile
        const emailFromElements =
          profile?.elements?.[0]?.["handle~"]?.emailAddress;
        const email =
          profile?.email ||
          profile?.emailAddress ||
          emailFromElements ||
          null;
        const firstName =
          profile?.localizedFirstName || profile?.firstName?.localized?.en_US;
        const lastName =
          profile?.localizedLastName || profile?.lastName?.localized?.en_US;
        const name =
          [firstName, lastName].filter(Boolean).join(" ") ||
          profile?.name ||
          "LinkedIn User";
        const image =
          profile?.profilePicture?.["displayImage~"]?.elements?.[0]
            ?.identifiers?.[0]?.identifier || null;
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
    signIn: "/auth", // ✅ unified page
    error: "/auth",  // ✅ errors also go to /auth
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Normalize email across providers
        if (!user.email) {
          const maybeEmail =
            profile?.email ||
            profile?.emailAddress ||
            profile?.elements?.[0]?.["handle~"]?.emailAddress;
          if (maybeEmail) user.email = maybeEmail;
        }

        if (!user.email) {
          console.error("No email found from provider; cannot create account");
          return false;
        }

        try {
          await connectDb();
        } catch (connErr) {
          console.error("MongoDB connection error during signIn:", connErr);
          // Allow sign-in to proceed even if DB fails
          return true;
        }

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Generate unique username
          const baseUsername =
            (user.name?.replace(/\s+/g, "").toLowerCase() ||
              user.email.split("@")[0]).slice(0, 24);
          let uniqueUsername = baseUsername;
          let suffix = 0;

          while (await User.findOne({ username: uniqueUsername })) {
            suffix += 1;
            uniqueUsername = `${baseUsername}${suffix}`.slice(0, 30);
          }

          await User.create({
            email: user.email,
            name: user.name,
            profilepic: user.image,
            username: uniqueUsername,
            isOAuthUser: true,
            isEmailVerified: true, // OAuth emails are pre-verified
            oauthProviders: [{
              provider: account.provider,
              providerId: account.providerAccountId
            }],
            lastLoginAt: new Date(),
          });
        } else {
          // Update existing OAuth user
          await existingUser.updateOne({
            lastLoginAt: new Date(),
            // Add provider if not already present
            $addToSet: {
              oauthProviders: {
                provider: account.provider,
                providerId: account.providerAccountId
              }
            }
          });
        }

        return true;
      } catch (err) {
        console.error("signIn callback unexpected error:", err);
        return true;
      }
    },

    async session({ session }) {
      try {
        await connectDb();
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
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
