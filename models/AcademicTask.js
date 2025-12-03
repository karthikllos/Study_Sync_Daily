// Use Mongoose and define the AcademicTask schema for StudySync Daily.
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const AcademicTaskSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['assignment', 'exam', 'reading', 'micro_goal', 'lecture_prep'],
      required: true,
    },
    subject: { type: String, trim: true, maxlength: 50 },
    dueDate: { type: Date, required: true },
    estimatedDuration: { type: Number, min: 10 }, // Duration in minutes
    actualDuration: { type: Number, default: 0 },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    isCompleted: { type: Boolean, default: false },
    microGoals: [{
      title: String,
      completed: { type: Boolean, default: false },
    }],
    scheduledTime: Date, // For the planning engine
  },
  { timestamps: true }
);

// Add index on user and dueDate
AcademicTaskSchema.index({ user: 1, dueDate: 1 });

export default models.AcademicTask || model("AcademicTask", AcademicTaskSchema);