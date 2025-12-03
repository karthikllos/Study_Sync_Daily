/**
 * Thin wrapper around AI/LLM calls used by StudySync.
 *
 * NOTE: This is intentionally implementation-agnostic. You can back it with
 * any provider (OpenAI, Gemini, etc.) by configuring environment variables
 * and wiring the fetch() calls below.
 */

/**
 * Generate quiz questions from a topic + notes.
 *
 * Signature (Phase 3 spec): generateQuiz(topic, notes)
 *
 * Returns: { questions: [...] }
 */
export async function generateQuiz(topic, notes) {
  if (!topic || typeof topic !== "string") {
    throw new Error("topic is required to generate a quiz");
  }

  // Call external AI provider if configured, otherwise fall back to a
  // simple heuristic-based quiz generator so the app keeps working in dev.
  let questions = [];

  const providerUrl = process.env.AI_QUIZ_API_URL;
  const providerKey = process.env.AI_QUIZ_API_KEY;

  if (providerUrl && providerKey) {
    try {
      const res = await fetch(providerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({ topic, notes }),
      });

      if (!res.ok) {
        console.error("AI quiz provider error status:", res.status);
        throw new Error("Quiz generation failed at provider");
      }

      const data = await res.json();
      // Expect data.questions: [{ content, answer, type, options? }, ...]
      if (Array.isArray(data.questions)) {
        questions = data.questions;
      }
    } catch (err) {
      console.error("generateQuiz provider error:", err);
      // Fall back to a simple quiz so we still return something useful.
    }
  }

  if (!questions.length) {
    const basePrompt = (notes && typeof notes === "string" ? notes : "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    questions = [
      {
        content: `Summarize the most important idea about "${topic}" from your notes.`,
        answer: basePrompt[0] || "Key idea from the notes.",
        type: "short_answer",
      },
      {
        content: `What is one concrete example that illustrates "${topic}"?`,
        answer: basePrompt[1] || "A concrete example taken from the notes.",
        type: "short_answer",
      },
      {
        content: `Why is "${topic}" important for your exam or project?`,
        answer: basePrompt[2] || "Because it connects to the core learning goals.",
        type: "short_answer",
      },
    ];
  }

  return { questions };
}

/**
 * Generate a friendly AI summary for a Reflection.aiSummary field.
 *
 * This call is free (does not consume credits).
 *
 * reflectionData: plain object with fields from the Reflection model.
 * Returns: { summary: string }
 */
export async function generateSummary(reflectionData) {
  const fallbackSummary = buildFallbackSummary(reflectionData);

  const providerUrl = process.env.AI_SUMMARY_API_URL;
  const providerKey = process.env.AI_SUMMARY_API_KEY;

  if (!providerUrl || !providerKey) {
    return { summary: fallbackSummary };
  }

  try {
    const res = await fetch(providerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerKey}`,
      },
      body: JSON.stringify({ reflection: reflectionData }),
    });

    if (!res.ok) {
      console.error("AI summary provider error status:", res.status);
      return { summary: fallbackSummary };
    }

    const data = await res.json();
    if (typeof data.summary === "string" && data.summary.trim().length > 0) {
      return { summary: data.summary.trim() };
    }

    return { summary: fallbackSummary };
  } catch (err) {
    console.error("generateSummary provider error:", err);
    return { summary: fallbackSummary };
  }
}

function buildFallbackSummary(reflection) {
  if (!reflection) {
    return "Today you checked in with your study routine. Keep logging reflections to unlock smarter insights.";
  }

  const energy = Number(reflection.energyRating || 0);
  const focus = Number(reflection.focusRating || 0);
  const tasksCompleted = Number(reflection.tasksCompletedCount || 0);
  const hoursSpent = Number(reflection.totalHoursSpent || 0);

  const parts = [];

  if (energy || focus) {
    parts.push(
      `You reported energy ${energy || "-"}/5 and focus ${focus || "-"}/5 today.`,
    );
  }

  if (tasksCompleted) {
    parts.push(`You completed ${tasksCompleted} task${tasksCompleted === 1 ? "" : "s"}.`);
  }

  if (hoursSpent) {
    parts.push(`You logged about ${hoursSpent.toFixed(1)} hour${hoursSpent === 1 ? "" : "s"} of focused work.`);
  }

  if (!parts.length) {
    parts.push("You checked in without adding specific numbers today.");
  }

  parts.push(
    "Try to plan tomorrow around your highest-energy hours and keep your streak going.",
  );

  return parts.join(" ");
}
