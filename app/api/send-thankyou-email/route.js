import { NextResponse } from "next/server";
import connectDb from "../../../../lib/connectDb";
import { sendTaskReminder } from "../../../../lib/emailService";
import User from "../../../../models/user";
import AcademicTask from "../../../../models/AcademicTask";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, taskId } = body || {};

    if (!userId || !taskId) {
      return NextResponse.json({ error: "userId and taskId are required" }, { status: 400 });
    }

    await connectDb();

    // Fetch user and task
    const user = await User.findById(userId).lean();
    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    const task = await AcademicTask.findById(taskId).lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare email details
    const toEmail = user.email;
    const subject = `Reminder: ${task.title}`;
    const taskName = task.title;
    const dueDate = task.dueDate || null;

    // Send reminder email (lib/emailService handles SMTP guardrails)
    await sendTaskReminder(toEmail, subject, taskName, dueDate);

    return NextResponse.json({ success: true, message: "Task reminder sent" }, { status: 200 });
  } catch (err) {
    console.error("Task reminder error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}