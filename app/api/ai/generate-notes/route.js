import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";
import { generateQuiz } from "../../../../lib/aiService";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

/**
 * POST /api/ai/generate-notes
 *
 * Body: { subject: string, rawNotes: string }
 *
 * Credit logic:
 *  - If user.isProSubscriber === true and subscription is active, allow without
 *    consuming aiCredits.
 *  - Else require user.aiCredits > 0 and decrement by 1.
 */
export async function POST(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, rawNotes } = await request.json();

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "subject is required" },
        { status: 400 },
      );
    }

    await connectDb();

    // Load user
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

    // Check subscription / credit status
    const now = new Date();
    const hasActiveSubscription =
      !!userDoc.isProSubscriber &&
      (!userDoc.subscriptionEndsAt || new Date(userDoc.subscriptionEndsAt) > now);

    if (!hasActiveSubscription && (!userDoc.aiCredits || userDoc.aiCredits <= 0)) {
      return NextResponse.json(
        {
          error: "AI credits exhausted. Upgrade to StudySync Pro or purchase more credits.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 },
      );
    }

    if (!hasActiveSubscription) {
      // Standard user: consume one AI credit
      userDoc.aiCredits = (userDoc.aiCredits || 0) - 1;
      if (userDoc.aiCredits < 0) userDoc.aiCredits = 0;
      await userDoc.save();
    }

    // Generate structured quiz-style notes from the subject + raw notes
    const { questions } = await generateQuiz(subject, rawNotes || "");

    return NextResponse.json(
      {
        ok: true,
        subject,
        questions,
        isProSubscriber: hasActiveSubscription,
        remainingCredits: hasActiveSubscription ? userDoc.aiCredits : userDoc.aiCredits,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("AI generate-notes error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
