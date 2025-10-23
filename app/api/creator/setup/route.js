import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDb from '../../../../lib/connectDb';
import User from '../../../../models/user';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDb();

    // Find user by email since session.user.id might be undefined
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const formDataStr = formData.get('formData');
    const profileImage = formData.get('profileImage');

    if (!formDataStr) {
      return NextResponse.json({ error: 'Form data is required' }, { status: 400 });
    }

    const data = JSON.parse(formDataStr);

    // Validate required fields
    if (!data.displayName || !data.category || !data.bio) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    if (!data.bankDetails.accountHolderName) {
      return NextResponse.json({ error: 'Account holder name is required' }, { status: 400 });
    }

    if (!data.bankDetails.upiId && (!data.bankDetails.accountNumber || !data.bankDetails.ifscCode)) {
      return NextResponse.json({ error: 'Either UPI ID or bank account details are required' }, { status: 400 });
    }

    // Handle profile image upload
    let profileImagePath = null;
    if (profileImage) {
      try {
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = path.extname(profileImage.name);
        const filename = `profile_${currentUser._id}_${timestamp}${fileExtension}`;
        
        // Save to public/uploads directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        const filepath = path.join(uploadDir, filename);
        
        // Create directory if it doesn't exist
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(filepath, buffer);
        profileImagePath = `/uploads/profiles/${filename}`;
        
        console.log('Profile image uploaded:', profileImagePath);
      } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 });
      }
    }

    // Update user profile
    const updateData = {
      isCreator: true,
      profileSetupComplete: true,
      name: data.displayName,
      bio: data.bio,
      creatorProfile: {
        displayName: data.displayName,
        tagline: data.tagline,
        category: data.category,
        location: data.location,
        website: data.website,
        socialLinks: data.socialLinks,
        skills: data.skills,
      },
      bankDetails: {
        accountHolderName: data.bankDetails.accountHolderName,
        accountNumber: data.bankDetails.accountNumber,
        ifscCode: data.bankDetails.ifscCode,
        bankName: data.bankDetails.bankName,
        branchName: data.bankDetails.branchName,
        upiId: data.bankDetails.upiId,
        isVerified: false, // Will be verified later
      },
      creatorStats: {
        totalSupport: 0,
        supportersCount: 0,
        totalWithdrawn: 0,
        portfolioViews: 0,
      }
    };

    // Add profile image if uploaded
    if (profileImagePath) {
      updateData.profilepic = profileImagePath;
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Creator profile setup complete for user:', currentUser._id);

    return NextResponse.json({
      success: true,
      message: 'Creator profile setup complete',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        isCreator: updatedUser.isCreator,
        profileSetupComplete: updatedUser.profileSetupComplete,
        profilepic: updatedUser.profilepic,
      }
    });

  } catch (error) {
    console.error('Creator setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}