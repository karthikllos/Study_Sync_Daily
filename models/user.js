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
      select: false, // Don't include password in queries by default
      validate: {
        validator: function(password) {
          // Only validate password if it's being set (not for OAuth users)
          if (!password && !this.isOAuthUser) {
            return false;
          }
          if (password) {
            // Password strength validation
            return (
              password.length >= 8 &&
              /(?=.*[a-z])/.test(password) && // lowercase
              /(?=.*[A-Z])/.test(password) && // uppercase
              /(?=.*\d)/.test(password) && // number
              /(?=.*[@$!%*?&])/.test(password) // special character
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
    
    // Creator Profile Fields
    isCreator: {
      type: Boolean,
      default: false,
    },
    profileSetupComplete: {
      type: Boolean,
      default: false,
    },
    creatorProfile: {
      displayName: {
        type: String,
        trim: true,
        maxlength: [100, "Display name cannot exceed 100 characters"],
      },
      tagline: {
        type: String,
        trim: true,
        maxlength: [150, "Tagline cannot exceed 150 characters"],
      },
      category: {
        type: String,
        enum: ['artist', 'musician', 'writer', 'photographer', 'developer', 'designer', 'content_creator', 'educator', 'entrepreneur', 'other'],
      },
      location: {
        type: String,
        trim: true,
        maxlength: [100, "Location cannot exceed 100 characters"],
      },
      website: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Website must be a valid URL starting with http:// or https://'
        }
      },
      socialLinks: {
        instagram: String,
        twitter: String,
        youtube: String,
        linkedin: String,
        github: String,
        behance: String,
        dribbble: String,
      },
      skills: [{
        type: String,
        trim: true,
        maxlength: [50, "Skill cannot exceed 50 characters"],
      }],
      achievements: [{
        title: String,
        description: String,
        date: Date,
        link: String,
      }],
    },
    
    // Bank Details for Payouts
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
        maxlength: [100, "Account holder name cannot exceed 100 characters"],
      },
      accountNumber: {
        type: String,
        trim: true,
        select: false, // Don't include in regular queries
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please enter a valid IFSC code"],
      },
      bankName: {
        type: String,
        trim: true,
        maxlength: [100, "Bank name cannot exceed 100 characters"],
      },
      branchName: {
        type: String,
        trim: true,
        maxlength: [100, "Branch name cannot exceed 100 characters"],
      },
      upiId: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9.-]{2,}@[a-zA-Z]{2,}$/, "Please enter a valid UPI ID"],
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    
    // Creator Statistics
    creatorStats: {
      totalSupport: {
        type: Number,
        default: 0,
      },
      supportersCount: {
        type: Number,
        default: 0,
      },
      totalWithdrawn: {
        type: Number,
        default: 0,
      },
      portfolioViews: {
        type: Number,
        default: 0,
      },
    },
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    oauthProviders: [{
      provider: String, // 'google', 'github', 'linkedin'
      providerId: String,
    }],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
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
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { accountLocked: false, loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it's not locked, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.accountLocked) {
    updates.$set = {
      accountLocked: true,
      accountLockedUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
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

// Index for performance
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ accountLockedUntil: 1 }, { expireAfterSeconds: 0 });

// Prevent model overwrite error in dev
export default mongoose.models.User || mongoose.model("User", UserSchema);
