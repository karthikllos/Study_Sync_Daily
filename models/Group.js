import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member"
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "AcademicTask"
      }
    ],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    settings: {
      isPublic: {
        type: Boolean,
        default: false
      },
      maxMembers: {
        type: Number,
        default: 10,
        min: 2,
        max: 50
      }
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
GroupSchema.index({ creator: 1, createdAt: -1 });
GroupSchema.index({ "members.user": 1 });

// Virtual for member count
GroupSchema.virtual("memberCount").get(function() {
  return this.members.length;
});

// Method to check if user is a member
GroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is admin
GroupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member && (member.role === "admin" || this.creator.toString() === userId.toString());
};

// Static method to generate unique invite code
GroupSchema.statics.generateInviteCode = function() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export default models.Group || model("Group", GroupSchema);
