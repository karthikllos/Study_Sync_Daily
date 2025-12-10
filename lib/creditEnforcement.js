import connectDb from "./connectDb";
import User from "../models/user";

export const CREDIT_COSTS = {
    AI_NOTES: 1,
    AI_QUIZ: 2,
    FOCUS_PREDICTION: 1,
    REFLECTION: 0,
};

// Define base credits for plans that receive a fixed, monthly reset amount
// This single source of truth prevents hardcoding credit limits in multiple places.
const MONTHLY_RESET_CREDITS = {
    // Based on your previous implementation, we assume Pro resets to 50
    Pro: 50, 
    // Add other plans here if they receive a fixed monthly refill (e.g., Starter: 10)
    Starter: 10,
    Free: 5, // Free credits are typically consumed and not refilled, but good to define a max
};

// --- Helper function for Credit Reset Logic ---
/**
 * Checks if a user's credits need to be reset (lazy reset on first access of the month).
 * Only applies to plans defined in MONTHLY_RESET_CREDITS.
 * * @param {object} user - The Mongoose User document (mutated in place).
 */
async function checkAndResetMonthlyCredits(user) {
    const plan = user.subscriptionPlan;
    const baseCredits = MONTHLY_RESET_CREDITS[plan];

    if (!baseCredits) {
        // Not a monthly reset plan (e.g., Pro Max, Premium are unlimited)
        return; 
    }

    const now = new Date();
    // Reset date is the 1st of the current month at midnight
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // If no reset date is set, or the last reset date is before the start of the current month
    if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
        
        // CRITICAL FIX: Ensure purchased credits are not overwritten.
        // We set the new balance to the greater of (current balance) or (plan's base credits).
        // This ensures the user keeps any additional credits they bought, but gets the refill if they are below the base.
        const creditsToSet = Math.max(user.aiCredits, baseCredits); 

        console.log(`[Credits] 🔄 Resetting ${plan} credits for user ${user._id} to ${creditsToSet}`);
        
        await User.updateOne(
            { _id: user._id },
            {
                aiCredits: creditsToSet,
                creditMonthResetDate: monthStart,
            }
        );

        // Update in-memory user object for immediate use
        user.aiCredits = creditsToSet;
        user.creditMonthResetDate = monthStart;
    }
}
// ----------------------------------------------------------------

/**
 * Atomic credit deduction - prevents race conditions
 * @param {string} userId - User ID
 * @param {string} feature - Feature name (AI_NOTES, AI_QUIZ, etc)
 * @returns {Promise<{success: boolean, message: string, creditsRemaining: number, code: number}>}
 */
export async function enforceCredits(userId, feature) {
    try {
        await connectDb();

        const cost = CREDIT_COSTS[feature] || 0;
        console.log(`[Credits] 🔍 Checking credits for feature: ${feature} (Cost: ${cost}), user: ${userId}`);

        // 1. Fetch user 
        const user = await User.findById(userId).select("aiCredits subscriptionPlan accountLocked creditMonthResetDate");
        
        if (!user) {
            console.error(`[Credits] ❌ User not found: ${userId}`);
            return { success: false, message: "User not found", code: 404, creditsRemaining: 0 };
        }
        
        if (user.accountLocked) {
             return { success: false, message: "Account is temporarily locked", code: 403, creditsRemaining: 0 };
        }

        // 2. Unlimited Access Check
        if (user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium") {
            console.log(`[Credits] ✅ Unlimited access for ${user.subscriptionPlan} user`);
            return {
                success: true,
                message: "Unlimited access for your plan",
                creditsRemaining: 999999, // Placeholder for unlimited
                cost: 0,
                code: 200,
                isUnlimited: true,
            };
        }

        // 3. Free features
        if (cost === 0) {
            console.log(`[Credits] ✅ Free feature: ${feature}`);
            return {
                success: true,
                message: "Feature is free",
                creditsRemaining: user.aiCredits || 0,
                cost: 0,
                code: 200,
                isFree: true,
            };
        }

        // 4. Handle Monthly Plan Reset (Lazy Reset)
        await checkAndResetMonthlyCredits(user);
        // user.aiCredits is now guaranteed to be the correct, refilled amount

        // 5. General Credit Check
        const currentCredits = user.aiCredits || 0;
        
        if (currentCredits < cost) {
            console.warn(`[Credits] ❌ Insufficient credits: Available ${currentCredits}, Needed ${cost}`);

            const upgradeMessage = (user.subscriptionPlan === "Free" || user.subscriptionPlan === "Starter")
                ? ". Purchase more credits or upgrade your plan."
                : ". Monthly limit reached.";

            return {
                success: false,
                message: `Insufficient credits. You have ${currentCredits} but need ${cost}${upgradeMessage}`,
                creditsRemaining: currentCredits,
                cost: cost,
                code: 402,
            };
        }

        // 6. ATOMIC DEDUCTION
        const result = await User.updateOne(
            {
                _id: userId,
                aiCredits: { $gte: cost }, // Only update if balance >= cost
            },
            {
                $inc: { aiCredits: -cost }, // Atomic decrement
            }
        );

        if (result.modifiedCount === 0) {
            // This handles the race condition where credits dropped between fetch and update
            console.error(`[Credits] ❌ Atomic update failed (race condition)`);
            
            // Re-fetch to get current state
            const currentUser = await User.findById(userId).select("aiCredits");
            
            return {
                success: false,
                message: `Transaction failed due to concurrent activity. Current credits: ${currentUser.aiCredits}.`,
                creditsRemaining: currentUser.aiCredits || 0,
                cost: cost,
                code: 402,
            };
        }

        // 7. Success - get updated balance
        const updatedUser = await User.findById(userId).select("aiCredits");

        console.log(`[Credits] ✅ Credits deducted successfully: Cost ${cost}, Remaining ${updatedUser.aiCredits}`);

        return {
            success: true,
            message: "Credit deducted successfully",
            creditsRemaining: updatedUser.aiCredits,
            cost: cost,
            code: 200,
        };
    } catch (error) {
        console.error("[Credits] ❌ Enforcement error:", error.message, error.stack);
        
        return {
            success: false,
            message: "Credit enforcement failed",
            error: error.message,
            code: 500,
            creditsRemaining: 0,
        };
    }
}

/**
 * Get user's credit balance and subscription info
 */
export async function getUserCreditInfo(userId) {
    try {
        await connectDb();

        console.log(`[Credits] 📊 Fetching credit info for user: ${userId}`);

        // Fetch user, including all necessary subscription fields
        const user = await User.findById(userId).select(
            "aiCredits subscriptionPlan subscriptionStatus creditMonthResetDate"
        );

        if (!user) {
            console.error(`[Credits] ❌ User not found: ${userId}`);
            return null;
        }

        // Use helper to handle lazy monthly credit reset
        await checkAndResetMonthlyCredits(user);

        const isUnlimited = user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium";
        const credits = isUnlimited ? 999999 : (user.aiCredits || 0);

        const info = {
            credits,
            subscriptionPlan: user.subscriptionPlan || "Free",
            subscriptionStatus: user.subscriptionStatus,
            creditsRemaining: credits,
            isUnlimited: isUnlimited,
            creditMonthResetDate: user.creditMonthResetDate ? user.creditMonthResetDate.toISOString() : null,
        };

        console.log(`[Credits] ✅ Credit info fetched:`, info);

        return info;
    } catch (error) {
        console.error("[Credits] ❌ Get info error:", error.message);
        return null;
    }
}

/**
 * Add credits to user (for purchases)
 */
export async function addCredits(userId, amount, source = "purchase") {
    try {
        await connectDb();

        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error("Invalid amount specified for credit addition.");
        }

        console.log(`[Credits] 💰 Adding ${amount} credits to user ${userId} (source: ${source})`);

        const result = await User.updateOne(
            { _id: userId },
            {
                $inc: { aiCredits: amount },
                $set: { 
                    lastCreditPurchaseDate: new Date(),
                    lastCreditPurchaseAmount: amount,
                },
            }
        );

        if (result.modifiedCount === 0) {
            console.error(`[Credits] ❌ Failed to add credits - user not found`);
            return { success: false, message: "User not found" };
        }

        const user = await User.findById(userId).select("aiCredits");

        console.log(`[Credits] ✅ Credits added successfully:`, {
            added: amount,
            newBalance: user.aiCredits,
        });

        return {
            success: true,
            message: "Credits added successfully",
            newBalance: user.aiCredits,
            added: amount,
        };
    } catch (error) {
        console.error("[Credits] ❌ Add credits error:", error.message);
        return {
            success: false,
            message: "Failed to add credits",
            error: error.message,
        };
    }
}