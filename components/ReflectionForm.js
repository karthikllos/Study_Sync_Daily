"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, Circle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ReflectionForm({ date = new Date(), onSuccess = () => {} }) {
  const router = useRouter();

  const [energyRating, setEnergyRating] = useState(3);
  const [focusRating, setFocusRating] = useState(3);
  const [tasks, setTasks] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tasks for the day on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Fetch scheduled tasks for today
        const blueprint = await fetch("/api/planner/blueprint").then((r) => r.json());
        const allTasks = [
          ...(blueprint.scheduledTasks || []),
          ...(blueprint.unscheduledTasks || []),
        ];
        setTasks(allTasks);
        setCompletedTaskIds([]);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        toast.error("Could not load today's tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [date]);

  const toggleTaskCompletion = (taskId) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculate uncompleted tasks
      const uncompletedTaskIds = tasks
        .map((t) => t.taskId || t.id)
        .filter((id) => !completedTaskIds.includes(id));

      const payload = {
        date: date.toISOString(),
        energyRating: Number(energyRating),
        focusRating: Number(focusRating),
        completedTasks: completedTaskIds,
        uncompletedTasks: uncompletedTaskIds,
        tasksReviewed: tasks.length,
      };

      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit reflection");

      toast.success("Reflection saved! Tasks will be rescheduled.");
      onSuccess(data);
      router.refresh();
    } catch (err) {
      console.error("Reflection submission error:", err);
      toast.error(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Evening Reflection
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            How was your day? Take a moment to reflect and track your progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Energy Rating */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              Energy Level: {energyRating}/5
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEnergyRating(star)}
                  className={`p-2 rounded-lg transition ${
                    energyRating >= star
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                  }`}
                >
                  <Star className="h-6 w-6" fill="currentColor" />
                </button>
              ))}
            </div>
          </div>

          {/* Focus Rating */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              Focus Level: {focusRating}/5
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFocusRating(star)}
                  className={`p-2 rounded-lg transition ${
                    focusRating >= star
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                  }`}
                >
                  <Star className="h-6 w-6" fill="currentColor" />
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Completion */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              Today's Tasks ({completedTaskIds.length}/{tasks.length} completed)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No tasks scheduled for today.
                </p>
              ) : (
                tasks.map((task) => {
                  const taskId = task.taskId || task.id;
                  const isCompleted = completedTaskIds.includes(taskId);
                  return (
                    <button
                      key={taskId}
                      type="button"
                      onClick={() => toggleTaskCompletion(taskId)}
                      className={`w-full p-3 rounded-lg border-2 transition flex items-start gap-3 ${
                        isCompleted
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="pt-1">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <p
                          className={`font-medium ${
                            isCompleted
                              ? "text-emerald-900 dark:text-emerald-100 line-through"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.scheduledStart && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(task.scheduledStart).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Saving Reflection...
                </>
              ) : (
                "Save Reflection"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setEnergyRating(3);
                setFocusRating(3);
                setCompletedTaskIds([]);
              }}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Reset
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your reflection will be used to improve tomorrow's plan and reschedule any uncompleted tasks.
          </p>
        </form>
      </div>
    </div>
  );
}