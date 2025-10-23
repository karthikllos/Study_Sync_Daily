import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const PaymentSchema = new Schema(
  {
    name: { type: String, required: true },
    to_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    oid: { type: String, required: true },  // Order ID from payment gateway
    message: { type: String },
    amount: { type: Number, required: true }, // Amount in smallest currency unit (paise/cents)
    currency: { type: String, default: 'inr' },
    done: { type: Boolean, default: false },
    
    // Payment Gateway Information
    paymentGateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'mock'],
      required: true
    },
    
    // Gateway-specific IDs
    gatewayPaymentId: { type: String }, // Stripe payment_intent or Razorpay payment_id
    gatewayOrderId: { type: String },   // Gateway-specific order ID
    
    // Payment Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled'],
      default: 'pending'
    },
    
    // Additional metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    },
    
    // Payment completion timestamp
    completedAt: { type: Date },
    
    // Error information if payment failed
    errorMessage: { type: String },
  },
  { timestamps: true }
);

// Export the Payment model
export default models.Payment || model("Payment", PaymentSchema);
