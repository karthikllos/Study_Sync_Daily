import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
      index: true,
    },
    password: {
      type: String,
      select: false,
      validate: {
        validator: function(password) {
          if (!password && !this.isOAuthUser) {
            return false;
          }
          if (password) {
            return (
              password.length >= 8 &&
              /(?=.*[a-z])/.test(password) &&
              /(?=.*[A-Z])/.test(password) &&
              /(?=.*\d)/.test(password) &&
              /(?=.*[@$!%*?&])/.test(password)
            );
          }
          return true;
        },
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
      }
    },
    profilepic: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      trim: true,
    },

    // New academic profile for StudySync Daily
    academicProfile: {
      institution: {
        type: String,
        trim: true,
        maxlength: [100, "Institution cannot exceed 100 characters"]
      },
      major: {
        type: String,
        trim: true,
        maxlength: [100, "Major cannot exceed 100 characters"]
      },
      targetHoursPerWeek: {
        type: Number,
        default: 0,
        min: [0, "targetHoursPerWeek must be >= 0"]
      }
    },

    // AI credits for micro-transaction features
    aiCredits: {
      type: Number,
      default: 5, // Free users get 5 monthly credits
      min: 0,
    },

    // Subscription fields for StudySync Pro
    isProSubscriber: {
      type: Boolean,
      default: false,
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Starter", "Pro", "Pro Max", "Premium"],
      default: "Free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    subscriptionRenewalDate: {
      type: Date,
      default: null,
    },
    creditMonthResetDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
      },
    },
    lastCreditPurchaseDate: Date,
    lastCreditPurchaseAmount: Number,
    lastCreditPaymentId: String,

    // Gamification: Study streak counter
    studyStreak: {
      type: Number,
      default: 0,
      min: [0, "studyStreak cannot be negative"]
    },

    // Accountability partner for collaborative features
    accountabilityPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // AI Profile for predictive features
    aiProfile: {
      optimalStudyHour: {
        type: Number,
        min: 0,
        max: 23,
        default: 14 // 2 PM default
      },
      predictionModelData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },

    // OAuth / auth metadata
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    oauthProviders: [{
      provider: String,
      providerId: String,
    }],

    // Verification and security fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Login tracking / protection
    lastLoginAt: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    accountLocked: {
      type: Boolean,
      default: false,
    },
    accountLockedUntil: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.loginAttempts;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
UserSchema.methods.isAccountLocked = function() {
  return !!(this.accountLocked && this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

// Method to increment login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { accountLocked: false, loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.accountLocked) {
    updates.$set = {
      accountLocked: true,
      accountLockedUntil: Date.now() + 2 * 60 * 60 * 1000,
    };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { accountLockedUntil: 1 },
    $set: { accountLocked: false, loginAttempts: 0 }
  });
};

// Static method to find user by email or username
UserSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

// Indexes
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ accountLockedUntil: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
