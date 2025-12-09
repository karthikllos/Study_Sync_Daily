"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Repeat2, Calendar, Clock, Loader2, BookOpen, Hash } from "lucide-react";

export default function TaskForm({ initialData = null, onSuccess = () => {} }) {
  const router = useRouter();
  
  // Determine if we are starting with a Task or a Routine based on initialData
  const initialMode = initialData?.daysOfWeek?.length ? "routine" : "task";
  const [mode, setMode] = useState(initialMode);

  // Common
  const [title, setTitle] = useState(initialData?.title || initialData?.name || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [type, setType] = useState(initialData?.type || "assignment");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Task-specific
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : ""
  );
  const [estimatedDuration, setEstimatedDuration] = useState(initialData?.estimatedDuration || 60);

  // Routine-specific
  const [daysOfWeek, setDaysOfWeek] = useState(
    initialData?.daysOfWeek?.length ? initialData.daysOfWeek : []
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || "08:00");
  const [duration, setDuration] = useState(initialData?.duration || 60);

  const toggleDay = (d) => {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  // --- Form Submission Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (mode === "task") {
        if (!title.trim() || !dueDate) {
          setErrorMessage("Please provide a Title and a Due Date for the task.");
          setLoading(false);
          return;
        }

        const payload = {
          title: title.trim(),
          subject: subject.trim(),
          type,
          dueDate: new Date(dueDate).toISOString(),
          estimatedDuration: Number(estimatedDuration) || 60,
        };

        const res = await fetch("/api/tasks", {
          method: initialData ? "PUT" : "POST", // Use PUT if updating existing data
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to save task");
        
        onSuccess(data);
        router.refresh();
      } else {
        // routine
        if (!title.trim() || daysOfWeek.length === 0) {
          setErrorMessage("Please provide a Title and select at least one Day for the routine.");
          setLoading(false);
          return;
        }

        const payload = {
          name: title.trim(),
          type,
          daysOfWeek: daysOfWeek.sort((a, b) => a - b),
          startTime,
          duration: Number(duration) || 60,
          isFixed: true, // Assuming all created routines are fixed
        };

        const res = await fetch("/api/routines", {
          method: initialData ? "PUT" : "POST", // Use PUT if updating existing data
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to save routine");
        
        onSuccess(data);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.message || "Submit failed. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setType("assignment");
    setDueDate("");
    setEstimatedDuration(60);
    setDaysOfWeek([]);
    setStartTime("08:00");
    setDuration(60);
    setErrorMessage("");
    // Keep mode as is, as it's the user's current focus
  };

  const days = [
    { id: 0, label: "Sun" },
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
  ];

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
      
      {/* --- Mode Toggle Header --- */}
      <div className="flex items-center gap-3 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <button
          type="button"
          onClick={() => setMode("task")}
          className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
            mode === "task" 
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" 
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <ClipboardCheck className="h-5 w-5" />
          One-Time Task
        </button>
        <button
          type="button"
          onClick={() => setMode("routine")}
          className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
            mode === "routine" 
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" 
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <Repeat2 className="h-5 w-5" />
          Recurring Routine
        </button>
      </div>

      {/* --- Error Message --- */}
      {errorMessage && (
        <div className="p-4 mb-4 text-sm font-medium rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Title Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {mode === "task" ? "Task Title" : "Routine Name"} <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition duration-300"
            placeholder={mode === "task" ? "e.g., Finalize project report" : "e.g., Evening language practice"}
            required
          />
        </div>

        {/* Subject Input */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500"/> Subject/Context
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition duration-300"
            placeholder="e.g., Calculus, Python, Wellness"
          />
        </div>

        {/* Type Select */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Hash className="h-4 w-4 text-emerald-500"/> Category Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition duration-300"
          >
            <option value="assignment">Assignment</option>
            <option value="exam">Exam Prep</option>
            <option value="reading">Reading</option>
            <option value="micro_goal">Micro Goal</option>
            <option value="lecture_prep">Lecture Prep</option>
          </select>
        </div>

        {mode === "task" ? (
          /* --- TASK-SPECIFIC FIELDS --- */
          <>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500"/> Due Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition duration-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500"/> Estimated Duration (mins)
              </label>
              <input
                type="number"
                min={15}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition duration-300"
              />
            </div>
          </>
        ) : (
          /* --- ROUTINE-SPECIFIC FIELDS --- */
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500"/> Recurrence Days <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 justify-between">
                {days.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-w-[50px] ${
                      daysOfWeek.includes(d.id)
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500"/> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500"/> Duration (mins)
              </label>
              <input
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition duration-300"
              />
            </div>
          </>
        )}
      </div>

      {/* --- Action Buttons --- */}
      <div className="mt-8 flex items-center gap-4 border-t pt-6 border-gray-100 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-500/30 transition duration-300"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mode === "task" ? (
            <>
              <ClipboardCheck className="h-5 w-5" />
              {initialData ? "Update Task" : "Create Task"}
            </>
          ) : (
            <>
              <Repeat2 className="h-5 w-5" />
              {initialData ? "Update Routine" : "Create Routine"}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition duration-300"
        >
          Reset Form
        </button>
      </div>
    </form>
  );
}