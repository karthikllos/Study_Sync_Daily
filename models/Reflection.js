// models/Reflection.js
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const ReflectionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, index: true },
    energyRating: { type: Number, required: true, min: 1, max: 10 },
    focusRating: { type: Number, required: true, min: 1, max: 10 },
    completedTasks: [{ type: Schema.Types.ObjectId, ref: "AcademicTask" }],
    uncompletedTasks: [{ type: Schema.Types.ObjectId, ref: "AcademicTask" }],
    tasksReviewed: { type: Number, default: 0 },
    tasksCompletedCount: { type: Number, default: 0 },
    totalHoursSpent: { type: Number, default: 0 },
    aiSummary: String,
  },
  { timestamps: true }
);

ReflectionSchema.index({ user: 1, date: -1 });

export default models.Reflection || model("Reflection", ReflectionSchema);