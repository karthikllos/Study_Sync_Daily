// app/api/quizzes/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";
import Quiz from "../../../models/Quiz";
import AcademicTask from "../../../models/AcademicTask";
import { generateQuiz } from "../../../lib/aiService";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function resolveUser(session) {
  await connectDb();
  const userId = session.user?.id || session.user?.sub;
  if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
    return User.findById(userId);
  }
  if (session.user?.email) {
    return User.findOne({ email: session.user.email.toLowerCase().trim() });
  }
  return null;
}

/**
 * GET /api/quizzes
 * Returns all quizzes for the authenticated user
 */
export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await resolveUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDb();

    const quizzes = await Quiz.find({ user: user._id })
      .populate("academicTask", "title subject")
      .sort({ nextReviewDate: 1 })
      .lean();

    return NextResponse.json({ quizzes }, { status: 200 });
  } catch (err) {
    console.error("Quiz GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/quizzes
 * Creates a new quiz using AI generation
 * 
 * Body: {
 *   taskId: string,           // Academic task to generate quiz for
 *   subject: string,          // Subject/topic
 *   rawNotes?: string,        // Optional raw notes
 *   questionCount?: number    // Number of questions (default: 5)
 * }
 */
export async function POST(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, subject, rawNotes, questionCount = 5 } = body;

    if (!taskId || !subject) {
      return NextResponse.json(
        { error: "taskId and subject are required" },
        { status: 400 }
      );
    }

    const user = await resolveUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDb();

    // Check if task exists and belongs to user
    const task = await AcademicTask.findOne({ _id: taskId, user: user._id });
    if (!task) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check credit/subscription status
    const QUIZ_CREDIT_COST = 2;
    const now = new Date();
    const hasActiveSubscription =
      !!user.isProSubscriber &&
      (!user.subscriptionEndsAt || new Date(user.subscriptionEndsAt) > now);

    // For Pro Max (unlimited), check subscription plan
    const isProMax = user.subscriptionPlan === "Pro Max";
    const hasUnlimitedCredits = hasActiveSubscription && isProMax;

    if (!hasUnlimitedCredits) {
      if (!user.aiCredits || user.aiCredits < QUIZ_CREDIT_COST) {
        return NextResponse.json(
          {
            error: "Insufficient AI credits. Upgrade to Pro Max for unlimited or purchase more credits.",
            code: "INSUFFICIENT_CREDITS",
            required: QUIZ_CREDIT_COST,
            available: user.aiCredits || 0,
          },
          { status: 402 }
        );
      }

      // Deduct credits for Pro users (not Pro Max)
      user.aiCredits -= QUIZ_CREDIT_COST;
      await user.save();
    }

    // Generate quiz questions using AI
    const { questions } = await generateQuiz(subject, rawNotes || task.description || "");

    // Limit to requested question count
    const limitedQuestions = questions.slice(0, questionCount);

    // Create quiz document
    const quiz = await Quiz.create({
      user: user._id,
      academicTask: task._id,
      title: `${subject} Quiz`,
      questions: limitedQuestions,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      repetitionInterval: 1,
      easinessFactor: 2.5,
      isActive: true,
    });

    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate("academicTask", "title subject")
      .lean();

    return NextResponse.json(
      {
        ok: true,
        quiz: populatedQuiz,
        creditsUsed: hasUnlimitedCredits ? 0 : QUIZ_CREDIT_COST,
        remainingCredits: hasUnlimitedCredits ? "unlimited" : user.aiCredits,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Quiz POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT /api/quizzes
 * Update quiz (record attempt, calculate next review)
 * 
 * Body: {
 *   quizId: string,
 *   answers: string[],
 *   score: number,
 *   timeTaken: number
 * }
 */
export async function PUT(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, answers, score, timeTaken } = body;

    if (!quizId || !Array.isArray(answers) || typeof score !== "number") {
      return NextResponse.json(
        { error: "quizId, answers array, and score are required" },
        { status: 400 }
      );
    }

    const user = await resolveUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDb();

    const quiz = await Quiz.findOne({ _id: quizId, user: user._id });
    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found or unauthorized" },
        { status: 404 }
      );
    }

    // Record attempt
    quiz.attempts.push({
      score,
      attemptedAt: new Date(),
      timeTaken: timeTaken || 0,
      answers,
    });

    // Calculate quality rating (0-5) based on score
    // 100% = 5, 80% = 4, 60% = 3, 40% = 2, 20% = 1, 0% = 0
    const quality = Math.floor((score / 100) * 5);

    // Update next review date using SM-2 algorithm
    quiz.calculateNextReview(quality);

    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id)
      .populate("academicTask", "title subject")
      .lean();

    return NextResponse.json(
      {
        ok: true,
        quiz: updatedQuiz,
        nextReviewDate: quiz.nextReviewDate,
        repetitionInterval: quiz.repetitionInterval,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Quiz PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/quizzes
 * Delete a quiz
 * 
 * Body: { quizId: string }
 */
export async function DELETE(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId } = body;

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    const user = await resolveUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDb();

    const quiz = await Quiz.findOne({ _id: quizId, user: user._id });
    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found or unauthorized" },
        { status: 404 }
      );
    }

    await quiz.deleteOne();

    return NextResponse.json({ ok: true, message: "Quiz deleted" }, { status: 200 });
  } catch (err) {
    console.error("Quiz DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}