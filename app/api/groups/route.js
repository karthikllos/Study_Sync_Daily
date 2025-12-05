import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDb from "../../../lib/connectDb";

/**
 * @deprecated This endpoint has been replaced by /api/study-groups
 * Will be removed in the next major version
 */

/**
 * GET /api/groups
 * Returns groups where the user is creator or member.
 */
export async function GET(request) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/study-groups instead.',
      migrationGuide: 'https://docs.your-app.com/migration/study-groups-endpoint'
    },
    { 
      status: 410, // Gone
      headers: {
        'Deprecation': 'true',
        'Link': '</api/study-groups>; rel="successor-version"',
      }
    }
  );
}

/**
 * POST /api/groups
 *
 * Two behaviors:
 *  - Create group: { name, description?, taskIds? }
 *  - Add member: { action: "add_member", groupId, memberUsername }
 */
export async function POST(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body || {};

    const user = await resolveUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDb();

    if (action === "add_member") {
      const { groupId, memberUsername } = body;
      if (!groupId || !memberUsername) {
        return NextResponse.json(
          { error: "groupId and memberUsername are required" },
          { status: 400 },
        );
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }

      // Only creator or admin can add members
      const isCreator = String(group.creator) === String(user._id);
      const isAdmin = group.members?.some(
        (m) => String(m.user) === String(user._id) && m.role === "admin",
      );
      if (!isCreator && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const member = await User.findOne({ username: memberUsername.toLowerCase().trim() });
      if (!member) {
        return NextResponse.json({ error: "Member user not found" }, { status: 404 });
      }

      const alreadyMember = group.members?.some(
        (m) => String(m.user) === String(member._id),
      );
      if (alreadyMember) {
        return NextResponse.json({ ok: true, group }, { status: 200 });
      }

      group.members.push({ user: member._id, role: "member" });
      await group.save();

      const populated = await Group.findById(group._id)
        .populate("creator", "username name profilepic")
        .populate("members.user", "username name profilepic")
        .lean();

      return NextResponse.json({ ok: true, group: populated }, { status: 200 });
    }

    // Default: create group
    const { name, description, taskIds } = body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const groupDoc = await Group.create({
      name: name.trim().slice(0, 100),
      description: description ? String(description).trim().slice(0, 500) : "",
      creator: user._id,
      members: [
        {
          user: user._id,
          role: "admin",
          joinedAt: new Date(),
        },
      ],
      tasks: Array.isArray(taskIds) ? taskIds : [],
    });

    const populated = await Group.findById(groupDoc._id)
      .populate("creator", "username name profilepic")
      .populate("members.user", "username name profilepic")
      .lean();

    return NextResponse.json({ ok: true, group: populated }, { status: 201 });
  } catch (err) {
    console.error("Groups POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
