import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate quiz questions from a topic
 */
export async function generateQuiz(topic, difficulty = "medium", questionCount = 5) {
  if (!topic || typeof topic !== "string") {
    throw new Error("topic is required to generate a quiz");
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set, using fallback quiz");
    return { questions: generateFallbackQuiz(topic, difficulty, questionCount) };
  }

  try {
    // ✅ FIXED MODEL NAME
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate ${questionCount} ${difficulty} multiple-choice quiz questions about: "${topic}"

For each question:
- Create a clear, specific question
- Provide exactly 4 options (a, b, c, d)
- Indicate the correct answer
- Make questions progressively more challenging

Return ONLY valid JSON in this exact format, no markdown or extra text:
{
  "questions": [
    {
      "id": 1,
      "question": "What is...",
      "options": [
        {"id": "a", "text": "Option A"},
        {"id": "b", "text": "Option B"},
        {"id": "c", "text": "Option C"},
        {"id": "d", "text": "Option D"}
      ],
      "correctAnswer": "a"
    }
  ]
}`;

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Could not parse Gemini response, using fallback");
      return { questions: generateFallbackQuiz(topic, difficulty, questionCount) };
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
      return { questions: parsedData.questions };
    }

    throw new Error("Invalid response structure from Gemini");
  } catch (error) {
    console.error("Gemini Quiz Generation Error:", error.message);
    return { questions: generateFallbackQuiz(topic, difficulty, questionCount) };
  }
}

/**
 * Generate AI notes/summary
 */
export async function generateNotes(content) {
  if (!content || typeof content !== "string") {
    throw new Error("content is required to generate notes");
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set, using fallback notes");
    return { notes: generateFallbackNotes(content) };
  }

  try {
    // ✅ FIXED MODEL NAME
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert study notes generator. Convert the following content into concise, well-organized study notes.

Format the notes with:
- 📌 Key Concepts (bullet points)
- 📚 Summary (2-3 sentences)
- 💡 Important Definitions (if any)
- ⭐ Key Points to Remember

Content to summarize:
${content}

Generate clear, structured, and easy-to-review notes.`;

    const result = await model.generateContent(prompt);

    const notes = result.response.text();

    if (notes && notes.trim().length > 0) {
      return { notes: notes.trim() };
    }

    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini Notes Generation Error:", error.message);
    return { notes: generateFallbackNotes(content) };
  }
}

/**
 * Generate AI summary
 */
export async function generateSummary(reflectionData) {
  const fallbackSummary = buildFallbackSummary(reflectionData);

  if (!process.env.GEMINI_API_KEY) {
    return { summary: fallbackSummary };
  }

  try {
    // ✅ FIXED MODEL NAME
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a brief, encouraging summary of this study reflection in 2-3 sentences:

Energy Level: ${reflectionData.energyRating || "N/A"}/5
Focus Level: ${reflectionData.focusRating || "N/A"}/5
Tasks Completed: ${reflectionData.tasksCompletedCount || 0}
Hours Spent: ${reflectionData.totalHoursSpent || 0}
Notes: ${reflectionData.notes || "No notes"}

Be encouraging and actionable.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    if (summary && summary.trim().length > 0) {
      return { summary: summary.trim() };
    }

    return { summary: fallbackSummary };
  } catch (error) {
    console.error("Gemini Summary Generation Error:", error.message);
    return { summary: fallbackSummary };
  }
}

/**
 * Fallback quiz
 */
function generateFallbackQuiz(topic, difficulty = "medium", questionCount = 5) {
  const questions = [];

  for (let i = 1; i <= Math.min(questionCount, 5); i++) {
    questions.push({
      id: i,
      question: `What is a key concept about ${topic}? (Question ${i})`,
      options: [
        { id: "a", text: `First concept about ${topic}` },
        { id: "b", text: `Second concept about ${topic}` },
        { id: "c", text: `Third concept about ${topic}` },
        { id: "d", text: `Fourth concept about ${topic}` },
      ],
      correctAnswer: ["a", "b", "c", "d"][Math.floor(Math.random() * 4)],
    });
  }

  return questions;
}

/**
 * Fallback notes
 */
function generateFallbackNotes(content) {
  const lines = content.split("\n").filter((line) => line.trim());
  const summary = lines
    .slice(0, Math.min(5, lines.length))
    .map((line) => `• ${line.trim()}`)
    .join("\n");

  return `📚 Study Notes
${new Date().toLocaleDateString()}

📌 Key Concepts:
${summary || "• Review the source material for key points"}

📚 Summary:
This content covers important concepts worth reviewing and integrating into your study plan.

💡 Important Points:
• Focus on understanding these concepts deeply
• Create flashcards for quick review
• Practice applying these ideas in different contexts

⭐ Key Points to Remember:
• Consistent review improves retention
• Active recall strengthens memory
• Teaching others helps consolidate learning`;
}

/**
 * Fallback summary
 */
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
      `You reported energy ${energy || "-"}/5 and focus ${focus || "-"}/5 today.`
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
    "Try to plan tomorrow around your highest-energy hours and keep your streak going."
  );

  return parts.join(" ");
}
