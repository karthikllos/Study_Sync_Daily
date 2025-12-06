"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Zap, AlertCircle } from "lucide-react";

export default function CreditBadge() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchCredits();
      // Refresh every 30 seconds
      const interval = setInterval(fetchCredits, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchCredits = async () => {
    try {
      const res = await fetch(`/api/user/academic-profile?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCredits(data.aiCredits || 0);
        setPlan(data.subscriptionPlan);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session || loading) return null;

  const isLowOnCredits = credits < 5 && plan !== "Pro Max" && plan !== "Premium";
  const isUnlimited = plan === "Pro Max" || plan === "Premium";

  return (
    <div className="flex items-center gap-3">
      {/* Credit Display */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium text-[var(--foreground)]">
          {isUnlimited ? "∞" : credits} Credits
        </span>
      </div>

      {/* Low Credits Warning */}
      {isLowOnCredits && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 animate-pulse">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            Low credits
          </span>
          <Link
            href="/pricing"
            className="ml-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:underline"
          >
            Buy now
          </Link>
        </div>
      )}
    </div>
  );
}