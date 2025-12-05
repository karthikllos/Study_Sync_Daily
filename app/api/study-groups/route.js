import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/authConfig";
import connectDb from "../../../lib/connectDb";
import StudyGroup from "../../../models/StudyGroup";
import User from "../../../models/user";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectDb();

    const groups = await StudyGroup.find({ isActive: true })
      .populate("createdBy", "username email")
      .lean();

    const groupsWithCount = groups.map((group) => ({
      ...group,
      memberCount: group.members?.length || 0,
      createdByName: group.createdBy?.username || group.createdBy?.email,
    }));

    return NextResponse.json(groupsWithCount, { status: 200 });
  } catch (error) {
    console.error("Error fetching study groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, description, maxMembers } = body || {};

    if (!name || !subject) {
      return NextResponse.json(
        { error: "Name and subject are required" },
        { status: 400 }
      );
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const group = await StudyGroup.create({
      name,
      subject,
      description: description || "",
      maxMembers: maxMembers || 10,
      createdBy: user._id,
      members: [user._id],
    });

    const populatedGroup = await group.populate("createdBy", "username email");

    return NextResponse.json(populatedGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating study group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}