import { NextResponse } from "next/server";
// FIX 1: Import the shared, cached database connection helper
import connectDb from "../../../../lib/connectDb"; 
import User from "../../../../models/user";
// FIX 2: Use a standard ES module import for the email service
import { sendVerificationEmail } from "../../../../lib/emailService"; 

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=InvalidToken', baseUrl));
    }

    // FIX 1: Use the connectDb helper
    await connectDb();

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth?error=ExpiredToken', baseUrl));
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
    return NextResponse.redirect(new URL('/auth?verified=true', baseUrl));

  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    return NextResponse.redirect(new URL('/auth?error=VerificationError', baseUrl));
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

    // FIX 1: Use the connectDb helper
    await connectDb();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Note: It's good practice to respond with a generic success message
    // even if the user isn't found, to prevent email enumeration.
    if (!user) {
      console.warn(`Attempted resend for non-existent email: ${email}`);
      return NextResponse.json(
        { message: "If an account exists, a verification email has been sent." },
        { status: 200 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Generate new verification token (using your provided non-crypto method for consistency)
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);

    // Update user with new token
    await user.updateOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    try {
      // FIX 2: sendVerificationEmail is imported at the top
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