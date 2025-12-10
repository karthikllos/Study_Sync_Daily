import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto"; // <-- CRITICAL FIX: Added for password reset token generation

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: String,
    password: {
      type: String,
      select: false,
    },
    profilepic: String,

    // OAuth
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    oauthProviders: [{
      provider: String,
      providerId: String,
    }],

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Account security
    accountLocked: {
      type: Boolean,
      default: false,
    },
    accountLockedUntil: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lastLoginAt: Date,

    // Subscription Details
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Starter", "Pro", "Pro Max", "Premium"],
      default: "Free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "cancelled", "expired"],
      default: "inactive",
    },
    subscriptionStartDate: Date,
    subscriptionRenewalDate: Date,
    subscriptionPaymentId: String,

    // Credit tracking
    aiCredits: {
      type: Number,
      default: 5, // Free tier gets 5 credits
    },
    creditMonthResetDate: Date,

    // Purchase tracking
    lastCreditPurchaseDate: Date,
    lastCreditPurchaseAmount: Number,
    lastCreditPaymentId: String,

    // Payment history
    paymentHistory: [
      {
        razorpayPaymentId: String,
        razorpayOrderId: String,
        plan: String,
        amount: Number,
        status: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Daily Blueprint - Embedded Document
    dailyBlueprint: {
      type: {
        date: String,
        // Removed redundant userId reference
        routines: [
          {
            id: String,
            name: String,
            startTime: String,
            endTime: String,
            duration: Number,
            status: String,
            description: String,
          },
        ],
        assignments: [
          {
            id: String,
            title: String,
            subject: String,
            dueDate: Date,
            priority: { type: String, enum: ["low", "medium", "high"] },
            status: String,
            completed: Boolean,
          },
        ],
        microGoals: [
          {
            id: String,
            goal: String,
            targetTime: String,
            status: String,
            completed: Boolean,
          },
        ],
        focusPrediction: {
          score: Number,
          hours: [{ timestamp: Date, hourOfDay: Number, score: Number }],
        },
        createdAt: Date,
        updatedAt: Date,
      },
      default: null,
    },
    lastBlueprintUpdate: Date,

    // Admin access
    isAdmin: {
      type: Boolean,
      default: false,
    },

    // Academic Profile
    academicProfile: {
      institution: String,
      major: String,
      targetHoursPerWeek: Number,
      reflections: [
        {
          date: { type: Date, default: Date.now },
          energyRating: { type: Number, min: 1, max: 10, required: true },
          focusRating: { type: Number, min: 1, max: 10, required: true },
          uncompletedTasks: [String],
          tasksCompletedCount: { type: Number, default: 0 },
          totalHoursPlanned: { type: Number, default: 0 },
          totalHoursSpent: { type: Number, default: 0 },
          aiSummary: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Study tracking
    studyStreak: {
      type: Number,
      default: 0,
    },
    lastStudyDate: Date,
  },
  { timestamps: true }
);

// Mongoose Middleware to hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ ADDED: Helper method to create a password reset token
UserSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash the token and save it to the database
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiration to 1 hour (3600000 milliseconds)
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    
    // Return the unhashed token to be sent in the email
    return resetToken;
};


export default mongoose.models.User || mongoose.model("User", UserSchema);