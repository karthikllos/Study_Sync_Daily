"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Calendar,
  PlusCircle,
  BarChart3,
  Clock,
  Activity,
  MessageSquare,
} from "lucide-react";
import TaskForm from "../../components/TaskForm";
import ReflectionForm from "../../components/ReflectionForm";
import DailyBlueprintTimeline from "../../components/DailyBlueprintTimeline";
import PomodoroTimer from "../../components/PomodoroTimer";

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
    studyStreak: 0,
    hoursPlannedThisWeek: 0,
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
    let studentProfileData = null;

    try {
      setLoading(true);

      // Fetch student profile data
      const profileResponse = await fetch("/api/user/academic-profile");
      if (profileResponse.ok) {
        studentProfileData = await profileResponse.json();
        setProfile(studentProfileData);
      } else {
        console.warn("Could not fetch student profile data.");
        setProfile(null);
      }

      // Fetch tasks
      let tasksData = [];
      const tasksResponse = await fetch("/api/tasks");
      if (tasksResponse.ok) {
        const tasksResponseData = await tasksResponse.json();
        tasksData = Array.isArray(tasksResponseData) ? tasksResponseData : tasksResponseData.tasks || [];
        setTasks(tasksData);
      } else {
        console.warn("Could not fetch tasks data.");
        tasksData = [];
      }

      // Fetch routines
      let routinesData = [];
      const routinesResponse = await fetch("/api/routines");
      if (routinesResponse.ok) {
        const routinesResponseData = await routinesResponse.json();
        routinesData = Array.isArray(routinesResponseData) ? routinesResponseData : routinesResponseData.routines || [];
        setRoutines(routinesData);
      } else {
        console.warn("Could not fetch routines data.");
        routinesData = [];
      }

      // Fetch daily blueprint
      const blueprintResponse = await fetch("/api/planner/blueprint");
      if (blueprintResponse.ok) {
        const blueprintData = await blueprintResponse.json();
        setBlueprint(blueprintData);
      } else {
        console.warn("Could not fetch blueprint data.");
        setBlueprint(null);
      }

      // Fetch predictive focus score (next 24h)
      try {
        const focusResponse = await fetch("/api/ai/predict");
        if (focusResponse.ok) {
          const focusData = await focusResponse.json();
          setFocusPrediction(focusData);
        } else {
          console.warn("Could not fetch focus prediction data.");
          setFocusPrediction(null);
        }
      } catch (focusError) {
        console.warn("Error fetching focus prediction:", focusError);
        setFocusPrediction(null);
      }

      // Compute stats from fetched data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tasksDueToday = tasksData.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length;

      const studyStreak = studentProfileData?.studyStreak ?? 0;
      const hoursPlannedThisWeek = (studentProfileData?.academicProfile?.targetHoursPerWeek) ?? 0;

      setStats({
        tasksDueToday,
        studyStreak,
        hoursPlannedThisWeek,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setProfile(null);
      setTasks([]);
      setRoutines([]);
      setBlueprint(null);
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${session?.user?.username}`;
    navigator.clipboard.writeText(profileUrl);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "blueprint", label: "Blueprint", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: PlusCircle },
    { id: "stats", label: "Stats", icon: BarChart3 },
  ];

  const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
    const colorClasses = {
      emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
      blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
      purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${colorClasses[color]?.split(" ").slice(0, 4).join(" ")}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  };

  const renderBlueprint = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {profile?.name || session?.user?.name || session?.user?.username}!
            </h1>
            <p className="text-emerald-100 text-lg">
              Your daily StudySync Blueprint to plan and track study sessions.
            </p>
          </div>
          <div className="hidden md:block flex-shrink-0">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Add Task
          </button>
          <button
            onClick={() => setShowReflectionModal(true)}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Evening Reflection
          </button>
          <button
            onClick={copyProfileLink}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Clock className="h-5 w-5" />
            Share Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Tasks Due Today"
          value={stats.tasksDueToday}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Study Streak"
          value={`${stats.studyStreak} day${stats.studyStreak === 1 ? "" : "s"}`}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Hours Planned This Week"
          value={stats.hoursPlannedThisWeek}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Predictive Focus Score status bar */}
      {focusPrediction && Array.isArray(focusPrediction.hours) && focusPrediction.hours.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Predictive Focus Score (next 24h)</p>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Baseline: {focusPrediction.baseline ?? "--"}/100
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
              style={{
                width: `${Math.max(
                  10,
                  Math.min(
                    100,
                    focusPrediction.baseline ?? 60,
                  ),
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Higher scores suggest better focus windows. Plan deep work near your peak hours.
          </p>
        </div>
      )}

      {/* Daily Blueprint Timeline */}
      {blueprint ? (
        <DailyBlueprintTimeline blueprint={blueprint} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Loading your daily blueprint...
          </p>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Task or Routine</h2>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="text-emerald-600 hover:underline text-sm"
          >
            {showTaskForm ? "Hide" : "Show"}
          </button>
        </div>
        {showTaskForm && (
          <TaskForm onSuccess={() => {
            setShowTaskForm(false);
            fetchDashboardData();
          }} />
        )}
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Academic Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">No tasks yet. Create one above!</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t._id || t.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{t.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t.subject || "No subject"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}
                  </p>
                  <div className="mt-2">
                    <PomodoroTimer taskId={t._id || t.id} />
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full flex-shrink-0 self-start md:self-auto">
                  {t.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routines List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recurring Routines</h3>
        {routines.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">No routines yet. Create one above!</p>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => (
              <div key={r._id || r.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{r.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {r.startTime} • {r.duration} min
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Days: {Array.isArray(r.daysOfWeek) ? r.daysOfWeek.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ") : "N/A"}
                  </p>
                </div>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex-shrink-0">
                  {r.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Study Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Current Study Streak"
          value={`${stats.studyStreak} day${stats.studyStreak === 1 ? "" : "s"}`}
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Weekly Hours Target"
          value={stats.hoursPlannedThisWeek}
          icon={Clock}
          color="blue"
        />
      </div>

      <div className="text-center py-8 text-gray-600 dark:text-gray-400 border-t border-dashed border-gray-200 dark:border-gray-700 mt-4">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-60" />
        <p className="text-lg font-medium mb-1">More analytics coming soon</p>
        <p className="text-sm">
          Keep completing daily reflections to unlock deeper insights into your focus patterns and study habits.
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "blueprint":
        return renderBlueprint();
      case "tasks":
        return renderTasks();
      case "stats":
        return renderStats();
      default:
        return renderBlueprint();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10 flex-shrink-0">
                {profile?.profilepic ? (
                  <Image src={profile.profilepic} alt="Profile" fill className="rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">StudySync Blueprint</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{session?.user?.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={copyProfileLink}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <Link
                href={`/${session?.user?.username}`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">View Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {renderTabContent()}
      </div>

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Evening Reflection</h2>
                <button
                  onClick={() => setShowReflectionModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>
              <ReflectionForm
                date={new Date()}
                onSuccess={() => {
                  setShowReflectionModal(false);
                  fetchDashboardData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}