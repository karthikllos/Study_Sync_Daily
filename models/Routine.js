// Use Mongoose and define the Routine schema for StudySync Daily.
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const RoutineSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: {
      type: String,
      enum: ['sleep', 'meal', 'break', 'habit', 'fixed_class', 'exercise'],
      required: true
    },
    daysOfWeek: [{ type: Number, min: 0, max: 6, required: true }], // 0=Sunday, 1=Monday...
    startTime: { type: String, required: true, match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"] },
    duration: { type: Number, required: true, min: 5 }, // Duration in minutes
    isFixed: { type: Boolean, default: true }, // Whether the planner can move it
  },
  { timestamps: true }
);

RoutineSchema.index({ user: 1 });

export default models.Routine || model("Routine", RoutineSchema);