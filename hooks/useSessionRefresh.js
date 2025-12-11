// hooks/useSessionRefresh.js
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useCallback } from "react";

export function useSessionRefresh(interval = 5000) {
  const { data: session, update } = useSession();

  const refreshSession = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error('[Session] Refresh failed:', error);
    }
  }, [update]);

  useEffect(() => {
    // Refresh session periodically
    const timer = setInterval(refreshSession, interval);
    return () => clearInterval(timer);
  }, [refreshSession, interval]);

  return { session, refreshSession };
}

// Alternative: Force immediate session refresh
export async function forceSessionRefresh() {
  if (typeof window !== 'undefined') {
    // Trigger NextAuth to refetch session
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
    
    // Wait a bit then reload if needed
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}