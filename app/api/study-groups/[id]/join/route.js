import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authConfig";
import connectDb from "../../../../lib/connectDb";
import StudyGroup from "../../../../models/StudyGroup";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.members.includes(user._id)) {
      return NextResponse.json(
        { error: "Already a member of this group" },
        { status: 400 }
      );
    }

    if (group.members.length >= group.maxMembers) {
      return NextResponse.json(
        { error: "Group is full" },
        { status: 400 }
      );
    }

    group.members.push(user._id);
    await group.save();

    return NextResponse.json(
      { message: "Joined group successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining study group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}