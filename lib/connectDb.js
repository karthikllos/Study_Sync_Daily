import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

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
