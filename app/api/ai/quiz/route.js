// app/api/ai/quiz/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { enforceCredits } from "../../../../lib/creditEnforcement";
import { generateQuiz } from "../../../../lib/aiService";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * Generate AI Quiz
 * Cost: 2 credits (Pro: from monthly 50, Pro Max/Premium: free, Free/Starter: from purchased credits)
 */
export async function POST(request) {
  try {
    console.log("[AI Quiz] 🎯 Starting quiz generation");

    // ✅ 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[AI Quiz] ❌ Unauthorized attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[AI Quiz] ❌ Invalid JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { topic, difficulty = "medium", questionCount = 5 } = body || {};

    // Validate topic
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      console.warn("[AI Quiz] ❌ Missing or invalid topic");
      return NextResponse.json(
        { error: "Topic is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      console.warn("[AI Quiz] ❌ Invalid difficulty:", difficulty);
      return NextResponse.json(
        { error: "Difficulty must be one of: easy, medium, hard" },
        { status: 400 }
      );
    }

    // Validate question count
    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 20) {
      console.warn("[AI Quiz] ❌ Invalid question count:", questionCount);
      return NextResponse.json(
        { error: "Question count must be between 1 and 20" },
        { status: 400 }
      );
    }

    // ✅ 3. Database connection
    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      console.error("[AI Quiz] ❌ User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[AI Quiz] 👤 User found:", {
      id: user._id,
      email: user.email,
      plan: user.subscriptionPlan,
      credits: user.aiCredits,
    });

    // ✅ 4. ATOMIC credit enforcement
    const creditCheck = await enforceCredits(user._id.toString(), "AI_QUIZ");

    if (!creditCheck.success) {
      console.warn("[AI Quiz] ❌ Credit check failed:", {
        userId: user._id,
        reason: creditCheck.message,
        creditsRemaining: creditCheck.creditsRemaining,
      });

      return NextResponse.json(
        {
          error: creditCheck.message,
          message: creditCheck.message,
          creditsRemaining: creditCheck.creditsRemaining,
          requiredCredits: 2,
        },
        { status: creditCheck.code }
      );
    }

    console.log("[AI Quiz] ✅ Credits checked:", {
      used: creditCheck.cost,
      remaining: creditCheck.creditsRemaining,
      isUnlimited: creditCheck.isUnlimited,
    });

    // ✅ 5. Generate quiz using Gemini API
    let result;
    try {
      result = await generateQuiz(topic, difficulty, count);
    } catch (aiError) {
      console.error("[AI Quiz] ❌ AI generation failed:", aiError);
      
      // Refund credits if AI fails
      if (!creditCheck.isUnlimited) {
        try {
          await User.updateOne(
            { _id: user._id },
            { $inc: { aiCredits: creditCheck.cost } }
          );
          console.log("[AI Quiz] 💰 Credits refunded due to AI failure");
        } catch (refundError) {
          console.error("[AI Quiz] ❌ Credit refund failed:", refundError);
        }
      }

      return NextResponse.json(
        {
          error: "Failed to generate quiz. Please try again.",
          details: process.env.NODE_ENV === "development" ? aiError.message : undefined,
        },
        { status: 500 }
      );
    }

    // ✅ 6. Validate AI response
    if (!result || !result.questions || !Array.isArray(result.questions)) {
      console.error("[AI Quiz] ❌ Invalid AI response structure:", result);
      
      // Refund credits
      if (!creditCheck.isUnlimited) {
        await User.updateOne(
          { _id: user._id },
          { $inc: { aiCredits: creditCheck.cost } }
        );
      }

      return NextResponse.json(
        { error: "Invalid response from AI service. Please try again." },
        { status: 500 }
      );
    }

    if (result.questions.length === 0) {
      console.warn("[AI Quiz] ⚠️ Empty questions array");
      
      // Refund credits
      if (!creditCheck.isUnlimited) {
        await User.updateOne(
          { _id: user._id },
          { $inc: { aiCredits: creditCheck.cost } }
        );
      }

      return NextResponse.json(
        { error: "No questions generated. Please try a different topic." },
        { status: 500 }
      );
    }

    // ✅ 7. Success response
    console.log("[AI Quiz] ✅ Quiz generated successfully:", {
      userId: user._id,
      topic,
      difficulty,
      questionsCount: result.questions.length,
      creditsUsed: creditCheck.cost,
      creditsRemaining: creditCheck.creditsRemaining,
    });

    return NextResponse.json(
      {
        success: true,
        quiz: {
          topic,
          difficulty,
          questions: result.questions,
        },
        credits: {
          used: creditCheck.cost,
          remaining: creditCheck.creditsRemaining,
          isUnlimited: creditCheck.isUnlimited || false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AI Quiz] ❌ Unexpected error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check quiz generation availability
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("subscriptionPlan aiCredits creditsUsed");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isUnlimited = ["Pro Max", "Premium"].includes(user.subscriptionPlan);
    const available = isUnlimited ? 999999 : (user.aiCredits || 0);

    return NextResponse.json(
      {
        available: available >= 2,
        credits: {
          available: available,
          required: 2,
          isUnlimited,
        },
        plan: user.subscriptionPlan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AI Quiz] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}