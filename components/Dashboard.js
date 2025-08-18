"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import PaymentPage from "@/components/Paymentpage";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [targetUsername, setTargetUsername] = useState("");

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
        const res = await fetch(`/api/payments?username=${encodeURIComponent(targetUsername)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
    const onUpdated = (e) => {
      if (!e?.detail?.username || e.detail.username !== targetUsername) return;
      load();
    };
    window.addEventListener("payments-updated", onUpdated);
    return () => window.removeEventListener("payments-updated", onUpdated);
  }, [targetUsername]);

  const { totalAmount, totalSupporters } = useMemo(() => {
    const totalAmountCalc = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { totalAmount: totalAmountCalc, totalSupporters: payments.length };
  }, [payments]);

  if (status === "loading") {
    return (
      <div className="relative z-10 mt-16 max-w-6xl w-full mx-auto text-gray-300">Loading session…</div>
    );
  }

  if (!session) {
    return (
      <div className="relative z-10 mt-16 max-w-3xl mx-auto w-full text-center bg-[var(--surface)] border border-[color:var(--border)] rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-2">Welcome!</h2>
        <p className="text-[color:var(--muted)] mb-6">Sign in to view your dashboard and recent supporters.</p>
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
    <section className="relative z-10 mt-16 max-w-6xl w-full mx-auto">
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
        {/* Public page deprecated; keep link hidden intentionally */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[color:var(--border)]">
          <div className="text-sm text-gray-400">Total Supporters</div>
          <div className="text-3xl font-bold mt-1">{totalSupporters}</div>
        </div>
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[color:var(--border)]">
          <div className="text-sm text-gray-400">Total Amount</div>
          <div className="text-3xl font-bold mt-1">₹{totalAmount}</div>
        </div>
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[color:var(--border)]">
          <div className="text-sm text-gray-400">Username</div>
          <div className="text-3xl font-bold mt-1 truncate">@{targetUsername || ""}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[color:var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold">Recent Supporters</h3>
            {loading && <span className="text-sm text-gray-400">Refreshing…</span>}
          </div>
          {error && (
            <div className="mb-3 text-sm text-red-400">{error}</div>
          )}
          <ul className="divide-y divide-[color:var(--divide)]">
            {payments.slice(0, 8).map((p) => (
              <li key={p._id} className="py-2">
                <span className="text-[color:var(--accent-solid)]">{p.name}</span> donated <span className="text-[color:var(--muted)]">₹{p.amount}</span>
                {p.message && <span> — “{p.message}”</span>}
              </li>
            ))}
          </ul>
          {payments.length === 0 && !loading && !error && (
            <p className="text-[color:var(--muted)]">No supporters yet.</p>
          )}
        </div>
        <PaymentPage username={targetUsername} />
      </div>
    </section>
  );
}


