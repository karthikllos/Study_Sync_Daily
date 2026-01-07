"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Zap, BarChart3, Clock, CheckCircle, Star } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
    setIsVisible(true);
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--accent-solid)] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className={`max-w-6xl w-full text-center space-y-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
        

          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent leading-tight">
              StudySync Daily
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-[var(--text-secondary)] max-w-3xl mx-auto font-light leading-relaxed">
              Your intelligent academic planner. Blend routines, assignments, and
              micro-goals into a <span className="text-[var(--accent-solid)] font-semibold">seamless daily blueprint</span>.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/auth"
              className="group relative px-8 py-4 bg-[var(--accent-solid)] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Get Started - It's Free</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
            <Link 
              href="/auth" 
              className="px-8 py-4 border-2 border-[var(--accent-solid)] text-[var(--accent-solid)] rounded-xl font-semibold text-lg hover:bg-[var(--accent-solid)] hover:text-white transition-all duration-300 hover:scale-105"
            >
              Login
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-tertiary)] pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-[var(--background)]"></div>
              ))}
            </div>
            <span className="ml-2">Join thousands of successful students</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Powerful features designed to help you stay organized and achieve your academic goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Scheduling",
                description: "Smart algorithms analyze your patterns and suggest optimal study times for maximum retention",
                color: "from-yellow-400 to-orange-500"
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description: "Visualize your journey with detailed insights, charts, and performance metrics",
                color: "from-blue-400 to-cyan-500"
              },
              {
                icon: Clock,
                title: "Time Optimization",
                description: "Eliminate wasted time with intelligent task prioritization and deadline management",
                color: "from-purple-400 to-pink-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative p-8 rounded-2xl bg-[var(--card-background)] border border-[var(--border-color)] hover:border-[var(--accent-solid)] transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-[var(--card-background)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                Stop Juggling Calendars
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                StudySync brings all your academic responsibilities into one intelligent system that adapts to your life.
              </p>
              <ul className="space-y-4">
                {[
                  "Automated task scheduling based on priority",
                  "Smart deadline reminders and notifications",
                  "Integrated calendar syncing",
                  "Collaborative study group features"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[var(--accent-solid)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--foreground)]">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl font-bold text-[var(--accent-solid)] mb-2">95%</div>
                  <p className="text-[var(--text-secondary)] text-lg">Student Satisfaction Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
            Ready to Transform Your Study Life?
          </h2>
          <p className="text-xl text-[var(--text-secondary)]">
            Join thousands of students who've already discovered the power of intelligent planning
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent-solid)] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Start Your Free Journey
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-sm text-[var(--text-tertiary)]">
            No credit card required • Set up in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
