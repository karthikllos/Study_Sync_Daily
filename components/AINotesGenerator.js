// components/AINotesGenerator.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function AINotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  const generateNotes = async () => {
    if (!content.trim()) {
      setError("Please enter content to summarize");
      return;
    }

    setGenerating(true);
    setError("");
    setInsufficientCredits(false);

    try {
      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (response.status === 402) {
        setInsufficientCredits(true);
        setError(data.message || "Insufficient credits. Please upgrade your plan.");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Failed to generate notes");
        return;
      }

      setNotes(data.notes || "");
    } catch (err) {
      setError("Error generating notes: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 drop-shadow-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Sparkles className="h-10 w-10 text-purple-400 animate-pulse" />
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Notes Generator
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Convert long study materials into clean, structured, exam-ready notes with one click.
          </p>
        </div>

        {/* ALERTS */}
        {(error || insufficientCredits) && (
          <div
            className={`mb-10 p-5 rounded-xl border flex items-start gap-4 backdrop-blur-md shadow-lg ${
              insufficientCredits
                ? "bg-red-900/30 border-red-700/40"
                : "bg-yellow-900/30 border-yellow-700/40"
            }`}
          >
            <AlertCircle
              className={`h-7 w-7 flex-shrink-0 mt-0.5 ${
                insufficientCredits ? "text-red-400" : "text-yellow-400"
              }`}
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">
                {insufficientCredits ? "Insufficient Credits" : "Generation Error"}
              </h3>
              <p
                className={`text-sm ${
                  insufficientCredits ? "text-red-300" : "text-yellow-300"
                }`}
              >
                {error}
              </p>

              {insufficientCredits && (
                <div className="mt-4 flex gap-4">
                  <Link
                    href="/pricing"
                    className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 transition shadow-md flex items-center text-sm font-medium"
                  >
                    Upgrade Plan <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>

                  <button
                    onClick={() => setInsufficientCredits(false)}
                    className="px-5 py-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* INPUT */}
          <div className="bg-gray-900/50 p-7 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col">
            <h2 className="text-2xl font-semibold text-purple-400 mb-4">Your Material</h2>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your material…"
              className="flex-1 w-full min-h-64 p-4 rounded-xl bg-black/40 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none backdrop-blur-sm"
            />

            <button
              onClick={generateNotes}
              disabled={generating || !content.trim()}
              className="mt-6 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Notes
                </>
              )}
            </button>
          </div>

          {/* OUTPUT */}
          <div className="bg-gray-900/50 p-7 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-purple-400">
                Generated Notes
              </h2>

              {/* Copy Button */}
              {notes && (
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-300"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {notes ? (
                <pre className="whitespace-pre-wrap bg-black/40 p-5 rounded-xl border border-gray-800 text-sm text-gray-200 leading-relaxed">
                  {notes}
                </pre>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-600 border border-dashed border-gray-700 rounded-xl">
                  Your generated notes will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
