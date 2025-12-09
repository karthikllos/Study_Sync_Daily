import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

/**
 * GET /api/checkout/subscription/manage
 *
 * Redirects the authenticated user to the billing portal / subscription
 * management page (Stripe/Razorpay or your own account page).
 *
 * Configure SUBSCRIPTION_PORTAL_URL in your environment to point to your
 * provider's customer portal. If not set, we fall back to /pricing.
 */
export async function GET(request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.redirect(new URL("/auth?error=Unauthorized", request.url));
    }

    const portalUrl = process.env.SUBSCRIPTION_PORTAL_URL;
    const redirectUrl = portalUrl || new URL("/pricing", request.url).toString();

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Subscription manage redirect error:", err);
    return NextResponse.redirect(new URL("/pricing?error=subscription_manage", request.url));
  }
}
