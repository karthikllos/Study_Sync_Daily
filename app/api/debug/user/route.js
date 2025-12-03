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

    // Full debug output
    console.log('DEBUG - Full user object:', JSON.stringify(user.toJSON(), null, 2));

    return NextResponse.json({
      debug: 'Full user data',
      userId: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      profileSetupComplete: user.profileSetupComplete,
      academicProfile: user.academicProfile,
      hasAcademicProfile: !!user.academicProfile,
      aiCredits: user.aiCredits || 0,
      rawUser: user.toJSON(),
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}