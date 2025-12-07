// components/AINotesGenerator.js (WOW UI: Neon/Cyberpunk Edition)
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Sparkles, Zap, BatteryCharging, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AINotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  // Initial state for credits, set to a placeholder for visual effect
  const [creditsRemaining, setCreditsRemaining] = useState(session?.user?.credits ?? 5); 
  const [error, setError] = useState("");

  // Function to fetch credits on load (simulated/placeholder)
  const fetchCredits = async () => {
    // In a real app, you would fetch from /api/user/credits
    // For this example, we'll use a session placeholder or a default
    // Replace with a real API call if needed
    if (session?.user?.credits !== undefined) {
        setCreditsRemaining(session.user.credits);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      fetchCredits();
      setLoading(false);
    }
  }, [status, router, session]);

  const generateNotes = async () => {
    if (!content.trim()) {
      setError("Input data required.");
      return;
    }
    if (creditsRemaining < 1) {
        setError("Insufficient power. Upgrade for more credits.");
        return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Assume API returns a specific error for credits like 402 or a custom error code
        const errorMessage = data.error || "System failure: Notes generation aborted.";
        setError(errorMessage);
        return;
      }

      setNotes(data.notes || "Note generation successful, but response was empty.");
      // Ensure the credit update is applied
      if (data.creditsRemaining !== undefined) {
        setCreditsRemaining(data.creditsRemaining);
      } else {
         // Fallback: assume 1 credit was used if the API didn't return the new count
        setCreditsRemaining(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      setError("Critical network fault: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400 drop-shadow-lg shadow-cyan-400/50" />
          <span className="text-xl font-mono text-cyan-300 tracking-wider">INITIATING PROTOCOL...</span>
        </div>
      </div>
    );
  }

  const lowCredit = creditsRemaining < 3;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Status Bar */}
        <div className="mb-12 border-b border-cyan-700/50 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Sparkles className="h-10 w-10 text-purple-400 drop-shadow-lg shadow-purple-400/70" />
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                A.I. Note Synthesis Unit
              </h1>
            </div>
            
            {/* Credit Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${lowCredit ? 'border-red-500 bg-red-900/30' : 'border-cyan-500 bg-cyan-900/30' } shadow-lg`}>
                <BatteryCharging className={`h-5 w-5 ${lowCredit ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className={`text-lg font-mono tracking-widest ${lowCredit ? 'text-red-300' : 'text-cyan-300'}`}>
                    POWER: {creditsRemaining}
                </span>
                <Link href="/pricing" className="ml-2 text-xs text-purple-300 hover:text-purple-400 underline flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1"/> Recharge
                </Link>
            </div>
          </div>
          <p className="text-gray-400 text-lg font-mono tracking-wide">
            DATA INPUT & PROCESSING TERMINAL V1.1
          </p>
        </div>
        
        {/* --- */}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900/50 border border-red-500 shadow-xl shadow-red-500/10 transition-all duration-300">
            <p className="text-red-400 font-mono tracking-wide">
                <span className="font-bold mr-2">// ERROR:</span> {error}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="bg-gray-800/20 p-8 rounded-2xl border border-cyan-800/50 shadow-2xl shadow-cyan-900/30 backdrop-blur-sm h-full flex flex-col transition-all duration-300 hover:border-cyan-700">
            <h2 className="text-2xl font-bold mb-5 text-cyan-400 border-b border-cyan-700/50 pb-2">SOURCE DATA INPUT</h2>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw data here (text, documents, excerpts)..."
              className="flex-1 w-full h-80 min-h-64 p-5 rounded-lg bg-gray-900/70 border-2 border-purple-800/50 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner shadow-gray-900/50 transition duration-300 font-mono text-sm"
            />
            
            <button
              onClick={generateNotes}
              disabled={generating || !content.trim() || creditsRemaining < 1}
              className={`mt-6 w-full px-6 py-3 rounded-xl font-bold text-lg transition duration-300 shadow-xl flex items-center justify-center gap-3 tracking-widest ${
                generating || !content.trim() || creditsRemaining < 1
                  ? 'bg-gray-700 text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed border border-gray-600'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 hover:scale-[1.01] shadow-purple-600/50'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  PROCESSING DATA...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  SYNTHESIZE NOTES (1 UNIT)
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/20 p-8 rounded-2xl border border-cyan-800/50 shadow-2xl shadow-cyan-900/30 backdrop-blur-sm h-full flex flex-col transition-all duration-300 hover:border-cyan-700">
            <h2 className="text-2xl font-bold mb-5 text-cyan-400 border-b border-cyan-700/50 pb-2">SYNTHESIS OUTPUT</h2>
            
            <div className="flex-1 overflow-y-auto">
                {notes ? (
                    <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-5 bg-black/50 rounded-lg border-2 border-purple-800/50 text-cyan-300 shadow-inner shadow-black/70">
                            {notes}
                        </pre>
                    </div>
                ) : (
                    <div className="h-80 min-h-64 flex items-center justify-center text-gray-600 border-2 border-dashed border-cyan-800 rounded-lg p-5 bg-black/30">
                        <p className="text-center font-mono tracking-wider">
                            <Sparkles className="h-6 w-6 inline-block mb-2 text-purple-400"/>
                            <br/>
                            SYNTHESIS ENGINE STANDBY<br/>
                            Awaiting Data Input for AI Processing...
                        </p>
                    </div>
                )}
            </div>
            {/* The credit status is now prominently in the header, removing the redundant line here */}
          </div>
        </div>
      </div>
    </div>
  );
}