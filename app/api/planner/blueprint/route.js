import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";
import { generateDailyBlueprint } from "../../../../lib/plannerLogic";

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

    // resolve user id (prefer session id, fallback to lookup by email)
    let userId = session.user?.id || session.user?.sub || null;
    if (!userId && session.user?.email) {
      const u = await User.findOne({ email: session.user.email.toLowerCase().trim() }).lean();
      if (u) userId = u._id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // optional date query param (ISO)
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const blueprint = await generateDailyBlueprint(userId, date);

    return NextResponse.json(blueprint, { status: 200 });
  } catch (err) {
    console.error("Planner blueprint error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
