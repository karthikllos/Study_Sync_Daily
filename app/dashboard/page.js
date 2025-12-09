"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  User,
  Calendar,
  PlusCircle,
  BarChart3,
  Clock,
  Activity,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Share2,
} from "lucide-react";

import TaskForm from "../../components/TaskForm";
import ReflectionForm from "../../components/ReflectionForm";
import DailyBlueprintTimeline from "../../components/DailyBlueprintTimeline";
import PomodoroTimer from "../../components/PomodoroTimer";

// ----------------------------------------------------------------------
// Reusable Stat Card
// ----------------------------------------------------------------------
const StatCard = ({ title, value, subtitle, icon: Icon, color = "emerald" }) => {
  const colorClasses = {
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/30",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/30",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/30",
  };

  const currentClasses = colorClasses[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p
            className={`text-3xl font-extrabold mt-2 ${currentClasses
              .split(" ")
              .slice(0, 2)
              .join(" ")}`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl ${currentClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ----------------------------------------------------------------------
export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("blueprint");
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [blueprint, setBlueprint] = useState(null);
  const [focusPrediction, setFocusPrediction] = useState(null);

  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [stats, setStats] = useState({
    tasksDueToday: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    studyStreak: 0,
    hoursPlannedThisWeek: 0,
    hoursCompletedThisWeek: 0,
    routinesActive: 0,
  });

  // ----------------------------------------------------------------------
  // FETCH DATA
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Mock API data
      const mockProfile = {
        name: session?.user?.name || "Student",
        studyStreak: 5,
        academicProfile: { targetHoursPerWeek: 15 },
      };

      const mockTasks = [
        {
          id: "t1",
          title: "Finish Calc III Homework",
          subject: "Math",
          dueDate: new Date().toISOString(),
          estimatedDuration: 90,
          priority: 5,
          isCompleted: false,
        },
        {
          id: "t2",
          title: "Read Chapter 4 (History)",
          subject: "History",
          dueDate: new Date().toISOString(),
          estimatedDuration: 60,
          priority: 4,
          isCompleted: false,
        },
        {
          id: "t3",
          title: "Clean inbox",
          subject: "Admin",
          estimatedDuration: 30,
          priority: 2,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        },
      ];

      const mockRoutines = [
        {
          id: "r1",
          name: "Morning Prep",
          startTime: "07:00",
          duration: 30,
          daysOfWeek: [1, 2, 3, 4, 5],
        },
      ];

      const mockBlueprint = { routines: [], assignments: [], microGoals: [] };
      const mockFocus = { baseline: 78, hours: [] };

      await new Promise((r) => setTimeout(r, 500)); // simulate delay

      setProfile(mockProfile);
      setTasks(mockTasks);
      setRoutines(mockRoutines);
      setBlueprint({ success: true, blueprint: mockBlueprint });
      setFocusPrediction({ success: true, ...mockFocus });

      // ---------------- STATISTICS ------------------
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const tasksDueToday = mockTasks.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= today && d <= todayEnd;
      }).length;

      const tasksCompleted = mockTasks.filter(
        (t) => t.isCompleted || t.completed
      ).length;

      const tasksTotal = mockTasks.length;

      const hoursPlannedThisWeek =
        mockProfile?.academicProfile?.targetHoursPerWeek ?? 0;

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const hoursCompletedThisWeek = mockTasks
        .filter((t) => {
          if (!t.isCompleted && !t.completed) return false;
          const completedDate = t.completedAt
            ? new Date(t.completedAt)
            : new Date();
          return completedDate >= weekStart && completedDate < weekEnd;
        })
        .reduce(
          (sum, t) => sum + (t.actualDuration || t.estimatedDuration || 0) / 60,
          0
        );

      setStats({
        tasksDueToday,
        tasksCompleted,
        tasksTotal,
        studyStreak: mockProfile.studyStreak,
        hoursPlannedThisWeek,
        hoursCompletedThisWeek: Math.round(hoursCompletedThisWeek * 10) / 10,
        routinesActive: mockRoutines.length,
      });
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // ----------------------------------------------------------------------
  // COPY PROFILE LINK
  // ----------------------------------------------------------------------
  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${session?.user?.username}`;
    navigator.clipboard.writeText(profileUrl);
    alert("Profile link copied!");
  };

  // ======================================================================
  // LOADING STATE
  // ======================================================================
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-x-2">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-500 mb-4" />
          <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Loading StudySync dashboard...
          </span>
        </div>
      </div>
    );
  }

  // ======================================================================
  // BLUEPRINT TAB
  // ======================================================================
  const renderBlueprint = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
            Welcome, {profile?.name || session?.user?.name || "Student"}!
          </h1>

          <div className="hidden md:block bg-white/30 backdrop-blur-md rounded-2xl p-4 shadow-xl">
            <Activity className="h-12 w-12 text-white" />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className="bg-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/40 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            <PlusCircle className="h-5 w-5" />
            New Task / Routine
          </button>

          <button
            onClick={() => setShowReflectionModal(true)}
            className="bg-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/40 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            <MessageSquare className="h-5 w-5" />
            Daily Reflection
          </button>

          <button
            onClick={copyProfileLink}
            className="bg-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/40 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            <Share2 className="h-5 w-5" />
            Share Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Due Today"
          value={stats.tasksDueToday}
          subtitle={`${stats.tasksTotal} total tasks`}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Completion Rate"
          value={`${
            stats.tasksTotal > 0
              ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)
              : 0
          }%`}
          subtitle={`${stats.tasksCompleted} completed`}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Study Streak"
          value={`${stats.studyStreak} day${
            stats.studyStreak === 1 ? "" : "s"
          }`}
          subtitle="Consistent progress"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Weekly Hours"
          value={`${stats.hoursCompletedThisWeek}h`}
          subtitle={`Target: ${stats.hoursPlannedThisWeek}h`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Focus Prediction */}
      {focusPrediction?.success && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-l-4 border-teal-500 dark:border-teal-400">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-500" />
              Predictive Focus Score
            </p>

            <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
              {focusPrediction.baseline}/100
            </span>
          </div>

          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
              style={{ width: `${focusPrediction.baseline}%` }}
            />
          </div>
        </div>
      )}

      {/* Blueprint Timeline */}
      {blueprint?.success ? (
        <DailyBlueprintTimeline blueprint={blueprint.blueprint} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-700 dark:text-gray-300">
            No Blueprint generated.
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Add tasks to generate your daily plan.
          </p>
        </div>
      )}
    </div>
  );

  // ======================================================================
  // TASKS & ROUTINES TAB
  // ======================================================================
  const renderTasks = () => (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-t-4 border-emerald-500">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Add Task / Routine
          </h2>

          <button
            onClick={() => setShowTaskForm((prev) => !prev)}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-semibold transition"
          >
            {showTaskForm ? "Close" : "Open"}
          </button>
        </div>

        {showTaskForm && <TaskForm />}
      </div>

      {/* TASK LIST */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Your Tasks
        </h3>

        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {t.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.subject}
                </p>
              </div>

              <p
                className={`text-sm font-medium ${
                  t.isCompleted
                    ? "text-emerald-500"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {t.isCompleted ? "Completed" : "Pending"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ======================================================================
  // ANALYTICS TAB
  // ======================================================================
  const renderStatsTab = () => (
    <div className="space-y-8">
      <PomodoroTimer />

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Weekly Overview
        </h2>

        <p className="text-gray-600 dark:text-gray-400">
          Time-based analytics will be displayed here.
        </p>
      </div>
    </div>
  );

  // ======================================================================
  // PAGE UI
  // ======================================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-10">
      {/* Tabs */}
      <div className="mb-10">
        <div className="flex gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 w-fit">
          {[
            { id: "blueprint", label: "Blueprint", icon: Calendar },
            { id: "tasks", label: "Tasks", icon: PlusCircle },
            { id: "stats", label: "Analytics", icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Tab */}
      {activeTab === "blueprint" && renderBlueprint()}
      {activeTab === "tasks" && renderTasks()}
      {activeTab === "stats" && renderStatsTab()}

      {/* Reflection Modal */}
      {showReflectionModal && (
        <ReflectionForm onClose={() => setShowReflectionModal(false)} />
      )}
    </div>
  );
}
