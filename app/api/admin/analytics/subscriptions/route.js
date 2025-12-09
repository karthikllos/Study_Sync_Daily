import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import { getSubscriptionAnalytics } from "../../../../../lib/subscriptionManager";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("[Admin] Fetching subscription analytics");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIXED: Admin role check
    if (!session.user?.isAdmin && session.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const analytics = await getSubscriptionAnalytics();

    console.log("[Admin] Analytics retrieved");
    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error("[Admin] Analytics error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error.message },
      { status: 500 }
    );
  }
}