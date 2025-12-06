import connectDb from "./connectDb";
import User from "../models/user";

export const CREDIT_COSTS = {
  AI_NOTES: 1,
  AI_QUIZ: 2,
  FOCUS_PREDICTION: 1,
  REFLECTION: 0, // Free for all
};

/**
 * Check if user has enough credits and deduct them
 * @param {string} userId - User ID
 * @param {string} feature - Feature name (AI_NOTES, AI_QUIZ, etc)
 * @returns {Promise<{success: boolean, message: string, creditsRemaining: number}>}
 */
export async function enforceCredits(userId, feature) {
  try {
    await connectDb();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found", code: 404 };
    }

    const cost = CREDIT_COSTS[feature] || 0;

    // Free for Pro Max subscribers
    if (user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium") {
      console.log(`[Credits] ${feature} is free for ${user.subscriptionPlan} subscriber`);
      return {
        success: true,
        message: "Feature available for your plan",
        creditsRemaining: user.aiCredits || 0,
        isFree: true,
      };
    }

    // Free features
    if (cost === 0) {
      return {
        success: true,
        message: "Feature is free",
        creditsRemaining: user.aiCredits || 0,
        isFree: true,
      };
    }

    // Check if Pro subscriber
    if (user.subscriptionPlan === "Pro") {
      // Pro subscribers get 50 credits/month - check monthly reset
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      if (!user.creditMonthResetDate || user.creditMonthResetDate < monthStart) {
        user.aiCredits = 50;
        user.creditMonthResetDate = monthStart;
        await user.save();
      }

      if (user.aiCredits < cost) {
        return {
          success: false,
          message: "Insufficient credits",
          creditsRemaining: user.aiCredits || 0,
          code: 402,
        };
      }

      user.aiCredits -= cost;
      await user.save();

      return {
        success: true,
        message: "Credit deducted successfully",
        creditsRemaining: user.aiCredits,
        cost: cost,
      };
    }

    // Free users - limited credits
    if (user.aiCredits < cost) {
      return {
        success: false,
        message: "Insufficient credits. Upgrade to Pro or purchase credits",
        creditsRemaining: user.aiCredits || 0,
        code: 402,
      };
    }

    user.aiCredits -= cost;
    await user.save();

    return {
      success: true,
      message: "Credit deducted successfully",
      creditsRemaining: user.aiCredits,
      cost: cost,
    };
  } catch (error) {
    console.error("[Credits] Enforcement error:", error.message);
    return {
      success: false,
      message: "Credit enforcement failed",
      error: error.message,
      code: 500,
    };
  }
}

/**
 * Get user's credit balance and subscription info
 */
export async function getUserCreditInfo(userId) {
  try {
    await connectDb();

    const user = await User.findById(userId).select(
      "aiCredits subscriptionPlan isProSubscriber creditMonthResetDate"
    );

    if (!user) {
      return null;
    }

    // Check if Pro monthly credits need reset
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (
      user.subscriptionPlan === "Pro" &&
      (!user.creditMonthResetDate || user.creditMonthResetDate < monthStart)
    ) {
      user.aiCredits = 50;
      user.creditMonthResetDate = monthStart;
      await user.save();
    }

    return {
      credits: user.aiCredits || 0,
      subscriptionPlan: user.subscriptionPlan,
      isProSubscriber: user.isProSubscriber,
      creditsRemaining: user.aiCredits || 0,
      isUnlimited: user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium",
    };
  } catch (error) {
    console.error("[Credits] Get info error:", error.message);
    return null;
  }
}