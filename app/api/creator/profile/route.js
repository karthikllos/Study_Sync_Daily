import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDb from '../../../../lib/connectDb';
import User from '../../../../models/user';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilepic: user.profilepic,
      bio: user.bio,
      isCreator: user.isCreator,
      profileSetupComplete: user.profileSetupComplete,
      creatorProfile: user.creatorProfile,
      bankDetails: {
        accountHolderName: user.bankDetails?.accountHolderName,
        bankName: user.bankDetails?.bankName,
        isVerified: user.bankDetails?.isVerified,
        // Don't send sensitive bank details
      },
      creatorStats: user.creatorStats,
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}