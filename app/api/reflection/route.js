import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";
import { generateSummary } from "../../../lib/aiService";

export const dynamic = "force-dynamic";

/**
 * POST /api/reflection
 * Accepts daily reflection data and saves it to user's reflections array
 */
export async function POST(req) {
  try {
    console.log("[Reflection] 📝 Saving reflection");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn("[Reflection] ❌ Unauthorized POST");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const body = await req.json();
    const {
      energyRating,
      focusRating,
      uncompletedTasks,
      tasksCompletedCount,
      totalHoursPlanned,
      totalHoursSpent,
      aiSummary,
      date,
    } = body;

    // Validate input
    if (!energyRating || !focusRating) {
      return NextResponse.json(
        { error: "energyRating and focusRating are required" },
        { status: 400 }
      );
    }

    if (energyRating < 1 || energyRating > 10 || focusRating < 1 || focusRating > 10) {
      return NextResponse.json(
        { error: "Ratings must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Create reflection object
    const reflection = {
      date: date ? new Date(date) : new Date(),
      energyRating: parseInt(energyRating),
      focusRating: parseInt(focusRating),
      uncompletedTasks: uncompletedTasks || [],
      tasksCompletedCount: parseInt(tasksCompletedCount) || 0,
      totalHoursPlanned: parseFloat(totalHoursPlanned) || 0,
      totalHoursSpent: parseFloat(totalHoursSpent) || 0,
      aiSummary: aiSummary || "",
      createdAt: new Date(),
    };

    if (!reflection.aiSummary) {
        // Prepare data for AI summary generation
        const summaryData = {
            energyRating,
            focusRating,
            tasksCompletedCount,
            totalHoursSpent,
            notes: aiSummary, // Pass the optional user notes/summary text
        };

        const aiResult = await generateSummary(summaryData);
        reflection.aiSummary = aiResult.summary;
    }

    // Update user's reflections array
    const user = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase().trim() },
      {
        $push: {
          "academicProfile.reflections": reflection,
        },
      },
      { new: true, runValidators: true }
    ).select("academicProfile");

    if (!user) {
      console.error("[Reflection] ❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    

    console.log("[Reflection] ✅ Reflection saved for user:", user._id);

    return NextResponse.json(
      {
        success: true,
        message: "Reflection saved successfully",
        reflection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Reflection] ❌ POST error:", error.message);
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
    console.log("[Reflection] 📖 Fetching reflection");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn("[Reflection] ❌ Unauthorized GET");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    })
      .select("academicProfile")
      .lean();

    if (!user) {
      console.error("[Reflection] ❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let reflection = null;

    if (dateParam) {
      // Find reflection for specific date
      const targetDate = new Date(dateParam);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      reflection = user.academicProfile?.reflections?.find(
        (r) => new Date(r.date) >= dayStart && new Date(r.date) <= dayEnd
      );
    } else {
      // Get latest reflection
      reflection = user.academicProfile?.reflections?.[
        user.academicProfile.reflections.length - 1
      ];
    }

    console.log("[Reflection] ✅ Reflection fetched");

    return NextResponse.json({ reflection: reflection || null });
  } catch (error) {
    console.error("[Reflection] ❌ GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch reflection", details: error.message },
      { status: 500 }
    );
  }
}
