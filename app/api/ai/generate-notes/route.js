import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { enforceCredits, CREDIT_COSTS } from "../../../../lib/creditEnforcement";
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
    console.log("[AI Notes] Creating AI notes");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body || {};

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enforce credits
    const creditCheck = await enforceCredits(user._id.toString(), "AI_NOTES");
    if (!creditCheck.success) {
      console.warn("[AI Notes] Insufficient credits for user:", user._id);
      return NextResponse.json(
        {
          error: creditCheck.message,
          creditsRemaining: creditCheck.creditsRemaining,
        },
        { status: creditCheck.code || 400 }
      );
    }

    // Process AI notes (call your AI service)
    const aiGeneratedNotes = await generateAINotes(content); // Your AI function

    console.log("[AI Notes] Successfully created", {
      userId: user._id,
      creditsDeducted: creditCheck.cost,
      creditsRemaining: creditCheck.creditsRemaining,
    });

    return NextResponse.json(
      {
        success: true,
        notes: aiGeneratedNotes,
        creditsUsed: creditCheck.cost,
        creditsRemaining: creditCheck.creditsRemaining,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AI Notes] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to generate notes", details: error.message },
      { status: 500 }
    );
  }
}
