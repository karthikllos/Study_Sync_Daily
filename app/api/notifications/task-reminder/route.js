import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import AcademicTask from "@/models/AcademicTask";
import User from "@/models/user";
import { sendTaskReminder } from "@/lib/emailService";

/**
 * POST /api/notifications/task-reminder
 * Send a task reminder email to the authenticated user or specified task owner.
 * 
 * Body params:
 *  - taskId: ObjectId of the AcademicTask to send reminder for
 *  - customSubject (optional): custom email subject line
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { taskId, customSubject } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // Fetch the task
    const task = await AcademicTask.findById(taskId).lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify the user owns the task
    if (task.user.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the user to get their email
    const user = await User.findById(session.user.id).lean();
    if (!user || !user.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Send the reminder using emailService
    await sendTaskReminder(
      user.email,
      customSubject || `Task Reminder: ${task.title}`,
      task.title,
      task.dueDate
    );

    return NextResponse.json({
      success: true,
      message: "Task reminder sent successfully",
      taskId: task._id,
    });
  } catch (error) {
    console.error("Error sending task reminder:", error);
    return NextResponse.json(
      { error: "Failed to send task reminder", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/task-reminder?taskId=xxx
 * Preview reminder details (debugging/testing endpoint)
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await AcademicTask.findById(taskId).lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.user.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      taskId: task._id,
      title: task.title,
      dueDate: task.dueDate,
      reminderWouldBeSentTo: session.user.email,
    });
  } catch (error) {
    console.error("Error fetching task reminder info:", error);
    return NextResponse.json(
      { error: "Failed to fetch task reminder info", details: error.message },
      { status: 500 }
    );
  }
}
