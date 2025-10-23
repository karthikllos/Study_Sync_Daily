import { initiateInteraction } from "../../../actions/useractions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { name, message, amount, to_username } = await req.json();

    if (!name || !amount || !to_username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Mock Order ID (replace with your payment gateway orderId if needed)
    const orderId = `order_${Date.now()}`;

    const result = await initiateInteraction({
      amount,
      to_username,
      paymentform: { name, message },
      orderId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Payment initiated", payment: result.payment });
  } catch (error) {
    console.error("API Payment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
