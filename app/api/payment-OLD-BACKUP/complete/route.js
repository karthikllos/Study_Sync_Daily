import connectDb from "../../../../lib/connectDb";
import Payment from "../../../../models/Payment";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDb();

  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { done: true },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Payment marked as done", payment });
  } catch (error) {
    console.error("Error completing payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
