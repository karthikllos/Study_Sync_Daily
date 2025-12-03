"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AcademicProfileSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [institution, setInstitution] = useState("");
  const [major, setMajor] = useState("");
  const [targetHoursPerWeek, setTargetHoursPerWeek] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?redirect=academic-setup");
    }
  }, [status, router]);

  const validate = () => {
    if (!institution.trim()) {
      toast.error("Institution is required");
      return false;
    }
    if (institution.trim().length > 100) {
      toast.error("Institution name is too long (max 100 chars)");
      return false;
    }
    if (major && major.trim().length > 100) {
      toast.error("Major is too long (max 100 chars)");
      return false;
    }
    const n = Number(targetHoursPerWeek);
    if (Number.isNaN(n) || n < 0) {
      toast.error("Target hours per week must be a non-negative number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/academic-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: institution.trim(),
          major: major.trim(),
          targetHoursPerWeek: Number(targetHoursPerWeek) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save academic profile");
        setLoading(false);
        return;
      }
      toast.success("Academic profile saved");
      router.push("/dashboard");
    } catch (err) {
      console.error("Academic profile submit error:", err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 py-12">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-4">Academic Profile Setup</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Fill in your institution, major and weekly study target to personalize StudySync Daily.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Institution *
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., University of Example"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Major
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Computer Science"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Hours Per Week
              </label>
              <input
                type="number"
                min="0"
                value={targetHoursPerWeek}
                onChange={(e) => setTargetHoursPerWeek(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 10"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save and Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}