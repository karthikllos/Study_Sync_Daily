// models/AcademicTask.js
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const AcademicTaskSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ["assignment", "exam", "reading", "lecture_prep", "micro_goal", "project"],
      default: "assignment",
    },
    dueDate: { type: Date, required: true, index: true },
    estimatedDuration: { type: Number, default: 60, min: 5 },
    actualDuration: { type: Number, default: 0, min: 0 },
    priority: { type: Number, default: 3, min: 1, max: 5 },
    isCompleted: { type: Boolean, default: false, index: true },
    completedAt: Date,
    scheduledTime: Date,
  },
  { timestamps: true }
);

AcademicTaskSchema.index({ user: 1, isCompleted: 1, dueDate: 1 });

export default models.AcademicTask || model("AcademicTask", AcademicTaskSchema);