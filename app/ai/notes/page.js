// app/ai/notes/page.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  Loader2, Sparkles, Zap, BatteryCharging, 
  ExternalLink, AlertCircle, CheckCircle2, 
  Download, FileJson, FileText, Clipboard 
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export default function AINotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const notesRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [error, setError] = useState("");

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setCreditsRemaining(data.available || 0);
        setIsUnlimited(data.plan === 'Premium' || data.plan === 'Pro Max');
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      fetchCredits();
      setLoading(false);
    }
  }, [status, router]);

  // --- EXPORT FUNCTIONS ---

  const exportPDF = async () => {
    const element = notesRef.current;
    if (!element) return;
    const loadingToast = toast.loading("Preparing PDF...");
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: "#030712",
        useCORS: true 
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("AI_Synthesized_Notes.pdf");
      toast.success("PDF Downloaded!");
    } catch (err) {
      toast.error("PDF export failed.");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const exportDocx = async () => {
    const loadingToast = toast.loading("Generating Word Document...");
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "AI SYNTHESIZED NOTES", bold: true, size: 36, color: "2E86C1" }),
              ],
              spacing: { after: 400 },
            }),
            ...notes.split('\n').map(line => new Paragraph({
              children: [new TextRun({ text: line, size: 24 })],
              spacing: { before: 200 }
            }))
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "AI_Notes.docx");
      toast.success("Word document downloaded!");
    } catch (err) {
      toast.error("Word export failed.");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notes);
    toast.success("Copied to clipboard!");
  };

  const generateNotes = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    setGenerating(true);
    setError("");
    const loadingToast = toast.loading("AI is synthesizing your data...");

    try {
      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setNotes(data.notes || "");
      if (data.credits) {
        setCreditsRemaining(data.credits.remaining);
        setIsUnlimited(data.credits.isUnlimited);
      }
      toast.success("Synthesis Successful!");
    } catch (err) {
      toast.dismiss(loadingToast);
      setError("Network fault: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  const lowCredit = !isUnlimited && creditsRemaining < 3;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 border-b border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-purple-400 h-8 w-8" />
              <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                STUDYSYNC AI NOTES
              </h1>
            </div>
            <p className="text-gray-500 font-mono text-sm">V1.2 // NEURAL SYNTHESIS ENGINE</p>
          </div>

          <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border ${
            lowCredit ? 'border-red-500/50 bg-red-950/20' : 'border-cyan-500/30 bg-cyan-950/20'
          }`}>
            <BatteryCharging className={lowCredit ? 'text-red-400' : 'text-cyan-400'} />
            <span className="font-mono font-bold tracking-widest">
              {isUnlimited ? 'UNLIMITED' : `POWER: ${creditsRemaining}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-md">
              <h2 className="text-cyan-400 font-mono text-xs uppercase tracking-[0.3em] mb-4">Source Data</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste articles, video transcripts, or messy notes here..."
                className="w-full h-[500px] bg-black/40 border border-gray-800 rounded-2xl p-5 text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-sm"
              />
              <button
                onClick={generateNotes}
                disabled={generating || !content.trim()}
                className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 font-bold text-lg shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                {generating ? "SYNTHESIZING..." : "START AI SYNTHESIS"}
              </button>
            </div>
          </div>

          {/* Output Panel (The Beautified Side) */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900/40 border border-purple-900/30 rounded-3xl p-6 backdrop-blur-md h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-purple-400 font-mono text-xs uppercase tracking-[0.3em]">Synthesized Result</h2>
                
                {notes && (
                  <div className="flex gap-2">
                    <button onClick={copyToClipboard} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="Copy"><Clipboard size={18} /></button>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                      <FileText size={14} /> PDF
                    </button>
                    <button onClick={exportDocx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-colors">
                      <FileJson size={14} /> DOCX
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-black/40 border border-gray-800 rounded-2xl p-8 shadow-inner">
                {notes ? (
                  <div ref={notesRef} className="prose prose-invert prose-cyan max-w-none">
                    <ReactMarkdown>{notes}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4">
                    <Sparkles size={40} className="opacity-10" />
                    <p className="font-mono text-sm tracking-widest animate-pulse">AWAITING INPUT DATA...</p>
                  </div>
                )}
              </div>
              
              {notes && (
                <div className="mt-4 flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase">
                  <CheckCircle2 size={12} /> Verification: Synthesis complete and verified.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
