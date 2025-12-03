import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";
import Routine from "../../../models/Routine";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function resolveUserFromSession(session) {
  await connectDb();
  const userId = session.user?.id || session.user?.sub || session.user?.email;
  if (!userId) return null;

  if (typeof userId === "string" && /^[0-9a-fA-F]{24}$/.test(userId)) {
    return User.findById(userId);
  }
  if (session.user?.email) {
    return User.findOne({ email: session.user.email.toLowerCase().trim() });
  }
  return null;
}

/**
 * GET -> return all Routine items for authenticated user
 * POST -> create a new Routine item for authenticated user
 */

export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await resolveUserFromSession(session);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await connectDb();
    const items = await Routine.find({ user: user._id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ ok: true, routines: items }, { status: 200 });
  } catch (err) {
    console.error("Routines GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await resolveUserFromSession(session);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { name, type, daysOfWeek, startTime, duration, isFixed } = body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ error: "At least one dayOfWeek is required" }, { status: 400 });
    }

    if (!startTime || typeof startTime !== "string") {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }

    const durationNumber = Number(duration);
    if (!Number.isFinite(durationNumber) || durationNumber < 5) {
      return NextResponse.json({ error: "duration must be at least 5 minutes" }, { status: 400 });
    }

    const allowedTypes = ['sleep', 'meal', 'break', 'habit', 'fixed_class', 'exercise'];
    const normalizedType = allowedTypes.includes(type) ? type : 'habit';

    const doc = {
      user: user._id,
      name: String(name).trim().slice(0, 100),
      type: normalizedType,
      daysOfWeek: daysOfWeek.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6),
      startTime: String(startTime),
      duration: durationNumber,
      isFixed: isFixed === undefined ? true : !!isFixed,
    };

    await connectDb();
    const created = await Routine.create(doc);

    return NextResponse.json({ ok: true, routine: created }, { status: 201 });
  } catch (err) {
    console.error("Routines POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT/DELETE can be added similarly with ownership checks.