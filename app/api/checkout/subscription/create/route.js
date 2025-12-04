import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, planName } = body || {};

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    // Simple plan -> amount mapping (smallest currency unit). Adjust to your currency/values.
    const planAmounts = {
      PLAN_FREE: 0,
      PLAN_PRO_MONTHLY: 90000, // e.g. 900.00 in paise/cents
      PLAN_PRO_MAX_MONTHLY: 190000,
    };

    const amount = planAmounts[planId] ?? null;
    if (amount === null) {
      return NextResponse.json({ error: "Unknown planId" }, { status: 400 });
    }

    // In a real implementation you'd call your payment provider / server SDK here
    // to create an order/subscription and return provider response fields.
    // For now return a minimal payload the client expects.
    const order = {
      orderId: `mock_order_${Date.now()}`,
      amount,
      currency: process.env.DEFAULT_CURRENCY || "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
      planName: planName || planId,
    };

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Subscription create error:", {
      message: error?.message,
      status: error?.statusCode,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: error?.message || "Failed to create order",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: error?.statusCode || 500 }
    );
  }
}
