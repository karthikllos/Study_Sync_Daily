"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Brain, Zap, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { dispatchCreditUpdate } from '../../../components/CreditBadge';

// The CSS variables for this design must be added to your global CSS (e.g., globals.css)
// See the separate CSS section below.

export default function AIQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [error, setError] = useState("");
  const [isInsufficientCredits, setIsInsufficientCredits] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      // router.push("/auth");
      // Simulate authenticated for demo purposes if not running in Next.js environment
      setLoading(false);
    } else if (status === "authenticated") {
      setLoading(false);
    }
    // Simulate initial credit load for the demo
    setCreditsRemaining(50);
  }, [status, router]);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setGenerating(true);
    setError("");
    setIsInsufficientCredits(false);
    setQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, questionCount: 5 }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setIsInsufficientCredits(true);
          setError(data.error || "Insufficient credits.");
        } else {
          setError(data.error || "Failed to generate quiz");
        }
        return;
      }

      if (data.success && data.quiz && Array.isArray(data.quiz.questions)) {
        setQuestions(data.quiz.questions);
        setCreditsUsed(data.credits?.used ?? 2);
        setCreditsRemaining(data.credits?.remaining ?? creditsRemaining);
        dispatchCreditUpdate();
      } else {
        setError("Invalid response from server");
        console.error("Quiz response:", data);
      }
    } catch (err) {
      setError("Error generating quiz: " + err.message);
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedOption) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: selectedOption,
    });
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <span className="text-xl font-medium text-foreground">
            Initializing AI brain...
          </span>
        </div>
      </div>
    );
  }

  const score = showResults ? calculateScore() : null;
  const isAllAnswered = Object.keys(selectedAnswers).length === questions.length;
  const scorePercentage = score ? Math.round((score.correct / score.total) * 100) : 0;
  
  const getScoreMessage = (percentage) => {
    if (percentage === 100) return "🚀 Perfect Score! Unstoppable!";
    if (percentage >= 80) return "🧠 Excellent work! Deep understanding.";
    if (percentage >= 50) return "👍 Good effort! Keep practicing.";
    return "💡 Needs review. Let's learn from the mistakes!";
  };


  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Brain className="h-10 w-10 text-accent glow-text" />
            <h1 className="text-5xl font-extrabold tracking-tight gradient-text">
              AI Quiz Generator
            </h1>
          </div>
          <p className="text-text-secondary text-lg">
            Instantly create custom quizzes on any topic (Cost: 2 credits)
          </p>
        </div>

        {/* --- */}

        {/* Credits Status Bar */}
        <div className="mb-8 p-4 bg-card-bg rounded-xl shadow-lg border border-border-color">
            <div className="flex justify-between items-center">
                <p className="text-text-secondary">
                    Your Credits:
                </p>
                <p className="text-3xl font-bold text-accent">
                    {creditsRemaining}
                </p>
                <button
                    onClick={() => router.push("/pricing")}
                    className="flex items-center gap-1 text-sm font-medium text-text-tertiary hover:text-accent transition duration-300"
                >
                    Top Up
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
        
        {/* --- */}

        {/* Error Message */}
        {error && (
          <div
            className={`mb-6 p-5 rounded-xl border-2 transition-all duration-500 ${
              isInsufficientCredits
                ? "bg-yellow-900/40 border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                : "bg-red-900/40 border-red-500/50 shadow-lg shadow-red-500/10"
            }`}
          >
            <p className={`${isInsufficientCredits ? "text-yellow-400" : "text-red-400"} font-semibold`}>
              {error}
            </p>

            {/* Insufficient Credits CTA */}
            {isInsufficientCredits && (
              <button
                onClick={() => router.push("/pricing")}
                className="mt-4 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition duration-300 flex items-center gap-2 shadow-md hover:shadow-xl"
              >
                <Zap className="h-4 w-4" />
                Upgrade Plan / Get Credits
              </button>
            )}
          </div>
        )}

        {/* --- */}

        {/* Input Section */}
        {questions.length === 0 && (
          <div className="p-8 bg-card-bg rounded-2xl shadow-2xl border border-border-color transition-all duration-500">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Define Your Quiz
            </h2>
            
            <label className="block text-sm font-medium mb-2 text-text-secondary">
                Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Computing, Stoichiometry, React Hooks"
              className="w-full px-5 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition duration-300"
            />

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-text-secondary">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-input-bg border border-input-border text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition duration-300 appearance-none cursor-pointer"
              >
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Application)</option>
                <option value="hard">Hard (Advanced Concepts)</option>
              </select>
            </div>

            <button
              onClick={generateQuiz}
              disabled={generating || !topic.trim() || creditsRemaining < 2}
              className="mt-8 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.01] transition duration-300 ease-in-out"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Forging Questions...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Generate 5-Question Quiz (2 credits)
                </>
              )}
            </button>
          </div>
        )}

        {/* --- */}

        {/* Quiz Display Section */}
        {questions.length > 0 && (
          <div className="space-y-8">
            {/* Quiz Header */}
            <div className="p-6 bg-card-bg rounded-2xl shadow-xl border border-border-color border-l-4 border-accent transition-all duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-1 text-foreground">
                    Quiz: {topic}
                  </h2>
                  <p className="text-text-secondary">
                    Difficulty: <span className="capitalize font-semibold text-accent">{difficulty}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-tertiary">
                    Cost
                  </p>
                  <p className="text-3xl font-extrabold text-red-400">
                    -2
                  </p>
                </div>
              </div>
            </div>

            {/* Score Display (after submission) */}
            {showResults && score && (
              <div className="p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-green-900/50 to-blue-900/50 border-2 border-green-500/70">
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-3 text-white">
                    {getScoreMessage(scorePercentage)}
                  </h3>
                  <p className="text-6xl font-extrabold mb-3 gradient-score">
                    {score.correct}/{score.total}
                  </p>
                  <p className="text-xl font-medium text-text-secondary">
                    Final Score: <span className="font-bold text-green-400">{scorePercentage}%</span>
                  </p>
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                const isAnswered = selectedAnswers[q.id] !== undefined;

                return (
                  <div
                    key={q.id}
                    className={`p-6 rounded-xl shadow-lg transition-all duration-300 border-l-4 ${
                      showResults
                        ? isCorrect
                          ? "border-green-500 bg-green-900/10"
                          : "border-red-500 bg-red-900/10"
                        : "border-accent/50 bg-card-bg hover:shadow-xl hover:border-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <h3 className="font-bold text-xl flex-1 text-foreground">
                        <span className="text-accent mr-3">
                          Q{idx + 1}:
                        </span>
                        {q.question}
                      </h3>
                      {showResults && (
                        <div className="ml-4 p-2 rounded-full">
                          {isCorrect ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {q.options?.map((opt, optIdx) => {
                        const optionId = String.fromCharCode(97 + optIdx); // a, b, c, d
                        const isSelected = selectedAnswers[q.id] === optionId;
                        const isCorrectAnswer = q.correctAnswer === optionId;
                        
                        let optionClass = "border-border-color bg-input-bg hover:border-accent/70";
                        if (showResults) {
                            if (isCorrectAnswer) {
                                optionClass = "border-green-500 bg-green-900/30 font-bold";
                            } else if (isSelected && !isCorrectAnswer) {
                                optionClass = "border-red-500 bg-red-900/30 font-bold text-red-400";
                            } else {
                                optionClass = "border-border-color/50 bg-input-bg/50 text-text-secondary";
                            }
                        } else if (isSelected) {
                            optionClass = "border-accent bg-accent/20 font-semibold shadow-inner shadow-accent/20";
                        }


                        return (
                          <button
                            key={optIdx}
                            onClick={() =>
                              !showResults && handleAnswerSelect(q.id, optionId)
                            }
                            disabled={showResults}
                            className={`w-full p-4 text-left rounded-lg border-2 transition duration-200 ease-in-out ${optionClass} ${showResults ? 'cursor-default' : 'hover:scale-[1.005]'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold w-6 text-center text-accent/80">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="text-lg">{opt.text || opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {showResults && !isCorrect && isAnswered && (
                      <div className="mt-4 p-4 rounded-xl bg-green-900/40 border border-green-500/50">
                        <p className="text-md text-green-400">
                          <CheckCircle className="inline h-4 w-4 mr-2" /> 
                          The correct answer was:{" "}
                          <span className="font-extrabold">
                            {q.correctAnswer.toUpperCase()}. 
                            {q.options?.find(opt => q.correctAnswer === String.fromCharCode(97 + q.options.indexOf(opt)))?.text}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* --- */}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {!showResults ? (
                <>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={!isAllAnswered}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] transition duration-300"
                  >
                    Submit Quiz & Get Score
                  </button>
                  <button
                    onClick={() => {
                      setQuestions([]);
                      setTopic("");
                      setSelectedAnswers({});
                    }}
                    className="flex-1 px-6 py-3 rounded-xl text-accent border-2 border-accent bg-transparent hover:bg-accent/10 transition duration-300 font-semibold"
                  >
                    Start New Quiz
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setQuestions([]);
                    setTopic("");
                    setSelectedAnswers({});
                    setShowResults(false);
                  }}
                  className="w-full btn-primary transform hover:scale-[1.01] transition duration-300"
                >
                  Generate Another Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}