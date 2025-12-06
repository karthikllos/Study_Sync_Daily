import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import connectDb from "../../../../../lib/connectDb";
import User from "../../../../../models/user";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    console.log("[Razorpay] Starting payment verification");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Razorpay] Unauthorized verification attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
      planName,
    } = body || {};

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.warn("[Razorpay] Missing payment details", {
        paymentId: !!razorpay_payment_id,
        orderId: !!razorpay_order_id,
        signature: !!razorpay_signature,
      });
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[Razorpay] RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    console.log("[Razorpay] Signature verification", {
      orderId: razorpay_order_id,
      expected: generatedSignature.substring(0, 8) + "...",
      received: razorpay_signature.substring(0, 8) + "...",
    });

    if (generatedSignature !== razorpay_signature) {
      console.warn("[Razorpay] Signature mismatch - payment rejected", {
        orderId: razorpay_order_id,
      });
      return NextResponse.json(
        { error: "Invalid payment signature - payment rejected" },
        { status: 400 }
      );
    }

    console.log("[Razorpay] Signature verified successfully");

    // Connect to database
    await connectDb();

    // Find user by email
    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      console.error("[Razorpay] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine plan details
    const planDetails = {
      free: { name: "Free", duration: 0, price: 0 },
      starter: { name: "Starter", duration: 1, price: 4999 },
      pro: { name: "Pro", duration: 1, price: 9999 },
      premium: { name: "Premium", duration: 1, price: 19999 },
    };

    const selectedPlan = planDetails[planId] || planDetails.pro;
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + selectedPlan.duration);

    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        subscriptionPlan: selectedPlan.name,
        subscriptionStatus: "active",
        isProSubscriber: selectedPlan.name !== "Free",
        subscriptionRenewalDate: renewalDate,
        subscriptionPaymentId: razorpay_payment_id,
        subscriptionOrderId: razorpay_order_id,
        lastPaymentDate: new Date(),
        lastPaymentAmount: selectedPlan.price,
        aiCredits: selectedPlan.name === "Pro" ? 50 : (selectedPlan.name === "Premium" ? 999999 : 5),
      },
      { new: true }
    );

    console.log("[Razorpay] Payment successful - subscription updated", {
      userId: user._id,
      plan: selectedPlan.name,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: selectedPlan.price,
      renewalDate: renewalDate,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and subscription updated successfully",
        subscription: {
          planName: updatedUser.subscriptionPlan,
          status: updatedUser.subscriptionStatus,
          isProSubscriber: updatedUser.isProSubscriber,
          renewalDate: updatedUser.subscriptionRenewalDate,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          aiCredits: updatedUser.aiCredits,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Razorpay] Verification error", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Payment verification failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}