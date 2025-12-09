import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * Validate blueprint fields
 */
function validateBlueprint(data) {
  const errors = [];

  if (data.routines && !Array.isArray(data.routines)) {
    errors.push("Routines must be an array.");
  }
  if (data.assignments && !Array.isArray(data.assignments)) {
    errors.push("Assignments must be an array.");
  }
  if (data.microGoals && !Array.isArray(data.microGoals)) {
    errors.push("MicroGoals must be an array.");
  }

  return errors;
}

/**
 * GET — Fetch existing blueprint or return today's empty blueprint if none exists.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.warn("[Blueprint] Unauthorized GET attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const userEmail = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email: userEmail })
      .select("_id dailyBlueprint")
      .lean();

    if (!user) {
      console.error("[Blueprint] User not found:", userEmail);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];
    const existingBlueprint = user.dailyBlueprint;

    // FIXED: Persist for entire day unless explicitly overwritten by POST
    const blueprint =
      existingBlueprint && existingBlueprint.date === today
        ? existingBlueprint
        : {
            userId: user._id,
            date: today,
            routines: [],
            assignments: [],
            microGoals: [],
            focusPrediction: null,
            createdAt: new Date(),
          };

    console.log("[Blueprint] Fetched blueprint for user:", user._id);

    return NextResponse.json({ success: true, blueprint }, { status: 200 });
  } catch (error) {
    console.error("[Blueprint] GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch blueprint", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST — Save or update today's blueprint
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.warn("[Blueprint] Unauthorized POST attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { routines = [], assignments = [], microGoals = [], focusPrediction } = body;

    // Input validation
    const validationErrors = validateBlueprint({ routines, assignments, microGoals });
    if (validationErrors.length > 0) {
      console.warn("[Blueprint] Validation errors:", validationErrors);
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    await connectDb();

    const userEmail = session.user.email.toLowerCase().trim();
    const today = new Date().toISOString().split("T")[0];

    // New blueprint structure
    const blueprintData = {
      date: today,
      routines,
      assignments,
      microGoals,
      focusPrediction,
      updatedAt: new Date(),
    };

    // Save to user
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      {
        dailyBlueprint: blueprintData,
        lastBlueprintUpdate: new Date(),
      },
      {
        new: true,
        runValidators: true,
        select: "_id dailyBlueprint",
      }
    );

    if (!user) {
      console.error("[Blueprint] User not found:", userEmail);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[Blueprint] Updated blueprint for user:", user._id);

    return NextResponse.json(
      {
        success: true,
        message: "Blueprint updated successfully",
        blueprint: user.dailyBlueprint,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Blueprint] POST error:", error.message);
    return NextResponse.json(
      { error: "Failed to update blueprint", details: error.message },
      { status: 500 }
    );
  }
}
