"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const FOCUS_SECONDS = 25 * 60; // 25 minutes
const BREAK_SECONDS = 5 * 60; // 5 minutes

/**
 * PomodoroTimer
 *
 * Props:
 *  - taskId (string, required): AcademicTask _id to credit time against.
 */
export default function PomodoroTimer({ taskId }) {
  const [mode, setMode] = useState("focus"); // "focus" | "break"
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track how many focus seconds in the current block have not yet been synced.
  const unsyncedFocusSecondsRef = useRef(0);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const syncTimeToServer = useCallback(
    async (seconds) => {
      if (!taskId || !seconds || seconds <= 0) return;

      const minutesDelta = seconds / 60;
      try {
        setIsSyncing(true);
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId, actualDurationDelta: minutesDelta }),
        });
      } catch (err) {
        console.error("Failed to sync Pomodoro time:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [taskId],
  );

  const flushUnsyncedFocus = useCallback(async () => {
    const seconds = unsyncedFocusSecondsRef.current;
    if (!seconds) return;
    unsyncedFocusSecondsRef.current = 0;
    await syncTimeToServer(seconds);
  }, [syncTimeToServer]);

  // Core ticking effect
  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // Session finished
          if (mode === "focus") {
            // Flush any remaining unsynced focus seconds
            const leftover = unsyncedFocusSecondsRef.current + (prev > 0 ? 1 : 0);
            unsyncedFocusSecondsRef.current = 0;
            if (leftover > 0) {
              // Fire and forget; no need to await inside setState
              syncTimeToServer(leftover);
            }
          }

          // Auto-switch between focus and break
          if (mode === "focus") {
            setMode("break");
            return BREAK_SECONDS;
          }
          setMode("focus");
          return FOCUS_SECONDS;
        }

        const next = prev - 1;
        if (mode === "focus") {
          unsyncedFocusSecondsRef.current += 1;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, syncTimeToServer]);

  const handleStartPause = async () => {
    if (isRunning) {
      // Pausing: flush any accumulated focus time
      await flushUnsyncedFocus();
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const handleReset = async () => {
    // Reset timer and flush partial focus time if any
    await flushUnsyncedFocus();
    setIsRunning(false);
    setMode("focus");
    setRemaining(FOCUS_SECONDS);
  };

  if (!taskId) return null;

  return (
    <div className="flex items-center gap-3 text-xs sm:text-sm">
      <div
        className={`px-2 py-1 rounded-md font-mono border ${
          mode === "focus"
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-200"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-700 dark:text-blue-200"
        }`}
      >
        <span className="mr-1 uppercase tracking-wide">
          {mode === "focus" ? "Focus" : "Break"}
        </span>
        <span>{formatTime(remaining)}</span>
      </div>
      <button
        type="button"
        onClick={handleStartPause}
        className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {isRunning ? "Pause" : "Start"}
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="px-2 py-1 rounded-md border border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Reset
      </button>
      {isSyncing && (
        <span className="text-[10px] text-gray-400">Updating time…</span>
      )}
    </div>
  );
}
