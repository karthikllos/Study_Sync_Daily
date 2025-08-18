import connectDb from "@/lib/connectDb";
import Payment from "@/models/Payment";
import User from "@/models/user";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    await connectDb();
    const receiver = await User.findOne({ username });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payments = await Payment.find({ to_user: receiver._id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(payments, { status: 200 });
  } catch (err) {
    console.error("Error fetching payments:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
