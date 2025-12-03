// Define the Mongoose schema for the Evening Reflection summary.
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const ReflectionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true, default: Date.now },
    energyRating: { type: Number, min: 1, max: 5 },
    focusRating: { type: Number, min: 1, max: 5 },
    tasksCompletedCount: { type: Number, default: 0 },
    uncompletedTasks: [{ 
      type: Schema.Types.ObjectId, 
      ref: "AcademicTask" 
    }],
    totalHoursPlanned: { type: Number, default: 0 },
    totalHoursSpent: { type: Number, default: 0 },
    aiSummary: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

ReflectionSchema.index({ user: 1, date: -1 });

export default models.Reflection || model("Reflection", ReflectionSchema);