"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  User,
  Calendar,
  PlusCircle"use client";
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

// Reusable Stat Card
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

// ✅ NEW: Helper function to calculate weekly hours from reflections
function calculateWeeklyHours(reflections) {
  if (!reflections || reflections.length === 0) {
    return { planned: 0, completed: 0 };
  }

  // Get start of current week (Sunday)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  // Filter reflections from this week
  const thisWeekReflections = reflections.filter(r => {
    const reflectionDate = new Date(r.date);
    return reflectionDate >= weekStart;
  });

  // Sum up hours
  const totalPlanned = thisWeekReflections.reduce(
    (sum, r) => sum + (r.totalHoursPlanned || 0),
    0
  );
  
  const totalCompleted = thisWeekReflections.reduce(
    (sum, r) => sum + (r.totalHoursSpent || 0),
    0
  );

  return {
    planned: Math.round(totalPlanned * 10) / 10, // Round to 1 decimal
    completed: Math.round(totalCompleted * 10) / 10
  };
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("blueprint");
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

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
      // Fetch blueprint
      const blueprintRes = await fetch("/api/planner/blueprint");
      const blueprintData = await blueprintRes.json();
      setBlueprint(blueprintData);

      // Fetch tasks
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      // Fetch routines
      const routinesRes = await fetch("/api/routines");
      const routinesData = await routinesRes.json();
      setRoutines(routinesData?.routines || []);

      // ✅ NEW: Fetch user profile with reflections for weekly hours calculation
      const profileRes = await fetch("/api/user/academic-profile");
      const profileData = await profileRes.json();
      const reflections = profileData?.academicProfile?.reflections || [];

      // ✅ Calculate weekly hours from actual reflection data
      const weeklyHours = calculateWeeklyHours(reflections);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const tasksDueToday = (Array.isArray(tasksData) ? tasksData : []).filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= today && d <= todayEnd;
      }).length;

      const tasksCompleted = (Array.isArray(tasksData) ? tasksData : []).filter(
        (t) => t.isCompleted
      ).length;

      setStats({
        tasksDueToday,
        tasksCompleted,
        tasksTotal: Array.isArray(tasksData) ? tasksData.length : 0,
        studyStreak: session?.user?.studyStreak || profileData?.studyStreak || 0,
        hoursPlannedThisWeek: weeklyHours.planned, // ✅ FIXED: Now using actual data
        hoursCompletedThisWeek: weeklyHours.completed, // ✅ FIXED: Now using actual data
        routinesActive: routinesData?.routines?.length || 0,
      });
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${session?.user?.username}`;
    navigator.clipboard.writeText(profileUrl);
    alert("Profile link copied!");
  };

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
          subtitle={stats.hoursPlannedThisWeek > 0 
            ? `Target: ${stats.hoursPlannedThisWeek}h` 
            : "No target set"}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Blueprint Timeline */}
      {blueprint?.success ? (
        <DailyBlueprintTimeline blueprintData={blueprint} />
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

        {showTaskForm && <TaskForm onSuccess={fetchDashboardData} />}
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Your Tasks
        </h3>

        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t._id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">
                  {t.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.subject}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-medium ${
                    t.isCompleted
                      ? "text-emerald-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t.isCompleted ? "Completed" : "Pending"}
                </p>
                
                {!t.isCompleted && (
                  <button
                    onClick={() => setSelectedTaskId(t._id)}
                    className="px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
                  >
                    Focus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-8">
      <PomodoroTimer 
        taskId={selectedTaskId} 
        onTimeUpdate={(seconds) => {
          console.log(`Focus time logged: ${Math.floor(seconds / 60)} minutes`);
        }}
      />

      {selectedTaskId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ⏱️ Timer is linked to selected task. Time will be automatically tracked.
          </p>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Unlink task and use as standalone timer
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Weekly Overview
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">Hours Planned</p>
            <p className="text-4xl font-extrabold text-orange-600 dark:text-orange-400">
              {stats.hoursPlannedThisWeek}h
            </p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-2">Hours Completed</p>
            <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.hoursCompletedThisWeek}h
            </p>
          </div>
        </div>

        {stats.hoursPlannedThisWeek > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.round((stats.hoursCompletedThisWeek / stats.hoursPlannedThisWeek) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.hoursCompletedThisWeek / stats.hoursPlannedThisWeek) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowReflectionModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕ Close
            </button>
            <ReflectionForm onClose={() => setShowReflectionModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
},
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

// Reusable Stat Card
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

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("blueprint");
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

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
      // Fetch blueprint
      const blueprintRes = await fetch("/api/planner/blueprint");
      const blueprintData = await blueprintRes.json();
      setBlueprint(blueprintData);

      // Fetch tasks
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      // Fetch routines
      const routinesRes = await fetch("/api/routines");
      const routinesData = await routinesRes.json();
      setRoutines(routinesData?.routines || []);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const tasksDueToday = (Array.isArray(tasksData) ? tasksData : []).filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= today && d <= todayEnd;
      }).length;

      const tasksCompleted = (Array.isArray(tasksData) ? tasksData : []).filter(
        (t) => t.isCompleted
      ).length;

      setStats({
        tasksDueToday,
        tasksCompleted,
        tasksTotal: Array.isArray(tasksData) ? tasksData.length : 0,
        studyStreak: session?.user?.studyStreak || 0,
        hoursPlannedThisWeek: 15,
        hoursCompletedThisWeek: 8.5,
        routinesActive: routinesData?.routines?.length || 0,
      });
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${session?.user?.username}`;
    navigator.clipboard.writeText(profileUrl);
    alert("Profile link copied!");
  };

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

      {/* Blueprint Timeline - ✅ FIXED: Now persists for 24h */}
      {blueprint?.success ? (
        <DailyBlueprintTimeline blueprintData={blueprint} />
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

        {showTaskForm && <TaskForm onSuccess={fetchDashboardData} />}
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Your Tasks
        </h3>

        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t._id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">
                  {t.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.subject}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-medium ${
                    t.isCompleted
                      ? "text-emerald-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t.isCompleted ? "Completed" : "Pending"}
                </p>
                
                {!t.isCompleted && (
                  <button
                    onClick={() => setSelectedTaskId(t._id)}
                    className="px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
                  >
                    Focus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-8">
      {/* ✅ FIXED: Pomodoro Timer now works without taskId requirement */}
      <PomodoroTimer 
        taskId={selectedTaskId} 
        onTimeUpdate={(seconds) => {
          console.log(`Focus time logged: ${Math.floor(seconds / 60)} minutes`);
        }}
      />

      {selectedTaskId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ⏱️ Timer is linked to selected task. Time will be automatically tracked.
          </p>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Unlink task and use as standalone timer
          </button>
        </div>
      )}

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowReflectionModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕ Close
            </button>
            <ReflectionForm onClose={() => setShowReflectionModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
