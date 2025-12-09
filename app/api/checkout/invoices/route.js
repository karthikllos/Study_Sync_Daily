import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

// Force dynamic rendering for this route segment
export const dynamic = "force-dynamic";

// Define plan amounts outside the handler to avoid recalculation
const PLAN_AMOUNTS = {
  Starter: 4999,
  Pro: 9999,
  Premium: 19999,
  "Pro Max": 19999, // Assuming "Pro Max" is an alias or typo for Premium
};

/**
 * @route GET /api/invoices
 * @desc Fetches a list of invoices for the authenticated user, combining payment history and active subscription data.
 * @access Private (Requires Authentication)
 */
export async function GET(request) {
  try {
    const logPrefix = "[Invoices GET]";
    console.log(`${logPrefix} Attempting to fetch invoices...`);

    // 1. Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn(`${logPrefix} Unauthorized request: No valid session found.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Database Connection
    await connectDb();

    // 3. Fetch User Data
    const userEmail = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email: userEmail })
      .select("subscriptionPlan subscriptionRenewalDate subscriptionStartDate paymentHistory")
      .lean();

    if (!user) {
      console.error(`${logPrefix} User not found for email: ${userEmail}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invoices = [];

    // 4. Build Invoices from Payment History
    if (user.paymentHistory && user.paymentHistory.length > 0) {
      user.paymentHistory.forEach((payment, idx) => {
        const paymentDate = new Date(payment.createdAt).toISOString().split("T")[0];
        invoices.push({
          id: `inv_hist_${user._id}_${idx}`, // Changed ID prefix for clarity
          paymentId: payment.razorpayPaymentId || null,
          date: paymentDate,
          amount: payment.amount || 0,
          status: payment.status || "paid",
          pdfUrl: null, // Placeholder for future PDF generation link
          planName: payment.plan || "N/A",
          description: `${payment.plan || 'Unknown'} Plan Payment`,
        });
      });
    }

    // 5. Add Current Active Subscription as an "Invoice" (or upcoming charge)
    if (
      user.subscriptionPlan &&
      user.subscriptionPlan !== "Free" &&
      user.subscriptionRenewalDate &&
      user.subscriptionStartDate
    ) {
      const planAmount = PLAN_AMOUNTS[user.subscriptionPlan] || 0;
      
      invoices.push({
        id: `inv_current_${user._id}`, // Changed ID prefix for clarity
        date: new Date(user.subscriptionStartDate).toISOString().split("T")[0],
        nextBillingDate: new Date(user.subscriptionRenewalDate).toISOString().split("T")[0],
        amount: planAmount,
        status: "active", // Indicates a recurring/current charge
        pdfUrl: null,
        planName: user.subscriptionPlan,
        description: `${user.subscriptionPlan} Plan (Active)`,
      });
    }

    console.log(`${logPrefix} Successfully fetched ${invoices.length} invoices for user ID: ${user._id}`);

    // 6. Response
    return NextResponse.json(invoices, { status: 200 });

  } catch (error) {
    // 7. Error Handling
    console.error(`[Invoices GET] Critical error:`, error);
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: "Failed to fetch invoices due to a server error." },
      { status: 500 }
    );
  }
}