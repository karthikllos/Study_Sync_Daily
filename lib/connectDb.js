import mongoose from "mongoose";

// Connection function
const connectDb = async () => {
  if (mongoose.connections[0].readyState) {
    // Already connected
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

const { Schema, model, models } = mongoose;

const PaymentSchema = new Schema(
  {
    name: { type: String, required: true },
    to_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    oid: { type: String, required: true },
    message: { type: String },
    amount: { type: Number, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Export both connection function and Payment model
export default connectDb;
export const Payment = (models && models.Payment) ? models.Payment : model("Payment", PaymentSchema);
