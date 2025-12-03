import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";
import AcademicTask from "../../../models/AcademicTask";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

// Helper: resolve User document from session (by id or email)
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
 * GET -> return all AcademicTasks for authenticated user
 * POST -> create a new AcademicTask for authenticated user
 * PUT/DELETE -> placeholders implemented with ownership checks
 */

export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await resolveUserFromSession(session);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await connectDb();

    const tasks = await AcademicTask.find({ user: user._id })
      .sort({ dueDate: 1, priority: -1 })
      .lean();

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (err) {
    console.error("Tasks GET error:", err);
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
    const { title, description, dueDate, priority, completed, subject, type, estimatedDuration } = body || {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const taskDoc = {
      user: user._id,
      title: title.trim().slice(0, 200),
      description: description ? String(description).trim() : "",
      priority: typeof priority === "number" ? priority : 3,
      isCompleted: completed !== undefined ? !!completed : false,
      subject: subject ? String(subject).trim() : "",
      type: type || "assignment",
      estimatedDuration: typeof estimatedDuration === "number" ? estimatedDuration : 60,
    };

    if (dueDate) {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
      }
      taskDoc.dueDate = d;
    }

    await connectDb();
    const created = await AcademicTask.create(taskDoc);

    return NextResponse.json({ ok: true, task: created }, { status: 201 });
  } catch (err) {
    console.error("Tasks POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Basic PUT: expects { id, ...updates } in body. Ownership enforced.
export async function PUT(request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, description, dueDate, priority, completed, actualDuration, actualDurationDelta } = body || {};
    if (!id) return NextResponse.json({ error: "Task id required" }, { status: 400 });

    await connectDb();
    const task = await AcademicTask.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // verify ownership
    const user = await resolveUserFromSession(session);
    if (!user || String(task.user) !== String(user._id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (title !== undefined) task.title = String(title).trim().slice(0, 200);
    if (description !== undefined) task.description = String(description).trim();
    if (dueDate !== undefined) {
      const d = dueDate ? new Date(dueDate) : null;
      if (d && Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
      task.dueDate = d;
    }
    if (priority !== undefined) task.priority = Number(priority) || 0;
    if (completed !== undefined) task.completed = !!completed;

    // Allow Pomodoro-style time tracking
    if (typeof actualDurationDelta === "number" && !Number.isNaN(actualDurationDelta)) {
      const current = Number(task.actualDuration || 0);
      task.actualDuration = Math.max(0, current + actualDurationDelta);
    } else if (typeof actualDuration === "number" && !Number.isNaN(actualDuration)) {
      task.actualDuration = Math.max(0, actualDuration);
    }

    await task.save();
    return NextResponse.json({ ok: true, task }, { status: 200 });
  } catch (err) {
    console.error("Tasks PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Basic DELETE: expects JSON { id }
export async function DELETE(request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ error: "Task id required" }, { status: 400 });

    await connectDb();
    const task = await AcademicTask.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const user = await resolveUserFromSession(session);
    if (!user || String(task.user) !== String(user._id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await task.deleteOne();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Tasks DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}