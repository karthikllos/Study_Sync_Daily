import connectDb from "../../../lib/connectDb";
import User from "../../../models/user";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit")) || 20;
  const page = parseInt(searchParams.get("page")) || 1;

  try {
    await connectDb();

    let searchQuery = {};
    
    if (query && query.trim() !== "") {
      // Search by username or name (case-insensitive)
      searchQuery = {
        $or: [
          { username: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } }
        ]
      };
    }

    const skip = (page - 1) * limit;
    
    // Get users with pagination, excluding sensitive fields
    const users = await User.find(searchQuery)
      .select('username name profilepic createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);
    
    const hasMore = skip + users.length < total;

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
    
  } catch (err) {
    console.error("Error searching users:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}