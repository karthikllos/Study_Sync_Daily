"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskForm({ initialData = null, onSuccess = () => {} }) {
  const router = useRouter();

  // mode: "task" | "routine"
  const [mode, setMode] = useState(initialData?.daysOfWeek ? "routine" : "task");

  // Common
  const [title, setTitle] = useState(initialData?.title || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [type, setType] = useState(initialData?.type || "assignment");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "task") {
        // minimal validation
        if (!title.trim() || !dueDate) {
          alert("Please provide a title and due date for the task.");
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create task");
        onSuccess(data);
        // optional: refresh or route
        router.refresh();
        alert("Task created");
      } else {
        // routine
        if (!title.trim() || daysOfWeek.length === 0) {
          alert("Please provide a name and select at least one day for the routine.");
          setLoading(false);
          return;
        }

        const payload = {
          name: title.trim(),
          type,
          daysOfWeek: daysOfWeek.sort((a, b) => a - b),
          startTime,
          duration: Number(duration) || 60,
          isFixed: true,
        };

        const res = await fetch("/api/routines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create routine");
        onSuccess(data);
        router.refresh();
        alert("Routine created");
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
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
    <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setMode("task")}
          className={`px-4 py-2 rounded-lg font-medium ${
            mode === "task" ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          Task
        </button>
        <button
          type="button"
          onClick={() => setMode("routine")}
          className={`px-4 py-2 rounded-lg font-medium ${
            mode === "routine" ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          Routine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
            placeholder="e.g., Read Chapter 5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
            placeholder="e.g., Biology"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="reading">Reading</option>
            <option value="micro_goal">Micro Goal</option>
            <option value="lecture_prep">Lecture Prep</option>
          </select>
        </div>

        {mode === "task" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estimated duration (mins)</label>
              <input
                type="number"
                min={15}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      daysOfWeek.includes(d.id)
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (mins)</label>
              <input
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : mode === "task" ? "Create Task" : "Create Routine"}
        </button>

        <button
          type="button"
          onClick={() => {
            // reset
            setTitle("");
            setSubject("");
            setType("assignment");
            setDueDate("");
            setEstimatedDuration(60);
            setDaysOfWeek([]);
            setStartTime("08:00");
            setDuration(60);
          }}
          className="px-4 py-3 rounded-lg border"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
