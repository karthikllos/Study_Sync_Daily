import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ Initialize Gemini client ONLY if API key exists
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Generate quiz questions from a topic
 */
export async function generateQuiz(topic, difficulty = "medium", questionCount = 5) {
  if (!topic || typeof topic !== "string") {
    throw new Error("topic is required to generate a quiz");
  }

  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not set, using fallback quiz");
    return { questions: generateFallbackQuiz(topic, difficulty, questionCount) };
  }

  try {
    // ✅ CORRECT MODEL NAME: gemini-1.5-flash (not gemini-1.5-flash-latest)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });

    const prompt = `Generate ${questionCount} ${difficulty} multiple-choice quiz questions about: "${topic}"

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO backticks, NO code blocks.

Format (plain JSON only):
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
}

Requirements:
- Create clear, specific questions
- Provide exactly 4 options (a, b, c, d)
- Indicate the correct answer
- Make questions progressively more challenging
- Return ONLY the JSON object, nothing else`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("📝 Gemini Response (first 200 chars):", text.substring(0, 200));

    // ✅ ROBUST JSON EXTRACTION
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object boundaries
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.warn("⚠️ No JSON found in response, using fallback");
      return { questions: generateFallbackQuiz(topic, difficulty, questionCount) };
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);

    const parsedData = JSON.parse(jsonText);

    // ✅ VALIDATE RESPONSE STRUCTURE
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("Invalid response structure: missing questions array");
    }

    if (parsedData.questions.length === 0) {
      throw new Error("Empty questions array received");
    }

    // ✅ VALIDATE EACH QUESTION
    const validQuestions = parsedData.questions.filter(q => {
      return q.question && 
             Array.isArray(q.options) && 
             q.options.length === 4 && 
             q.correctAnswer;
    });

    if (validQuestions.length === 0) {
      throw new Error("No valid questions in response");
    }

    console.log(`✅ Generated ${validQuestions.length} valid quiz questions`);
    return { questions: validQuestions };

  } catch (error) {
    console.error("❌ Gemini Quiz Error:", error.message);
    console.error("Full error:", error);
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

  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not set, using fallback notes");
    return { notes: generateFallbackNotes(content) };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.5,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });

    const prompt = `You are an expert study notes generator. Convert the following content into concise, well-organized study notes.

Format the notes with:
- 📌 Key Concepts (bullet points)
- 📚 Summary (2-3 sentences)
- 💡 Important Definitions (if any)
- ⭐ Key Points to Remember

Content to summarize:
${content.substring(0, 3000)}

Generate clear, structured, and easy-to-review notes in plain text format.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const notes = response.text();

    if (!notes || notes.trim().length === 0) {
      throw new Error("Empty response from Gemini");
    }

    console.log("✅ Generated notes successfully");
    return { notes: notes.trim() };

  } catch (error) {
    console.error("❌ Gemini Notes Error:", error.message);
    return { notes: generateFallbackNotes(content) };
  }
}

/**
 * Generate AI summary
 */
export async function generateSummary(reflectionData) {
  const fallbackSummary = buildFallbackSummary(reflectionData);

  if (!genAI || !process.env.GEMINI_API_KEY) {
    return { summary: fallbackSummary };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    });

    const prompt = `Generate a brief, encouraging summary of this study reflection in 2-3 sentences:

Energy Level: ${reflectionData.energyRating || "N/A"}/5
Focus Level: ${reflectionData.focusRating || "N/A"}/5
Tasks Completed: ${reflectionData.tasksCompletedCount || 0}
Hours Spent: ${reflectionData.totalHoursSpent || 0}
Notes: ${reflectionData.notes || "No notes"}

Be encouraging and actionable. Suggest improvements if needed.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (summary && summary.trim().length > 0) {
      return { summary: summary.trim() };
    }

    return { summary: fallbackSummary };

  } catch (error) {
    console.error("❌ Gemini Summary Error:", error.message);
    return { summary: fallbackSummary };
  }
}

/**
 * Fallback quiz generator
 */
function generateFallbackQuiz(topic, difficulty = "medium", questionCount = 5) {
  const questions = [];
  const count = Math.min(questionCount, 5);

  for (let i = 1; i <= count; i++) {
    questions.push({
      id: i,
      question: `What is an important concept about ${topic}? (Question ${i})`,
      options: [
        { id: "a", text: `First key concept related to ${topic}` },
        { id: "b", text: `Second important aspect of ${topic}` },
        { id: "c", text: `Third consideration about ${topic}` },
        { id: "d", text: `Fourth element of ${topic}` },
      ],
      correctAnswer: ["a", "b", "c", "d"][Math.floor(Math.random() * 4)],
    });
  }

  return questions;
}

/**
 * Fallback notes generator
 */
function generateFallbackNotes(content) {
  const lines = content.split("\n").filter((line) => line.trim());
  const maxLines = Math.min(5, lines.length);
  const summary = lines
    .slice(0, maxLines)
    .map((line) => `• ${line.trim().substring(0, 100)}`)
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
 * Fallback summary builder
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