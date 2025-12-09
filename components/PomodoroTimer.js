"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;
const CYCLE_BEFORE_LONG_BREAK = 4;

export default function PomodoroTimer({ taskId }) {
  const [mode, setMode] = useState("focus");        // focus | short | long
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const unsyncedFocusRef = useRef(0);

  const beepRef = useRef(null);

  const format = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const syncTime = useCallback(
    async (seconds) => {
      if (!taskId || seconds <= 0) return;

      try {
        setIsSyncing(true);
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: taskId,
            actualDurationDelta: seconds / 60,
          }),
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [taskId]
  );

  const flush = useCallback(async () => {
    const pending = unsyncedFocusRef.current;
    if (pending > 0) {
      unsyncedFocusRef.current = 0;
      await syncTime(pending);
    }
  }, [syncTime]);

  const getSessionDuration = (mode) => {
    if (mode === "focus") return FOCUS_SECONDS;
    if (mode === "long") return LONG_BREAK_SECONDS;
    return SHORT_BREAK_SECONDS;
  };

  const switchMode = useCallback(() => {
    if (mode === "focus") {
      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);

      if (nextCount % CYCLE_BEFORE_LONG_BREAK === 0) {
        setMode("long");
        return LONG_BREAK_SECONDS;
      }

      setMode("short");
      return SHORT_BREAK_SECONDS;
    }

    setMode("focus");
    return FOCUS_SECONDS;
  }, [mode, sessionCount]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (mode === "focus") {
            const leftover = unsyncedFocusRef.current + (prev > 0 ? 1 : 0);
            unsyncedFocusRef.current = 0;
            if (leftover > 0) syncTime(leftover);
          }

          try {
            beepRef.current?.play();
          } catch {}

          return switchMode();
        }

        if (mode === "focus") {
          unsyncedFocusRef.current += 1;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, syncTime, switchMode]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRunning) {
        setIsRunning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isRunning]);

  const toggle = async () => {
    if (isRunning) {
      await flush();
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const reset = async () => {
    await flush();
    setIsRunning(false);
    setMode("focus");
    setRemaining(FOCUS_SECONDS);
    setSessionCount(0);
  };

  if (!taskId) return null;

  const total = getSessionDuration(mode);
  const progress = 1 - remaining / total;
  const isFocus = mode === "focus";

  return (
    <div className="flex items-center gap-4 text-xs sm:text-sm">

      <div className="relative">
        <svg width="48" height="48">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-300 dark:text-gray-700"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={(1 - progress) * 2 * Math.PI * 20}
            className={
              isFocus
                ? "text-emerald-500 transition-all duration-500"
                : mode === "long"
                ? "text-purple-500 transition-all duration-500"
                : "text-blue-500 transition-all duration-500"
            }
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px]">
          {format(remaining)}
        </div>
      </div>

      <div
        className={`px-2 py-1 rounded-md border font-mono ${
          isFocus
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-200"
            : mode === "long"
            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-400 text-purple-700 dark:text-purple-200"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-700 dark:text-blue-200"
        }`}
      >
        {isFocus ? "Focus" : mode === "long" ? "Long Break" : "Break"}
      </div>

      <button
        onClick={toggle}
        className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {isRunning ? "Pause" : "Start"}
      </button>

      <button
        onClick={reset}
        className="px-2 py-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Reset
      </button>

      {isSyncing && (
        <span className="text-[10px] text-gray-400">Updating…</span>
      )}

      <audio
        ref={beepRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA="
      />
    </div>
  );
}
