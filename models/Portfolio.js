import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const PortfolioSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'photography',
        'digital_art',
        'traditional_art',
        'music',
        'video',
        'animation',
        'design',
        'writing',
        'code',
        'crafts',
        'other'
      ],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['image', 'video', 'audio', 'document', 'link'],
      index: true,
    },
    
    // File information
    files: [{
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
      mimetype: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      thumbnail: {
        type: String, // Thumbnail URL for videos and images
      },
      duration: {
        type: Number, // Duration for audio/video in seconds
      },
      dimensions: {
        width: Number,
        height: Number,
      },
    }],
    
    // External link (for showcasing work hosted elsewhere)
    externalLink: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'External link must be a valid URL'
      }
    },
    
    // Metadata
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, "Tag cannot exceed 30 characters"],
    }],
    
    // Engagement metrics
    views: {
      type: Number,
      default: 0,
    },
    likes: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Visibility and status
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    
    // Organization
    order: {
      type: Number,
      default: 0,
    },
    
    // Comments/Reviews
    allowComments: {
      type: Boolean,
      default: true,
    },
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, "Comment cannot exceed 500 characters"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Technical metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Virtual for like count
PortfolioSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
PortfolioSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Indexes for performance
PortfolioSchema.index({ creator: 1, createdAt: -1 });
PortfolioSchema.index({ creator: 1, category: 1 });
PortfolioSchema.index({ creator: 1, status: 1 });
PortfolioSchema.index({ creator: 1, isFeatured: -1, order: 1 });
PortfolioSchema.index({ tags: 1 });

// Static method to get creator's portfolio
PortfolioSchema.statics.getCreatorPortfolio = function(creatorId, options = {}) {
  const {
    category = null,
    status = 'published',
    isPublic = true,
    limit = 20,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  let query = {
    creator: creatorId,
    status: status,
    isPublic: isPublic,
  };

  if (category) {
    query.category = category;
  }

  const sortOption = {};
  sortOption[sortBy] = sortOrder;

  return this.find(query)
    .sort(sortOption)
    .limit(limit)
    .skip(skip)
    .populate('creator', 'username name profilepic')
    .select('-comments.user -likes.user'); // Optimize query
};

// Method to increment view count
PortfolioSchema.methods.incrementViews = function() {
  return this.updateOne({ $inc: { views: 1 } });
};

// Method to toggle like
PortfolioSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    // Remove like
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    // Add like
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Pre-save middleware to set order for new items
PortfolioSchema.pre('save', async function(next) {
  if (this.isNew && this.order === 0) {
    try {
      const maxOrder = await this.constructor.findOne(
        { creator: this.creator },
        {},
        { sort: { order: -1 } }
      );
      this.order = maxOrder ? maxOrder.order + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Export the Portfolio model
export default models.Portfolio || model("Portfolio", PortfolioSchema);