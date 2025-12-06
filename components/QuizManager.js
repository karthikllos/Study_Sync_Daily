// components/QuizManager.js
"use client";
import React, { useState } from "react";
import { Award, Clock, Trash2, Play, Calendar, TrendingUp } from "lucide-react";

export default function QuizManager({ quizzes = [], onRefresh = () => {} }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setUserAnswers(new Array(quiz.questions.length).fill(""));
    setShowResults(false);
    setScore(0);
    setStartTime(Date.now());
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Calculate score
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      const userAnswer = userAnswers[idx]?.trim().toLowerCase();
      const correctAnswer = q.answer.trim().toLowerCase();
      
      if (q.type === "true_false") {
        if (userAnswer === correctAnswer) correctCount++;
      } else if (q.type === "multiple_choice") {
        if (userAnswer === correctAnswer) correctCount++;
      } else {
        // Short answer - check if answer contains key terms
        const keyTerms = correctAnswer.split(" ").filter(t => t.length > 3);
        const hasKeyTerms = keyTerms.some(term => userAnswer.includes(term));
        if (hasKeyTerms) correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    setScore(finalScore);
    setShowResults(true);

    // Submit to backend
    try {
      const res = await fetch("/api/quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: activeQuiz._id,
          answers: userAnswers,
          score: finalScore,
          timeTaken,
        }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const res = await fetch("/api/quizzes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (activeQuiz && !showResults) {
    // Quiz taking view
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">{activeQuiz.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {activeQuiz.questions.length} questions • {activeQuiz.academicTask?.subject || "General"}
            </p>
          </div>

          <div className="space-y-8">
            {activeQuiz.questions.map((question, idx) => (
              <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-lg font-medium flex-1">{question.content}</p>
                </div>

                {question.type === "multiple_choice" && question.options ? (
                  <div className="ml-11 space-y-2">
                    {question.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${idx}`}
                          value={option}
                          checked={userAnswers[idx] === option}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : question.type === "true_false" ? (
                  <div className="ml-11 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value="true"
                        checked={userAnswers[idx] === "true"}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value="false"
                        checked={userAnswers[idx] === "false"}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span>False</span>
                    </label>
                  </div>
                ) : (
                  <textarea
                    value={userAnswers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Type your answer..."
                    className="ml-11 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    rows={3}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSubmitQuiz}
              disabled={userAnswers.some((a) => !a)}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Submit Quiz
            </button>
            <button
              onClick={() => {
                setActiveQuiz(null);
                setUserAnswers([]);
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && activeQuiz) {
    // Results view
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
              <Award className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-6xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {score}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {score >= 80 ? "Excellent work!" : score >= 60 ? "Good job!" : "Keep practicing!"}
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold">Review Your Answers</h3>
            {activeQuiz.questions.map((question, idx) => {
              const userAnswer = userAnswers[idx];
              const correctAnswer = question.answer;
              const isCorrect =
                userAnswer?.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-red-300 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="font-bold">{idx + 1}.</span>
                    <p className="flex-1 font-medium">{question.content}</p>
                  </div>
                  <div className="ml-6 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Your answer:</span>{" "}
                      <span className={isCorrect ? "text-emerald-700" : "text-red-700"}>
                        {userAnswer}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <span className="font-semibold">Correct answer:</span>{" "}
                        <span className="text-emerald-700">{correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                setActiveQuiz(null);
                setShowResults(false);
              }}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setUserAnswers(new Array(activeQuiz.questions.length).fill(""));
                setStartTime(Date.now());
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Retry Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz list view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => {
        const lastAttempt = quiz.attempts?.[quiz.attempts.length - 1];
        const averageScore = quiz.attempts?.length
          ? Math.round(
              quiz.attempts.reduce((sum, a) => sum + a.score, 0) / quiz.attempts.length
            )
          : null;
        const daysUntilReview = Math.ceil(
          (new Date(quiz.nextReviewDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        return (
          <div
            key={quiz._id}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1">{quiz.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quiz.academicTask?.subject || "General"} • {quiz.questions.length} questions
                </p>
              </div>
              <button
                onClick={() => handleDeleteQuiz(quiz._id)}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {lastAttempt && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Last Score</span>
                  <span className="font-bold text-emerald-600">{lastAttempt.score}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Average</span>
                  <span className="font-bold">{averageScore}%</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <Calendar className="h-4 w-4" />
              <span>
                Review {daysUntilReview > 0 ? `in ${daysUntilReview} days` : "today"}
              </span>
            </div>

            <button
              onClick={() => handleStartQuiz(quiz)}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Quiz
            </button>
          </div>
        );
      })}
    </div>
  );
}