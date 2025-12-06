import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import connectDb from "./connectDb";
import User from "../models/user";
import bcryptjs from "bcryptjs";

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
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          console.log("[AUTH] Starting login for:", credentials.email);
          await connectDb();

          const user = await User.findOne({
            $or: [
              { email: credentials.email.toLowerCase() },
              { username: credentials.email.toLowerCase() },
            ],
          }).select("+password +loginAttempts +accountLocked +accountLockedUntil");

          console.log("[AUTH] User found:", !!user, user ? `email: ${user.email}` : "no user");

          if (!user) {
            console.log("[AUTH] No user found for:", credentials.email);
            throw new Error("No account found with this email");
          }

          const isLocked =
            user.accountLocked &&
            user.accountLockedUntil &&
            user.accountLockedUntil > Date.now();

          if (isLocked) {
            throw new Error(
              "Account temporarily locked due to too many failed attempts. Try again later."
            );
          }

          if (!user.password) {
            throw new Error(
              "Please sign in using your social account or reset your password"
            );
          }

          console.log("[AUTH] Starting password verification");
          let isValidPassword = false;
          try {
            isValidPassword = await bcryptjs.compare(
              credentials.password,
              user.password
            );
            console.log("[AUTH] Password comparison result:", isValidPassword);
          } catch (passwordError) {
            console.error("[AUTH] Password comparison error:", passwordError);
            isValidPassword = false;
          }

          if (!isValidPassword) {
            const newAttempts = (user.loginAttempts || 0) + 1;
            const updateData = {
              loginAttempts: newAttempts,
            };

            if (newAttempts >= 5) {
              updateData.accountLocked = true;
              updateData.accountLockedUntil = new Date(
                Date.now() + 2 * 60 * 60 * 1000
              );
            }

            await User.findByIdAndUpdate(user._id, updateData);
            throw new Error("Invalid password");
          }

          console.log(
            "[AUTH] Password verified successfully, resetting login attempts"
          );
          await User.findByIdAndUpdate(user._id, {
            accountLocked: false,
            loginAttempts: 0,
            accountLockedUntil: null,
            lastLoginAt: new Date(),
          });

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
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: { scope: "read:user user:email", prompt: "select_account" },
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: { params: { scope: "r_liteprofile r_emailaddress" } },
      profile(profile) {
        const emailFromElements =
          profile?.elements?.[0]?.["handle~"]?.emailAddress;
        const email =
          profile?.email || profile?.emailAddress || emailFromElements || null;
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
    signIn: "/auth",
    error: "/auth",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
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
          return true;
        }

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const baseUsername = (
            user.name?.replace(/\s+/g, "").toLowerCase() ||
            user.email.split("@")[0]
          )
            .slice(0, 24)
            .toLowerCase();
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
            isEmailVerified: true,
            oauthProviders: [
              {
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            ],
            lastLoginAt: new Date(),
          });
        } else {
          await existingUser.updateOne({
            lastLoginAt: new Date(),
            $addToSet: {
              oauthProviders: {
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            },
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