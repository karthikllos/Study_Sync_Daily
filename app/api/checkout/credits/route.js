import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

// Get credit packages
export async function GET(request) {
  try {
    console.log("[Credits] Fetching credit packages");

    const creditPackages = [
      {
        id: "credits_50",
        name: "Starter Pack",
        credits: 50,
        price: 499,
        savings: "0%",
      },
      {
        id: "credits_150",
        name: "Popular Pack",
        credits: 150,
        price: 1299,
        savings: "15%",
      },
      {
        id: "credits_500",
        name: "Pro Pack",
        credits: 500,
        price: 3499,
        savings: "25%",
      },
      {
        id: "credits_1000",
        name: "Max Pack",
        credits: 1000,
        price: 6299,
        savings: "35%",
      },
    ];

    console.log("[Credits] Returning", creditPackages.length, "packages");
    return NextResponse.json(creditPackages, { status: 200 });
  } catch (error) {
    console.error("[Credits] GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch credit packages" },
      { status: 500 }
    );
  }
}

// Purchase credits (after Razorpay verification)
export async function POST(request) {
  try {
    console.log("[Credits] Starting credit purchase");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Credits] Unauthorized purchase attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { credits, razorpay_payment_id, razorpay_order_id, amount } =
      body || {};

    if (!credits || !razorpay_payment_id) {
      console.warn("[Credits] Missing required fields", {
        credits: !!credits,
        paymentId: !!razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Missing credits or payment information" },
        { status: 400 }
      );
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      console.error("[Credits] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add credits to user
    const previousCredits = user.aiCredits || 0;
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        aiCredits: previousCredits + parseInt(credits),
        lastCreditPurchaseDate: new Date(),
        lastCreditPurchaseAmount: amount,
        lastCreditPaymentId: razorpay_payment_id,
      },
      { new: true }
    );

    console.log("[Credits] Purchase successful", {
      userId: user._id,
      creditsAdded: credits,
      previousBalance: previousCredits,
      newBalance: updatedUser.aiCredits,
      paymentId: razorpay_payment_id,
      amount: amount,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Credits purchased successfully",
        credits: {
          added: parseInt(credits),
          previousBalance: previousCredits,
          newBalance: updatedUser.aiCredits,
          paymentId: razorpay_payment_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Credits] POST error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to purchase credits", details: error.message },
      { status: 500 }
    );
  }
}