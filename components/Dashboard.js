"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import PaymentForm from "./PaymentForm";
import { useSearchParams } from "next/navigation";
import { Sparkles, Heart, Coffee, Send, Copy, Mail, CheckCircle, AlertCircle } from 'lucide-react';

// Updated AIThankYouGenerator with email functionality
const AIThankYouGenerator = ({ donation, onClose, senderName }) => {
  const [thankYouNote, setThankYouNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteStyle, setNoteStyle] = useState('heartfelt');
  const [copied, setCopied] = useState(false);
  const [showEmailOption, setShowEmailOption] = useState(false);
  
  // Email states
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const generateThankYou = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-thankyou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: donation.name,
          amount: donation.amount,
          message: donation.message,
          style: noteStyle
        })
      });
      const data = await response.json();
      let cleanedNote = data.thankYouNote || `Thank you so much for being part of our community!\n\nWe really appreciate all the support you have given us, and look forward to continuing to connect with you in the future.`;
      
      // Remove placeholder text like [YOUR NAME], [NAME], etc.
      cleanedNote = cleanedNote
        .replace(/\[YOUR NAME\]/gi, '')
        .replace(/\[NAME\]/gi, '')
        .replace(/\[SIGNATURE\]/gi, '')
        .replace(/\[YOUR SIGNATURE\]/gi, '')
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      setThankYouNote(cleanedNote);
    } catch (error) {
      console.error('Error generating thank-you note:', error);
      setThankYouNote(`Thank you so much for being part of our community!\n\nWe really appreciate all the support you have given us, and look forward to continuing to connect with you in the future.`);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!email.trim()) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailSending(true);
    setEmailError('');

    try {
      const response = await fetch('/api/send-thankyou-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          thankYouNote,
          donorName: donation.name,
          amount: donation.amount,
          senderName: senderName || 'The Team'
        })
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        setTimeout(() => {
          setEmailSent(false);
          setShowEmailOption(false);
          setEmail('');
        }, 3000);
      } else {
        setEmailError(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (donation && noteStyle) {
      generateThankYou();
    }
  }, [donation, noteStyle]);

  if (!donation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full my-8 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 p-6 rounded-t-3xl border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-gray-400" />
              <div>
                <h2 className="text-2xl font-bold font-display tracking-wide">AI Thank-You Generator</h2>
                <p className="text-gray-400">Using handwritten card template</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:bg-gray-300 hover:bg-opacity-30 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Donation Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold text-lg shadow">
              {donation.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{donation.name || 'Anonymous'}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Supported with ₹{donation.amount}
              </p>
            </div>
            <Coffee className="w-5 h-5 text-yellow-500 ml-auto" />
          </div>
          {donation.message && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mt-1 border text-sm text-gray-500 dark:text-gray-300 italic">
              "{donation.message}"
            </div>
          )}
        </div>

        {/* Style Selector */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Note Style</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'heartfelt', label: '💝 Heartfelt', desc: 'Warm & personal' },
              { key: 'professional', label: '🤝 Professional', desc: 'Polished & formal' },
              { key: 'casual', label: '😊 Casual', desc: 'Friendly & relaxed' },
              { key: 'creative', label: '🎨 Creative', desc: 'Unique & artistic' },
              { key: 'grateful', label: '🙏 Grateful', desc: 'Deep appreciation' },
              { key: 'inspiring', label: '✨ Inspiring', desc: 'Motivational' }
            ].map((style) => (
              <button
                key={style.key}
                onClick={() => setNoteStyle(style.key)}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  noteStyle === style.key
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{style.label}</div>
                <div className="text-xs opacity-75">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Thank-You Card */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-gray-50 to-white">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-8 py-12 flex flex-col gap-6 items-center justify-center w-full max-w-sm relative"
            style={{ fontFamily: "inherit", minHeight: "280px" }}>
            
            {/* Handwritten "Thank you" with heart */}
            <div className="w-full text-center mb-6">
              <div style={{
                fontFamily: "'Dancing Script', 'Pacifico', 'Caveat', 'Satisfy', cursive",
                fontSize: "3.2rem",
                fontWeight: 400,
                letterSpacing: "-2px",
                color: "#1a1a1a",
                lineHeight: "0.9",
                transform: "rotate(-1deg)",
                textShadow: "0 1px 2px rgba(0,0,0,0.1)"
              }}>
                <span style={{ display: "inline-block", marginRight: "8px" }}>Thank</span>
                <span style={{ display: "inline-block" }}>you</span>
                <span style={{ 
                  fontSize: "2.8rem", 
                  color: "#1a1a1a", 
                  marginLeft: "12px",
                  display: "inline-block",
                  transform: "rotate(8deg)"
                }}>♥</span>
              </div>
            </div>

            {/* Main message text */}
            <div className="w-full text-center font-sans text-[0.95rem] leading-relaxed text-gray-700 px-2"
                 style={{ 
                   opacity: 0.9, 
                   letterSpacing: "0.02em", 
                   lineHeight: "1.6",
                   marginBottom: "16px",
                   fontWeight: 400
                 }}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              ) : (
                thankYouNote || `Thank you so much for being part of our community!\n\nWe really appreciate all the support you have given us, and look forward to continuing to connect with you in the future.`
              )}
            </div>

            {/* Subtle decorative elements */}
            <div className="absolute top-4 right-4 w-1 h-1 bg-gray-300 rounded-full opacity-60"></div>
            <div className="absolute bottom-4 left-4 w-1 h-1 bg-gray-300 rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Copy/Email options */}
        {thankYouNote && (
          <div className="flex gap-2 mb-4 mx-8">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(thankYouNote);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setShowEmailOption(!showEmailOption)}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        )}

        {/* Email Option - Enhanced */}
        {showEmailOption && thankYouNote && (
          <div className="mx-8 mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
            <h5 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email This Thank-You Note
            </h5>
            
            {/* Success message */}
            {emailSent && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-green-100 border border-green-300 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Email sent successfully!</span>
              </div>
            )}

            {/* Error message */}
            {emailError && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{emailError}</span>
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(''); // Clear error when user types
                }}
                placeholder={`${donation.name || 'Supporter'}'s email address`}
                disabled={emailSending || emailSent}
                className="flex-1 px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button 
                onClick={sendEmail}
                disabled={emailSending || emailSent || !email.trim()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 min-w-[80px] justify-center"
              >
                {emailSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : emailSent ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              This will send a beautifully formatted thank-you email to the supporter
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-3xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ✨ Powered by AI • Made with{' '}
              <Heart className="w-4 h-4 text-red-400 inline mx-1" /> for every supporter
            </p>
            <button
              onClick={generateThankYou}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 rounded-lg transition-colors flex items-center gap-2 font-bold"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions (unchanged)
function getAvatarData(name = "") {
  const initials = name?.charAt(0)?.toUpperCase() || "?";
  const colors = [
    "bg-red-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
  ];
  const code = name && name.length > 0 ? name.charCodeAt(0) : null;
  const color = code !== null ? colors[code % colors.length] : "bg-gray-400";
  return { avatar: initials, bgColor: color };
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "just now";
  const date = new Date(timestamp);
  if (isNaN(date)) return "just now";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPaymentDate(p) {
  return new Date(p?.createdAt || p?.date || p?.timestamp || 0);
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [showThankYouGenerator, setShowThankYouGenerator] = useState(false);
  const [currentDonation, setCurrentDonation] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromQuery = searchParams.get("u");
    if (fromQuery) {
      setTargetUsername(fromQuery);
      return;
    }
    if (session?.user?.username && !targetUsername) {
      setTargetUsername(session.user.username);
    }
  }, [searchParams, session?.user?.username, targetUsername]);

  useEffect(() => {
    const load = async () => {
      if (!targetUsername) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/payments?username=${encodeURIComponent(targetUsername)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = await res.json();
        const arr = Array.isArray(data) ? data.slice() : [];
        arr.sort((a, b) => getPaymentDate(b) - getPaymentDate(a));
        setPayments(arr);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
    const onUpdated = (e) => {
      if (!e?.detail?.username || e.detail.username !== targetUsername) return;
      if (e.detail.payment && e.detail.showThankYou) {
        setCurrentDonation({
          name: e.detail.payment.name,
          message: e.detail.payment.message,
          amount: e.detail.payment.amount
        });
        setShowThankYouGenerator(true);
      }
      load();
    };
    window.addEventListener("payments-updated", onUpdated);
    return () => window.removeEventListener("payments-updated", onUpdated);
  }, [targetUsername]);

  const { totalAmount, totalSupporters, avgSupport } = useMemo(() => {
    const totalAmountCalc = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const supporters = payments.length;
    const avg = supporters > 0 ? (totalAmountCalc / supporters).toFixed(1) : 0;
    return {
      totalAmount: totalAmountCalc,
      totalSupporters: supporters,
      avgSupport: avg,
    };
  }, [payments]);

  if (status === "loading") {
    return (
      <div className="relative z-10 mt-16 max-w-6xl w-full mx-auto text-gray-300">
        Loading session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative z-10 mt-16 max-w-3xl mx-auto w-full text-center bg-[var(--surface)] border border-[color:var(--border)] rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-2">Welcome!</h2>
        <p className="text-[color:var(--muted)] mb-6">
          Sign in to view your dashboard and recent supporters.
        </p>
        <button
          onClick={() => signIn(undefined, { callbackUrl: "/home" })}
          className="px-5 py-2 rounded bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="relative z-10 mt-16 max-w-6xl w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <span className="text-sm text-[color:var(--muted)]">for</span>
            <input
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value.trim())}
              placeholder={session?.user?.username || "username"}
              className="px-3 py-1 rounded bg-[var(--input-bg)] border border-[color:var(--border)] text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 mb-8">
          {[
            {
              label: "Total Raised",
              value: `₹${totalAmount}`,
              icon: "💰",
              gradient: "from-green-400 to-emerald-500",
            },
            {
              label: "Total Supporters",
              value: totalSupporters,
              icon: "👥",
              gradient: "from-blue-400 to-cyan-500",
            },
            {
              label: "Average Support",
              value: `₹${avgSupport}`,
              icon: "☕",
              gradient: "from-orange-400 to-red-500",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-2xl border backdrop-blur-sm shadow-xl"
              style={{
                backgroundColor: "var(--surface, rgba(255,255,255,0.95))",
                borderColor: "var(--border, rgba(0,0,0,0.1))",
              }}
            >
              {/* Gradient top border */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${stat.gradient}`}
              />
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p
                    className="text-sm font-medium uppercase tracking-wider"
                    style={{ color: "var(--muted, #64748b)" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div className="text-4xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Supporters + Payment */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Supporters */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="text-center lg:text-left">
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Recent Supporters
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                See how your community shows appreciation
              </p>
            </div>

            <div className="space-y-4">
              {loading && (
                <p className="text-center text-sm text-gray-400">Refreshing…</p>
              )}
              {error && (
                <p className="text-center text-sm text-red-400">{error}</p>
              )}

              {payments.length === 0 && !loading && !error ? (
                <div
                  className="text-center py-8 rounded-2xl border backdrop-blur-sm"
                  style={{
                    backgroundColor: "var(--surface, rgba(255,255,255,0.9))",
                    borderColor: "var(--border, rgba(0,0,0,0.1))",
                    color: "var(--muted)",
                  }}
                >
                  <div className="text-4xl mb-2">☕</div>
                  <p>No supporters yet. Be the first!</p>
                </div>
              ) : (
                payments.slice(0, 4).map((support, idx) => {
                  const avatarData = getAvatarData(support?.name || "A");
                  return (
                    <div
                      key={`${support?._id || idx}-${idx}`}
                      className="p-4 rounded-2xl border backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: "var(--surface, rgba(255,255,255,0.9))",
                        borderColor: "var(--border, rgba(0,0,0,0.1))",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarData.bgColor} shadow-md`}
                        >
                          {avatarData.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-semibold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {support?.name || "Anonymous"}
                            </span>
                            <span
                              className="text-sm"
                              style={{ color: "var(--muted)" }}
                            >
                              bought {Number(support?.amount) || 0} chai
                              {(Number(support?.amount) || 0) !== 1 ? "s" : ""}
                            </span>
                            {(Number(support?.amount) || 0) >= 5 && (
                              <span className="text-lg">🎉</span>
                            )}
                            <span
                              className="text-xs ml-auto"
                              style={{ color: "var(--muted)" }}
                            >
                              {formatTimeAgo(
                                support?.createdAt ||
                                  support?.date ||
                                  support?.timestamp
                              )}
                            </span>
                          </div>
                          {support?.message && (
                            <p
                              className="text-sm leading-relaxed"
                              style={{ color: "var(--muted)" }}
                            >
                              {support.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {payments.length > 4 && (
                <div
                  className="text-center py-2 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  and {payments.length - 4} more supporters...
                </div>
              )}
            </div>
          </div>
          {/* Payment Section */}
          <div className="mt-8">
            <PaymentForm username={targetUsername} recipientName={targetUsername} />
          </div>
        </div>
      </section>

      {/* AI Thank-You Generator Modal */}
      {showThankYouGenerator && currentDonation && (
        <AIThankYouGenerator
          donation={currentDonation}
          onClose={() => {
            setShowThankYouGenerator(false);
            setCurrentDonation(null);
          }}
          senderName={session?.user?.name || targetUsername}
        />
      )}
    </>
  );
}