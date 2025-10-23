import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "../../../../models/user";
import { sendPasswordResetEmail } from "../../../../lib/emailService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset email has been sent."
      }, { status: 200 });
    }

    // Check if user has a password (not OAuth-only)
    if (user.isOAuthUser && !user.password) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset email has been sent."
      }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await user.updateOne({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.username || user.name);
      
      return NextResponse.json({
        success: true,
        message: "Password reset email sent successfully! Please check your inbox and spam folder."
      }, { status: 200 });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      
      // Clear the reset token if email fails
      await user.updateOne({
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 }
      });
      
      return NextResponse.json({
        error: "Failed to send password reset email. Please try again or contact support."
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}