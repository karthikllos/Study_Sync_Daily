import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const TemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ["routine", "task_set"],
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ["productivity", "exam_prep", "project", "wellness", "general"],
      default: "general"
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0 // 0 means free
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      // For routine type: array of Routine schema data
      // For task_set type: array of AcademicTask schema data
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    isPremium: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    reviews: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5
        },
        comment: {
          type: String,
          trim: true,
          maxlength: 500
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    purchasedBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        purchasedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

// Indexes for efficient querying
TemplateSchema.index({ type: 1, isPremium: 1, isPublished: 1 });
TemplateSchema.index({ tags: 1 });
TemplateSchema.index({ "rating.average": -1, downloads: -1 });
TemplateSchema.index({ creator: 1, createdAt: -1 });

// Virtual for revenue (for creator analytics)
TemplateSchema.virtual("revenue").get(function() {
  return this.purchasedBy.length * this.price;
});

// Method to check if user has purchased
TemplateSchema.methods.hasPurchased = function(userId) {
  return this.purchasedBy.some(p => p.user.toString() === userId.toString());
};

// Method to add review and update rating
TemplateSchema.methods.addReview = function(userId, rating, comment) {
  // Remove existing review from same user
  this.reviews = this.reviews.filter(r => r.user.toString() !== userId.toString());
  
  // Add new review
  this.reviews.push({ user: userId, rating, comment });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  return this.save();
};

export default models.Template || model("Template", TemplateSchema);
