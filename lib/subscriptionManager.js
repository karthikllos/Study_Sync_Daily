import User from "../models/user";
import connectDb from "./connectDb";

const TIER_CREDITS = {
  Free: 0,
  Starter: 50,
  Pro: 200,
  Premium: 1000,
};

export const recordSubscriptionChange = async (userId, planName, paymentId, amount) => {
  await connectDb();

  const now = new Date();
  const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const creditsToAdd = TIER_CREDITS[planName] || 0;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionPlan: planName,
        subscriptionStatus: "active",
        subscriptionStartDate: now,
        subscriptionRenewalDate: renewalDate,
        credits: creditsToAdd,
        creditsUsed: 0,
        $push: {
          paymentHistory: {
            razorpayPaymentId: paymentId,
            plan: planName,
            amount: amount,
            status: "completed",
            createdAt: now,
          },
        },
      },
      { new: true }
    );

    console.log(`✅ [Subscription] Updated for user ${userId}:`, {
      plan: planName,
      credits: creditsToAdd,
      renewalDate,
      paymentId,
    });

    return user;
  } catch (error) {
    console.error("❌ [Subscription] Update failed:", error.message);
    throw error;
  }
};

export const getUserCredits = async (userId) => {
  await connectDb();
  const user = await User.findById(userId).select(
    "credits creditsUsed subscriptionPlan subscriptionStatus"
  );

  if (!user) {
    return { available: 0, used: 0, plan: "Free", status: "inactive" };
  }

  return {
    available: Math.max(0, (user.credits || 0) - (user.creditsUsed || 0)),
    used: user.creditsUsed || 0,
    plan: user.subscriptionPlan || "Free",
    status: user.subscriptionStatus,
    total: user.credits || 0,
  };
};

export const deductCredits = async (userId, creditsNeeded, feature) => {
  await connectDb();
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  // Premium users have unlimited credits
  if (user.subscriptionPlan === "Premium") {
    console.log(`✅ [Credits] Premium user using ${feature} - unlimited`);
    return { available: 99999, used: 0, isPremium: true };
  }

  const available = (user.credits || 0) - (user.creditsUsed || 0);

  if (available < creditsNeeded) {
    throw new Error(
      `Insufficient credits. Available: ${available}, Needed: ${creditsNeeded}`
    );
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditsUsed: creditsNeeded } },
    { new: true }
  );

  const newAvailable = (updated.credits || 0) - (updated.creditsUsed || 0);

  console.log(`✅ [Credits] Deducted for ${feature}:`, {
    userId,
    deducted: creditsNeeded,
    remaining: newAvailable,
  });

  return {
    available: newAvailable,
    used: updated.creditsUsed,
    plan: updated.subscriptionPlan,
  };
};

export const getSubscriptionAnalytics = async () => {
  await connectDb();
  
  const users = await User.find({}).select('subscriptionPlan subscriptionStatus aiCredits paymentHistory').lean();
  
  const totalUsers = users.length;
  const paidUsers = users.filter(u => u.subscriptionPlan && u.subscriptionPlan !== 'Free').length;
  const freeUsers = totalUsers - paidUsers;
  
  const totalRevenue = users.reduce((sum, u) => {
    if (!u.paymentHistory) return sum;
    return sum + u.paymentHistory.reduce((s, p) => s + (p.amount || 0), 0);
  }, 0);
  
  const monthlyRecurringRevenue = users.filter(u => 
    ['Pro', 'Pro Max', 'Premium'].includes(u.subscriptionPlan) && u.subscriptionStatus === 'active'
  ).length * 9900;
  
  const subscriptionBreakdown = {
    Free: { count: users.filter(u => !u.subscriptionPlan || u.subscriptionPlan === 'Free').length, revenue: 0 },
    Starter: { count: users.filter(u => u.subscriptionPlan === 'Starter').length, revenue: 0, monthlyPrice: 4999 },
    Pro: { count: users.filter(u => u.subscriptionPlan === 'Pro').length, revenue: 0, monthlyPrice: 9999 },
    Premium: { count: users.filter(u => u.subscriptionPlan === 'Premium' || u.subscriptionPlan === 'Pro Max').length, revenue: 0, monthlyPrice: 19999 },
  };
  
  return {
    totalUsers,
    paidUsers,
    freeUsers,
    totalRevenue: totalRevenue / 100,
    monthlyRecurringRevenue: monthlyRecurringRevenue / 100,
    subscriptionBreakdown,
    churnRate: 0,
    conversionRate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0,
    averageRevenuePerUser: paidUsers > 0 ? (totalRevenue / paidUsers) / 100 : 0,
  };
};