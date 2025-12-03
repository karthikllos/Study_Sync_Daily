import AcademicTask from "../models/AcademicTask";
import Routine from "../models/Routine";
import Reflection from "../models/Reflection";
import User from "../models/user";

/**
 * Parse "HH:MM" into a Date on the provided reference date.
 */
function parseTimeToDate(refDate, hhmm) {
  const [hh, mm] = (hhmm || "00:00").split(":").map((s) => parseInt(s, 10));
  const d = new Date(refDate);
  d.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0);
  return d;
}

/**
 * Merge and normalize intervals, returns sorted non-overlapping intervals
 * each item: { start: Date, end: Date, source: 'routine'|... , meta }
 */
function normalizeIntervals(intervals = []) {
  if (!intervals.length) return [];
  const sorted = intervals
    .map((i) => ({ start: new Date(i.start), end: new Date(i.end), meta: i.meta }))
    .sort((a, b) => a.start - b.start);

  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const top = merged[merged.length - 1];
    if (sorted[i].start <= top.end) {
      // overlap -> extend end
      top.end = new Date(Math.max(top.end.getTime(), sorted[i].end.getTime()));
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

/**
 * Generate free slots between occupied intervals within a day window.
 * dayWindow: { start: Date, end: Date }
 */
function computeFreeSlots(occupied, dayWindow) {
  const free = [];
  let cursor = new Date(dayWindow.start);

  for (const interval of occupied) {
    if (interval.start > cursor) {
      free.push({ start: new Date(cursor), end: new Date(interval.start) });
    }
    cursor = new Date(Math.max(cursor.getTime(), interval.end.getTime()));
  }

  if (cursor < dayWindow.end) {
    free.push({ start: new Date(cursor), end: new Date(dayWindow.end) });
  }

  return free;
}

/**
 * Core daily blueprint generator.
 * - Places tasks into free slots (simple greedy algorithm).
 * - Persists scheduledTime for tasks that get a placement (first session start).
 */
export async function generateDailyBlueprint(userId, date = new Date()) {
  try {
    // normalize date to local midnight
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);

    // define planner active window for the day (06:00 - 23:00 by default)
    const dayWindowStart = new Date(day);
    dayWindowStart.setHours(6, 0, 0, 0);
    const dayWindowEnd = new Date(day);
    dayWindowEnd.setHours(23, 0, 0, 0);

    // 1) Fetch fixed routines for the day
    const routinesRaw = await Routine.find({ user: userId, daysOfWeek: day.getDay() }).lean();
    const occupiedIntervals = (routinesRaw || []).map((r) => {
      const start = parseTimeToDate(day, r.startTime);
      const end = new Date(start.getTime() + (r.duration || 60) * 60000);
      return { start, end, meta: { routineId: r._id, name: r.name, type: r.type } };
    });

    const occupied = normalizeIntervals(occupiedIntervals);

    // 2) Fetch all incomplete tasks for the user
    const tasksRaw = await AcademicTask.find({ user: userId, isCompleted: false }).lean();

    // 3) Compute free slots between routines within the planner window
    // Ensure we consider the day window bounds
    const boundedOccupied = occupied.slice();
    // Add sentinel intervals at day boundaries to make compute simpler
    const sentinelStart = { start: dayWindowStart, end: dayWindowStart };
    const sentinelEnd = { start: dayWindowEnd, end: dayWindowEnd };
    const allOccupied = normalizeIntervals([sentinelStart, ...boundedOccupied, sentinelEnd]);

    const freeSlots = computeFreeSlots(allOccupied, { start: dayWindowStart, end: dayWindowEnd });

    // 4) Smart prioritization
    // Tasks with scheduledTime in the past should be prioritized first
    const now = new Date();
    const tasks = (tasksRaw || []).map((t) => ({
      ...t,
      estimatedDuration: t.estimatedDuration || 60, // minutes
      scheduledTimeObj: t.scheduledTime ? new Date(t.scheduledTime) : null,
    }));

    tasks.sort((a, b) => {
      // priority field descending (higher number => higher priority)
      const prioA = a.priority ?? 3;
      const prioB = b.priority ?? 3;
      if (prioB !== prioA) return prioB - prioA;

      const aLate = a.scheduledTimeObj && a.scheduledTimeObj < now ? 1 : 0;
      const bLate = b.scheduledTimeObj && b.scheduledTimeObj < now ? 1 : 0;
      if (aLate !== bLate) return bLate - aLate;

      // fallback by dueDate ascending
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });

    // 5) Place tasks into free slots (greedy)
    const scheduledTasks = [];
    const unscheduledTasks = [];
    // We'll mutate freeSlots as we place blocks
    const slots = freeSlots.map((s) => ({ start: new Date(s.start), end: new Date(s.end) }));

    const MIN_SESSION_MINUTES = 30;
    const MAX_SESSION_MINUTES = 90;

    for (const task of tasks) {
      let remaining = Math.max(30, Math.round(task.estimatedDuration)); // minutes, ensure minimum
      let placed = false;
      // iterate over slots to find a chunk >= MIN_SESSION_MINUTES
      for (let i = 0; i < slots.length && remaining > 0; i++) {
        const slot = slots[i];
        const slotMinutes = Math.floor((slot.end - slot.start) / 60000);
        if (slotMinutes < MIN_SESSION_MINUTES) continue;

        // allocate a session length
        const allocate = Math.min(MAX_SESSION_MINUTES, slotMinutes, remaining);
        const sessionStart = new Date(slot.start);
        const sessionEnd = new Date(sessionStart.getTime() + allocate * 60000);

        // persist first assigned session as scheduledTime on the task
        if (!placed) {
          await AcademicTask.updateOne({ _id: task._id }, { $set: { scheduledTime: sessionStart } });
        }

        scheduledTasks.push({
          taskId: task._id,
          title: task.title,
          scheduledStart: sessionStart.toISOString(),
          scheduledEnd: sessionEnd.toISOString(),
          allocatedMinutes: allocate,
        });

        // shrink slot start forward
        slot.start = new Date(sessionEnd);
        remaining -= allocate;
        placed = true;

        // if the slot is nearly empty, remove it
        if ((slot.end - slot.start) / 60000 < MIN_SESSION_MINUTES) {
          slots.splice(i, 1);
          i--; // adjust index
        }
      }

      if (!placed) {
        unscheduledTasks.push({
          taskId: task._id,
          title: task.title,
          estimatedMinutes: task.estimatedDuration,
        });
      }
    }

    // 6) Return blueprint (routines + scheduled tasks + unscheduled tasks)
    const routinesOut = (routinesRaw || []).map((r) => {
      const start = parseTimeToDate(day, r.startTime);
      const end = new Date(start.getTime() + (r.duration || 60) * 60000);
      return {
        id: r._id,
        name: r.name,
        type: r.type,
        start: start.toISOString(),
        end: end.toISOString(),
      };
    });

    return {
      date: day.toISOString(),
      routines: routinesOut,
      scheduledTasks,
      unscheduledTasks,
      freeSlots: freeSlots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
    };
  } catch (err) {
    console.error("generateDailyBlueprint error:", err);
    return {
      date: new Date().toISOString(),
      routines: [],
      scheduledTasks: [],
      unscheduledTasks: [],
      error: err.message,
    };
  }
}

/**
 * Reschedule slipped/uncompleted tasks referenced by a reflection document.
 * reflectionId: id of a Reflection-like doc that contains uncompletedTasks: [taskId,...]
 *
 * Behavior:
 * - Set priority=5 and scheduledTime=null for each uncompleted task so next run will prioritize them.
 */
export async function rescheduleSlippedTasks(reflectionId) {
  try {
    const reflection = await Reflection.findById(reflectionId).lean();
    if (!reflection || !Array.isArray(reflection.uncompletedTasks)) {
      throw new Error("Reflection not found or missing uncompletedTasks");
    }

    const taskIds = reflection.uncompletedTasks.filter(Boolean);
    if (!taskIds.length) return { updated: 0 };

    // Update tasks: set priority to 5 and clear scheduledTime so generator will re-place them
    const res = await AcademicTask.updateMany(
      { _id: { $in: taskIds } },
      { $set: { priority: 5 }, $unset: { scheduledTime: "" } }
    );

    return { updated: res.modifiedCount || res.nModified || 0 };
  } catch (err) {
    console.error("rescheduleSlippedTasks error:", err);
    return { error: err.message };
  }
}

/**
 * Predict a 24-hour focus score curve (0-100) for the user based on recent reflections
 * and their AI profile (optimalStudyHour).
 *
 * Heuristic:
 *  - Baseline = weighted average of focusRating/energyRating from last 7 reflections.
 *  - Hours near optimalStudyHour are boosted, late-night hours are penalized.
 */
export async function predictFocusScore(userId, reflectionHistory) {
  try {
    const now = new Date();

    // 1) Load recent reflections if not provided (last 7 entries within ~30 days)
    let reflections = Array.isArray(reflectionHistory) ? reflectionHistory : [];
    if (!reflections.length) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      reflections = await Reflection.find({
        user: userId,
        date: { $gte: thirtyDaysAgo },
      })
        .sort({ date: -1 })
        .limit(7)
        .lean();
    }

    if (!reflections.length) {
      // If we have no history, return a flat neutral curve (60/100)
      const neutral = 60;
      const hours = [];
      for (let i = 0; i < 24; i += 1) {
        const t = new Date(now.getTime() + i * 60 * 60 * 1000);
        hours.push({
          timestamp: t.toISOString(),
          hourOfDay: t.getHours(),
          score: neutral,
        });
      }
      return { baseline: neutral, hours };
    }

    // 2) Compute baseline from reflections
    let weightedSum = 0;
    let totalWeight = 0;
    reflections.forEach((r, idx) => {
      // Newer reflections get slightly higher weight
      const recencyWeight = 1 + (reflections.length - idx - 1) * 0.2;
      const focus = Number(r.focusRating || 0);
      const energy = Number(r.energyRating || 0);
      const tasksCompleted = Number(r.tasksCompletedCount || 0);
      const hoursPlanned = Number(r.totalHoursPlanned || 0);
      const hoursSpent = Number(r.totalHoursSpent || 0);

      const baseRating = ((focus * 0.6 + energy * 0.4) / 5) * 100; // 0-100

      // Reward good execution: spending close to planned hours and completing tasks
      let executionBoost = 0;
      if (hoursPlanned > 0 && hoursSpent > 0) {
        const ratio = Math.min(hoursSpent / hoursPlanned, 1.5); // cap
        executionBoost += (ratio - 1) * 10; // +/-10 range approx
      }
      executionBoost += Math.min(tasksCompleted * 1.0, 10); // up to +10

      const dayScore = Math.max(0, Math.min(100, baseRating + executionBoost));
      const weight = recencyWeight;

      weightedSum += dayScore * weight;
      totalWeight += weight;
    });

    const baseline = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 60;

    // 3) Load user AI profile (for preferred hour of study)
    const user = await User.findById(userId).lean();
    const optimalHour =
      (user && user.aiProfile && typeof user.aiProfile.optimalStudyHour === "number")
        ? user.aiProfile.optimalStudyHour
        : 14; // default 2 PM

    // 4) Build 24h curve around baseline
    const hours = [];
    for (let i = 0; i < 24; i += 1) {
      const t = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = t.getHours();

      // Distance from optimal hour (wrap around 24h)
      let diff = Math.abs(hour - optimalHour);
      if (diff > 12) diff = 24 - diff;

      // Gaussian-like adjustment: peak at optimalHour, decreasing as we move away
      const peakBoost = 15; // max +/- 15 points
      const hourBoost = Math.round(peakBoost * Math.exp(-(diff * diff) / (2 * 4))); // sigma^2=4

      // Penalize very late night hours (0-5)
      const nightPenalty = hour >= 0 && hour <= 5 ? -10 : 0;

      const score = Math.max(0, Math.min(100, baseline + hourBoost + nightPenalty));

      hours.push({
        timestamp: t.toISOString(),
        hourOfDay: hour,
        score,
      });
    }

    return { baseline, hours };
  } catch (err) {
    console.error("predictFocusScore error:", err);
    return {
      baseline: 60,
      hours: [],
      error: err.message,
    };
  }
}

/**
 * Simple workload dynamic adjuster.
 *
 * currentSchedule: array of sessions, each with at least { taskId, allocatedMinutes, priority? }.
 * If the total weekly load exceeds ~50 hours, we suggest pushing the lowest-priority
 * short session (<=60 min) by one day.
 */
export async function dynamicAdjuster(userId, currentSchedule = []) {
  try {
    const sessions = Array.isArray(currentSchedule) ? currentSchedule : [];
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + (Number(s.allocatedMinutes || s.minutes || 0)),
      0
    );

    const totalHours = totalMinutes / 60;
    if (totalHours <= 50) {
      return {
        totalHours,
        overloaded: false,
        suggestion: null,
      };
    }

    // Find a candidate session to push: lowest priority & short duration
    let candidate = null;
    sessions.forEach((s) => {
      const duration = Number(s.allocatedMinutes || s.minutes || 0);
      if (!duration || duration > 60) return;

      const prio = s.priority ?? 3;
      if (!candidate) {
        candidate = { ...s, priority: prio, duration };
        return;
      }

      if (prio < candidate.priority || (prio === candidate.priority && duration < candidate.duration)) {
        candidate = { ...s, priority: prio, duration };
      }
    });

    if (!candidate) {
      return {
        totalHours,
        overloaded: true,
        suggestion: null,
      };
    }

    // We only *suggest* the move here; callers can choose to apply the change.
    return {
      totalHours,
      overloaded: true,
      suggestion: {
        action: "defer_task_by_one_day",
        taskId: candidate.taskId || candidate.id,
        allocatedMinutes: candidate.duration,
        reason: "Weekly workload exceeds 50 hours; consider moving this low-priority block to tomorrow.",
      },
    };
  } catch (err) {
    console.error("dynamicAdjuster error:", err);
    return {
      totalHours: null,
      overloaded: false,
      suggestion: null,
      error: err.message,
    };
  }
}
