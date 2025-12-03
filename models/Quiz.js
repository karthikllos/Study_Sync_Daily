import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const QuizSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    academicTask: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTask",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    questions: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500
        },
        answer: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000
        },
        type: {
          type: String,
          enum: ["multiple_choice", "short_answer", "true_false"],
          default: "short_answer"
        },
        options: [String] // For multiple choice questions
      }
    ],
    attempts: [
      {
        score: {
          type: Number,
          min: 0,
          max: 100,
          required: true
        },
        attemptedAt: {
          type: Date,
          default: Date.now
        },
        timeTaken: Number, // in seconds
        answers: [String] // User's answers for each question
      }
    ],
    nextReviewDate: {
      type: Date,
      required: true,
      index: true
    },
    repetitionInterval: {
      type: Number,
      default: 1, // Days between reviews, follows spaced repetition algorithm
      min: 1
    },
    easinessFactor: {
      type: Number,
      default: 2.5, // For SM-2 spaced repetition algorithm
      min: 1.3
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound index for efficient querying
QuizSchema.index({ user: 1, nextReviewDate: 1 });
QuizSchema.index({ user: 1, academicTask: 1 });

// Method to calculate next review date based on SM-2 algorithm
QuizSchema.methods.calculateNextReview = function(quality) {
  // quality: 0-5 (0=complete blackout, 5=perfect response)
  if (quality < 3) {
    // Reset interval if quality is poor
    this.repetitionInterval = 1;
  } else {
    if (this.repetitionInterval === 1) {
      this.repetitionInterval = 6;
    } else {
      this.repetitionInterval = Math.round(this.repetitionInterval * this.easinessFactor);
    }
  }

  // Adjust easiness factor
  this.easinessFactor = Math.max(
    1.3,
    this.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Set next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + this.repetitionInterval);
  this.nextReviewDate = nextDate;

  return this.nextReviewDate;
};

export default models.Quiz || model("Quiz", QuizSchema);
