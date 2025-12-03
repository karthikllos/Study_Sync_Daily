import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDb from "../../../lib/connectDb";
import Payment from "../../../models/Payment";
import User from "../../../models/user";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

// GET -> return payments for authenticated user (their purchases)
export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

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

    const payments = await Payment.find({ user: userDoc._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ payments }, { status: 200 });
  } catch (err) {
    console.error("Payments GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/*
POST -> Create a Payment record (micro-transaction) and generate a Razorpay order.
Request body (JSON):
{
  "product_id": "ai-notes-credit",
  "amount": 5000   // amount in smallest currency unit (e.g., paise)
}
Behavior:
- Validate product_id and amount.
- Ensure authenticated user and resolve their User document.
- Create a Payment document with { user, product_id, amount, currency, status: 'created' }.
- Create Razorpay order using payment._id as receipt.
- Update Payment. Return order + payment.
*/
export async function POST(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, amount, currency = "INR" } = body || {};

    if (!product_id || typeof product_id !== "string") {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number (in smallest currency unit)" }, { status: 400 });
    }

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

    // Create Payment record before contacting Razorpay
    const paymentDoc = await Payment.create({
      user: userDoc._id,
      product_id: product_id.trim(),
      amount: numericAmount,
      currency,
      status: "created",
      oid: null,
    });

    // Create Razorpay order
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      console.error("Razorpay keys missing");
      // keep payment record for manual reconciliation
      return NextResponse.json(
        { error: "Payment gateway not configured", payment: { id: paymentDoc._id } },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const orderPayload = {
      amount: numericAmount,
      currency,
      receipt: String(paymentDoc._id),
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(orderPayload);

    // Update payment record with order id (oid) and status
    paymentDoc.oid = order.id;
    paymentDoc.status = "order_created";
    await paymentDoc.save();

    return NextResponse.json({ ok: true, order, payment: paymentDoc }, { status: 201 });
  } catch (err) {
    console.error("Payments POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
