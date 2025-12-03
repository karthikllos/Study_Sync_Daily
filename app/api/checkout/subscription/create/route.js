import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDb from "../../../../../lib/connectDb";
import User from "../../../../../models/user";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

/**
 * POST /api/checkout/subscription/create
 *
 * Body: { planType?: "monthly" | "yearly" }
 *
 * This endpoint creates a recurring StudySync Pro subscription using Razorpay
 * subscriptions. In production, you should rely on Razorpay webhooks to
 * finalize subscription status; here we optimistically mark the user as
 * subscribed once the subscription object is created.
 */
export async function POST(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType = "monthly" } = (await request.json()) || {};

    await connectDb();

    // Resolve user document
    const userId = session.user.id || session.user.sub || session.user.email;
    let userDoc = null;
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      userDoc = await User.findById(userId);
    } else if (session.user?.email) {
      userDoc = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    }

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      console.error("Razorpay keys missing for subscription");
      return NextResponse.json(
        { error: "Subscription gateway not configured" },
        { status: 500 },
      );
    }

    const monthlyPlanId = process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY;
    const yearlyPlanId = process.env.RAZORPAY_PLAN_ID_PRO_YEARLY;

    const planId = planType === "yearly" ? yearlyPlanId : monthlyPlanId;
    const billingCycle = planType === "yearly" ? "yearly" : "monthly";

    if (!planId) {
      return NextResponse.json(
        { error: `Missing Razorpay plan id for ${billingCycle} subscription` },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Create subscription in Razorpay
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: planType === "yearly" ? 12 : 12, // 12 billing cycles; adjust as needed
      customer_notify: 1,
      notes: {
        userId: String(userDoc._id),
        email: userDoc.email,
        planType: billingCycle,
      },
    });

    // Compute tentative expiry (for app-side gating). In a real deployment,
    // this should be driven by webhooks from Razorpay/Stripe.
    const now = new Date();
    const expiry = new Date(now);
    if (billingCycle === "yearly") {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    userDoc.isProSubscriber = true;
    userDoc.subscriptionEndsAt = expiry;
    await userDoc.save();

    return NextResponse.json(
      {
        ok: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        planType: billingCycle,
        isProSubscriber: true,
        subscriptionEndsAt: expiry.toISOString(),
        razorpayKey: key_id,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Subscription create error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
