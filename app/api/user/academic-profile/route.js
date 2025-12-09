import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * GET -> return authenticated user's public profile + academicProfile
 * PUT -> update academicProfile (institution, major, targetHoursPerWeek)
 */

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const userId = session.user.id || session.user.sub || session.user.email;
    // Prefer id, fall back to email lookup if necessary
    let user;
    if (userId && typeof userId === "string" && /^[0-9a-fA-F]{24}$/.test(userId)) {
      user = await User.findById(userId).select("-password -__v").lean();
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email }).select("-password -__v").lean();
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: user._id,
        username: user.username,
        name: user.name || null,
        academicProfile: user.academicProfile || {
          institution: "",
          major: "",
          targetHoursPerWeek: 0,
        },
        studyStreak: typeof user.studyStreak === "number" ? user.studyStreak : 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Academic profile GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { institution, major, targetHoursPerWeek } = body || {};

    // Validate incoming fields
    const updates = {};
    if (institution !== undefined) {
      if (typeof institution !== "string" || institution.trim().length > 100) {
        return NextResponse.json({ error: "Invalid institution" }, { status: 400 });
      }
      updates["academicProfile.institution"] = institution.trim();
    }
    if (major !== undefined) {
      if (typeof major !== "string" || major.trim().length > 100) {
        return NextResponse.json({ error: "Invalid major" }, { status: 400 });
      }
      updates["academicProfile.major"] = major.trim();
    }
    if (targetHoursPerWeek !== undefined) {
      const n = Number(targetHoursPerWeek);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json({ error: "Invalid targetHoursPerWeek" }, { status: 400 });
      }
      updates["academicProfile.targetHoursPerWeek"] = n;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await connectDb();

    const userId = session.user.id || session.user.sub || session.user.email;
    let user;
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      user = await User.findById(userId);
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Apply updates to academicProfile object
    user.academicProfile = user.academicProfile || {};
    if (updates["academicProfile.institution"] !== undefined) user.academicProfile.institution = updates["academicProfile.institution"];
    if (updates["academicProfile.major"] !== undefined) user.academicProfile.major = updates["academicProfile.major"];
    if (updates["academicProfile.targetHoursPerWeek"] !== undefined) user.academicProfile.targetHoursPerWeek = updates["academicProfile.targetHoursPerWeek"];

    await user.save();

    return NextResponse.json(
      {
        ok: true,
        academicProfile: user.academicProfile,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Academic profile PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}