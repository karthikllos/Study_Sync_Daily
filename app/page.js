"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Zap, BarChart3, Clock } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-solid)]" />
          <span className="text-lg font-medium text-[var(--foreground)]">
            Loading Planner...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
              StudySync Daily
            </h1>
            <p className="text-xl sm:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Your intelligent academic planner. Blend routines, assignments, and
              micro-goals into a seamless daily blueprint.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="card">
              <Zap className="h-8 w-8 text-[var(--accent-solid)] mx-auto mb-3" />
              <h3 className="font-bold text-[var(--foreground)] mb-2">
                AI-Powered
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Smart scheduling with intelligent task recommendations
              </p>
            </div>
            <div className="card">
              <BarChart3 className="h-8 w-8 text-[var(--accent-solid)] mx-auto mb-3" />
              <h3 className="font-bold text-[var(--foreground)] mb-2">
                Track Progress
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Real-time analytics and performance insights
              </p>
            </div>
            <div className="card">
              <Clock className="h-8 w-8 text-[var(--accent-solid)] mx-auto mb-3" />
              <h3 className="font-bold text-[var(--foreground)] mb-2">
                Save Time
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Optimize study sessions for maximum efficiency
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth"
              className="btn-primary inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Get Started - It's Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/auth" className="btn-secondary">
              Login
            </Link>
          </div>

          {/* Tagline */}
          <p className="text-sm text-[var(--text-tertiary)] pt-8">
            Stop juggling calendars. Start syncing your success.
          </p>
        </div>
      </section>

     
    </div>
  );
}
