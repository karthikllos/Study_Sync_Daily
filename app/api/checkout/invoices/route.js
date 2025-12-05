import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/authConfig";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invoices = [];

    if (user.subscriptionPlan !== "Free" && user.subscriptionRenewalDate) {
      invoices.push({
        id: `inv_${user._id}_latest`,
        date: new Date().toISOString(),
        amount: user.subscriptionPlan === "Pro" ? 9900 : 19900,
        status: "paid",
        pdfUrl: null,
        planName: user.subscriptionPlan,
      });
    }

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}