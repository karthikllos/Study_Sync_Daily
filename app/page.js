"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const { data: session } = useSession();
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Load real payment data from API
  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/payments", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const transformedData = Array.isArray(data)
            ? data.map((payment) => ({
                supporter:
                  payment.name ||
                  `Anonymous${Math.floor(Math.random() * 100)}`,
                amount: Number(payment.amount) || 1,
                message: payment.message || "Thanks for the chai!",
                timestamp:
                  payment.createdAt ||
                  payment.timestamp ||
                  new Date().toISOString(),
              }))
            : [];
          setSupporters(transformedData);
        }
      } catch (error) {
        console.error("Failed to load payments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();

    // Listen for payment updates
    const handlePaymentUpdate = () => {
      loadPayments();
    };

    window.addEventListener("payments-updated", handlePaymentUpdate);
    return () =>
      window.removeEventListener("payments-updated", handlePaymentUpdate);
  }, []);

  // Fetch user profile to determine if user is a creator
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch("/api/creator/profile");
          if (res.ok) {
            const profile = await res.json();
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [session]);

  return (
    <main className="relative min-h-[100vh] flex flex-col items-center px-6 overflow-hidden pb-24">

      {/* Background Layers */}
      <div className="absolute inset-0 z-0" style={{ background: "var(--background)" }} />
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(135deg, var(--background) 0%, var(--surface-2, #f1f5f9) 20%, var(--surface, #ffffff) 60%, var(--surface-2, #f8fafc) 100%)`,
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 20%, var(--accent-border, rgba(16,185,129,0.15)) 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 40% at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 60%)`,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full opacity-20 blur-xl animate-bounce" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-violet-600 to-blue-500 rounded-full opacity-20 blur-xl animate-bounce" />
      <div className="absolute bottom-32 left-20 w-28 h-28 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-20 blur-xl animate-bounce" />

      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-4xl space-y-8 mt-16 mb-16">
        <div className="relative">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 flex items-center justify-center gap-4 flex-wrap transition-colors duration-500">
            <span
              className="text-green-600 animate-pulse drop-shadow-sm dark:bg-clip-text dark:text-transparent dark:animate-pulse dark:drop-shadow-lg"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Buy Me A Chai
            </span>
            <div className="relative">
              <img
                src="https://i0.wp.com/boingboing.net/wp-content/uploads/2016/12/decorate-1.gif?resize=370%2C172&ssl=1"
                alt="chai gif"
                className="w-[5rem] h-[5rem] sm:w-[6.5rem] sm:h-[6.5rem] rounded-xl shadow-md transition-all duration-300 transform hover:scale-110 bg-white/70 backdrop-blur-md border-2 border-white/20"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-pink-500 to-violet-600 opacity-30 blur-md -z-10 animate-pulse" />
            </div>
          </h1>
        </div>

        {/* Tagline */}
        <div
          className="relative backdrop-blur-sm rounded-2xl p-8 border shadow-xl space-y-6"
          style={{
            backgroundColor: "var(--surface, rgba(255,255,255,0.8))",
            borderColor: "var(--border, rgba(0,0,0,0.1))",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{
              backgroundImage: "linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6)",
            }}
          />
          <div
            className="text-xs font-semibold uppercase tracking-wider pt-2"
            style={{ color: "var(--muted, #64748b)" }}
          >
            SUPPORT
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            <span style={{ color: "var(--foreground)" }}>
              Give your audience an easy way to say thanks.
            </span>
          </h2>
          <p
            className="text-lg font-light leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--muted, #64748b)" }}
          >
            Buy Me a Chai makes supporting fun and easy. In just a couple of taps,
            your fans can make the payment (buy you a chai) and leave a message.
            <span
              className="text-green-600 animate-pulse drop-shadow-sm dark:bg-clip-text dark:text-transparent dark:animate-pulse dark:drop-shadow-lg"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Buy Me A Chai
            </span>
          </p>
        </div>
      </div>

      {/* Dashboard (Recent Supporters) */}
      <div className="relative z-10 w-full max-w-6xl mb-16">
        <Dashboard />
      </div>

      {/* Welcome Section for Non-Logged-in Users */}
      {!session && (
        <div className="relative z-10 w-full max-w-4xl mb-16">
          <div
            className="relative backdrop-blur-lg rounded-2xl p-8 border shadow-xl text-center"
            style={{
              backgroundColor: "var(--surface, rgba(255,255,255,0.9))",
              borderColor: "var(--border, rgba(0,0,0,0.1))",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                backgroundImage: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)",
              }}
            />
            <div className="pt-4">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                🚀 Join Our Community!
              </h3>
              <p
                className="text-lg leading-relaxed mb-8 max-w-2xl mx-auto"
                style={{ color: "var(--muted, #64748b)" }}
              >
                Sign up to start your creative journey or discover amazing creators to support.
                It's free and takes just a minute!
              </p>
              
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
              >
                <span>🎆 Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons for Logged-in Users */}
      {session && (
        <div className="relative z-10 w-full max-w-2xl mb-16">
          {userProfile?.isCreator && userProfile?.profileSetupComplete ? (
            /* Creator Dashboard Button */
            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </Link>
            </div>
          ) : (
            /* User Action Buttons */
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/creator-setup"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <span>🎨</span>
                <span>Start My Creator Page</span>
              </Link>
              
              <Link
                href="/find-creators"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <span>🔍</span>
                <span>Find Creators</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Features Section */}
      {/* ... (unchanged, keeping intact) ... */}

      {/* Call-to-Action Section */}
      {/* ... (unchanged, keeping intact) ... */}

      {/* Floating Logo */}
      <div
        className="absolute bottom-6 right-8 opacity-30 hover:opacity-80 transition-opacity duration-300 transform hover:scale-110 animate-bounce"
        style={{ animationDuration: "4s" }}
      >
        <div className="relative">
          <Image src="/logo.png" alt="chai cup" width={80} height={80} className="rounded-full" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-cyan-500 opacity-30 blur-lg -z-10 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
