import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const PaymentSchema = new Schema(
  {
    // The student/buyer (required)
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Product purchased on the platform (required)
    product_id: { type: String, required: true, trim: true },

    // Order / transaction id from gateway
    oid: { type: String, required: true },

    // Optional message / note
    message: { type: String },

    // Amount (in smallest currency unit or configured unit)
    amount: { type: Number, required: true, min: 0 },

    // Currency code
    currency: { type: String, default: "inr" },

    // Payment Gateway Information
    paymentGateway: {
      type: String,
      enum: ["stripe", "razorpay", "mock"],
      required: true,
    },

    // Gateway-specific IDs
    gatewayPaymentId: { type: String }, // Stripe payment_intent or Razorpay payment_id
    gatewayOrderId: { type: String }, // Gateway-specific order ID

    // Payment Status
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "cancelled"],
      default: "pending",
    },

    // Additional metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Payment completion timestamp
    completedAt: { type: Date },

    // Error information if payment failed
    errorMessage: { type: String },
  },
  { timestamps: true }
);

// Optional: clean JSON output
PaymentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

// Export the Payment model
export default models.Payment || model("Payment", PaymentSchema);
