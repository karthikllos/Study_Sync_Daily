import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";
import { predictFocusScore } from "../../../../lib/plannerLogic";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Resolve user id (prefer session id, fallback to lookup by email)
    let userId = session.user?.id || session.user?.sub || null;
    if (!userId && session.user?.email) {
      const u = await User.findOne({ email: session.user.email.toLowerCase().trim() }).lean();
      if (u) userId = u._id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prediction = await predictFocusScore(userId);

    // Shape: { baseline, hours: [{ timestamp, hourOfDay, score }] }
    return NextResponse.json(prediction, { status: 200 });
  } catch (err) {
    console.error("AI predict focus error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
