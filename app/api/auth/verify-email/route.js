import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=InvalidToken', request.url));
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth?error=ExpiredToken', request.url));
    }

    // Update user as verified
    await user.updateOne({
      isEmailVerified: true,
      $unset: { 
        emailVerificationToken: 1, 
        emailVerificationExpires: 1 
      }
    });

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth?verified=true', request.url));

  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL('/auth?error=VerificationError', request.url));
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                            Math.random().toString(36).substring(2, 15);

    // Update user with new token
    await user.updateOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    try {
      const { sendVerificationEmail } = require("../../../../lib/emailService");
      await sendVerificationEmail(user.email, verificationToken);
      
      return NextResponse.json({
        success: true,
        message: "Verification email sent! Please check your inbox."
      }, { status: 200 });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json({
        error: "Failed to send verification email. Please try again."
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}