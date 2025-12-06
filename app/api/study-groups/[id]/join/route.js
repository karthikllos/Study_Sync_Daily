// app/api/study-groups/[id]/join/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDb from "../../../../lib/connectDb";
import StudyGroup from "../../../../models/StudyGroup";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

export async function POST(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Access params correctly in Next.js 15
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

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

    // Check if already a member
    if (group.members.some(memberId => memberId.toString() === user._id.toString())) {
      return NextResponse.json(
        { error: "Already a member of this group" },
        { status: 400 }
      );
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return NextResponse.json(
        { error: "Group is full" },
        { status: 400 }
      );
    }

    // Add user to group
    group.members.push(user._id);
    await group.save();

    return NextResponse.json(
      { message: "Successfully joined group", group },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining study group:", error);
    return NextResponse.json(
      { error: "Failed to join group", details: error.message },
      { status: 500 }
    );
  }
}