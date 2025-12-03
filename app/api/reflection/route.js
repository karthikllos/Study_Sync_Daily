import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "../../../lib/connectDb";
import Reflection from "../../../models/Reflection";
import { rescheduleSlippedTasks } from "../../../lib/plannerLogic";

/**
 * POST /api/reflection
 * Accepts daily reflection data from ReflectionForm and saves it to DB.
 * Also triggers rescheduling of uncompleted tasks.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { energyRating, focusRating, uncompletedTasks, date } = body;

    // Validate input
    if (!energyRating || !focusRating) {
      return NextResponse.json(
        { error: "energyRating and focusRating are required" },
        { status: 400 }
      );
    }

    // Create reflection document
    const reflection = await Reflection.create({
      user: session.user.id,
      date: date ? new Date(date) : new Date(),
      energyRating,
      focusRating,
      uncompletedTasks: uncompletedTasks || [],
      tasksCompletedCount: body.tasksCompletedCount || 0,
      totalHoursPlanned: body.totalHoursPlanned || 0,
      totalHoursSpent: body.totalHoursSpent || 0,
      aiSummary: body.aiSummary || "",
    });

    // Trigger rescheduling for uncompleted tasks
    if (uncompletedTasks && uncompletedTasks.length > 0) {
      const rescheduleResult = await rescheduleSlippedTasks(reflection._id);
      console.log("Rescheduled slipped tasks:", rescheduleResult);
    }

    return NextResponse.json({
      success: true,
      reflectionId: reflection._id,
      message: "Reflection saved successfully",
    });
  } catch (error) {
    console.error("Error saving reflection:", error);
    return NextResponse.json(
      { error: "Failed to save reflection", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reflection?date=YYYY-MM-DD
 * Fetch reflection for a specific date (or latest if no date provided)
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let query = { user: session.user.id };

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      query.date = { $gte: dayStart, $lte: dayEnd };
    }

    const reflection = await Reflection.findOne(query)
      .populate("uncompletedTasks", "title")
      .sort({ date: -1 })
      .lean();

    if (!reflection) {
      return NextResponse.json({ reflection: null });
    }

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error("Error fetching reflection:", error);
    return NextResponse.json(
      { error: "Failed to fetch reflection", details: error.message },
      { status: 500 }
    );
  }
}
