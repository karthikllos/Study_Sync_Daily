"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";

/*
Refactor this component to be the new landing page logic for StudySync Daily.
1. Import necessary functions: 'useSession' from 'next-auth/react' and 'useRouter' from 'next/navigation'.
2. If the user's session status is 'authenticated', redirect them immediately to '/dashboard'.
3. If the user is 'unauthenticated' or 'loading', display a simple placeholder landing page with:
   - Title: "Welcome to StudySync Daily"
   - CTA button: "Get Started" linking to '/auth' or '/signup'
*/

// Note: Ensure all hooks are called at the top level and unconditionally.

export default function Home() {
  // 1. CALL ALL HOOKS UNCONDITIONALLY AT THE TOP
  const { data: session, status } = useSession();
  const router = useRouter();

  // 2. Use useEffect for side effects like redirection
  useEffect(() => {
    // We only redirect after the session status is definitively known (authenticated)
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]); // Dependency array includes status and router

  // 3. Handle loading state with an early return
  if (status === "loading" || status === "authenticated") {
    // This is a consistent return, so hook order is maintained
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-lg font-medium text-gray-700 dark:text-gray-300">
          Loading Planner...
        </span>
      </div>
    );
  }

  // 4. Render the landing page for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-center p-8">
      <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white mb-4">
        StudySync Daily
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
        Your intelligent academic planner. Blend routines, assignments, and micro-goals into a seamless daily blueprint.
      </p>

      <div className="space-x-4 flex flex-wrap justify-center gap-4">
        <Link
          href="/auth"
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors inline-flex items-center"
        >
          Get Started - It's Free <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
        <Link
          href="/auth"
          className="text-emerald-600 border border-emerald-600 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-colors dark:hover:bg-gray-800"
        >
          Login
        </Link>
      </div>

      <p className="mt-12 text-sm text-gray-500 dark:text-gray-500">
        Stop juggling calendars. Start syncing your success.
      </p>
    </div>
  );
}
