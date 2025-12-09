// app/api/tasks/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";
import AcademicTask from "../../../models/AcademicTask";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tasks = await AcademicTask.find({ user: user._id }).sort({ dueDate: 1 }).lean();

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("[Tasks] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, subject, type, dueDate, estimatedDuration, description, priority } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and dueDate required" }, { status: 400 });
    }

    const task = await AcademicTask.create({
      user: user._id,
      title: title.trim(),
      subject: subject?.trim(),
      description: description?.trim(),
      type: type || "assignment",
      dueDate: new Date(dueDate),
      estimatedDuration: estimatedDuration || 60,
      priority: priority || 3,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[Tasks] POST error:", error.message);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, actualDurationDelta, isCompleted } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const updates = {};
    if (actualDurationDelta !== undefined) {
      updates.$inc = { actualDuration: actualDurationDelta };
    }
    if (isCompleted !== undefined) {
      updates.isCompleted = isCompleted;
      if (isCompleted) {
        updates.completedAt = new Date();
      }
    }

    const task = await AcademicTask.findOneAndUpdate(
      { _id: id, user: user._id },
      updates,
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("[Tasks] PUT error:", error.message);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}