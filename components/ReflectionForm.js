"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, Zap, Brain, ListChecks, CheckCircle2, Circle } from "lucide-react";
import toast from "react-hot-toast";

// Helper component for the 1-10 rating input
const RatingInput = ({ label, value, setValue, icon: Icon }) => (
  <div>
    <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
      <Icon className="w-5 h-5 text-indigo-500" />
      {label}: <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{value}/10</span>
    </label>
    <div className="flex items-center gap-1">
      {[...Array(10)].map((_, i) => (
        <Star
          key={i}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            i < value
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 dark:text-gray-700 hover:text-yellow-300"
          }`}
          onClick={() => setValue(i + 1)}
        />
      ))}
    </div>
    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
      <span>Low</span>
      <span>High</span>
    </div>
  </div>
);

export default function ReflectionForm({ date = new Date(), onClose = () => {} }) {
  const router = useRouter();

  // State for task data
  const [tasks, setTasks] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);

  // State for form inputs
  const [energyRating, setEnergyRating] = useState(5);
  const [focusRating, setFocusRating] = useState(5);
  const [hoursSpent, setHoursSpent] = useState(0);
  const [aiSummary, setAiSummary] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /**
   * FIX: The dependency array is changed to empty ([]).
   * The fetch logic is for the "daily" blueprint and does not rely on the `date` prop
   * inside the effect, so it should only run on mount to prevent the infinite loop
   * if the parent component passes an unstable `date` object.
   */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        // Fetch blueprint for today
        const blueprintRes = await fetch("/api/planner/blueprint");
        if (!blueprintRes.ok) throw new Error("Failed to fetch blueprint");
        
        const blueprint = await blueprintRes.json();
        
        const allTasks = [
          ...(blueprint.scheduledTasks || []),
          ...(blueprint.unscheduledTasks || []),
        ];
        
        const mappedTasks = allTasks.map(t => ({ 
            id: t._id || t.taskId || t.id, // Use the MongoDB ID or fallback
            title: t.title,
            isCompleted: t.isCompleted // Use existing completion status
        }));

        setTasks(mappedTasks);
        
        // Initialize completed tasks based on pre-fetched data
        setCompletedTaskIds(mappedTasks.filter(t => t.isCompleted).map(t => t.id));

      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        toast.error("Could not load today's tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
  }, []); // <-- CRITICAL FIX: Empty dependency array

  // Handler to toggle task completion status
  const toggleTaskCompletion = (taskId) => {
    setCompletedTaskIds((prev) => {
      const isCompleted = prev.includes(taskId);
      const newIds = isCompleted ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      return newIds;
    });
  };
  
  // Renders the list of tasks for review
  const renderTaskReview = () => (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <ListChecks className="h-4 w-4" />
            Daily Task Review ({completedTaskIds.length}/{tasks.length})
        </h4>
        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {tasks.length > 0 ? tasks.map((t) => (
                <div 
                    key={t.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition"
                    onClick={() => toggleTaskCompletion(t.id)}
                >
                    <p className={`flex-1 text-sm font-medium ${completedTaskIds.includes(t.id) ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                        {t.title}
                    </p>
                    {completedTaskIds.includes(t.id) ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <Circle className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                    )}
                </div>
            )) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No tasks found for today. Add one now!</p>
            )}
        </div>
    </div>
  );


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const uncompletedTaskIds = tasks
        .map((t) => t.id)
        .filter((id) => !completedTaskIds.includes(id));
      
      // Note: The reflection API expects `uncompletedTasks` as an array of strings (names/titles)
      // in the User model, but the form payload uses an array of task IDs.
      // We will map the IDs back to titles for consistency with the API's schema fields.
      const uncompletedTaskTitles = tasks
        .filter((t) => uncompletedTaskIds.includes(t.id))
        .map((t) => t.title);

      const payload = {
        date: date.toISOString(),
        energyRating: Number(energyRating),
        focusRating: Number(focusRating),
        // The API only uses `uncompletedTasks` (titles/names) and `tasksCompletedCount`
        uncompletedTasks: uncompletedTaskTitles, 
        tasksCompletedCount: completedTaskIds.length,
        totalHoursPlanned: 0, // Not tracked in this form, assuming a default 0 or removal later
        totalHoursSpent: parseFloat(hoursSpent),
        aiSummary,
      };

      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit reflection");

      toast.success("Reflection saved! Daily progress tracked.");
      
      onClose(); // Close the modal
      router.refresh(); // Refresh Next.js cache
      
    } catch (err) {
      console.error("Reflection submission error:", err);
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading today's progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="mb-8 border-b pb-4 border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
            Evening Reflection
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress and insights for today.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Rating Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800">
            <RatingInput 
              label="Energy Level" 
              value={energyRating} 
              setValue={setEnergyRating} 
              icon={Zap} 
            />
            <RatingInput 
              label="Focus Level" 
              value={focusRating} 
              setValue={setFocusRating} 
              icon={Brain} 
            />
          </div>

          {/* Task Review Section */}
          {renderTaskReview()}

          {/* Hours Spent */}
          <div>
            <label htmlFor="hoursSpent" className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Total Hours Spent Studying
            </label>
            <input
              id="hoursSpent"
              type="number"
              min="0"
              step="0.5"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              placeholder="e.g., 3.5"
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          {/* Summary / Notes */}
          <div>
            <label htmlFor="aiSummary" className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Key Takeaways / Summary (Optional)
            </label>
            <textarea
              id="aiSummary"
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="What went well today? What will you do differently tomorrow?"
              rows="4"
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          {/* Submit and Close Section */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 disabled:opacity-60 transition shadow-lg shadow-emerald-500/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Reflection"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}