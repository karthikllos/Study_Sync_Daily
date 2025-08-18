"use client";

import { useEffect, useState } from "react";

export default function Supporters({ username }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/payments?username=${encodeURIComponent(username)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      }
    };

    fetchData();
    const onUpdated = (e) => {
      if (!e?.detail?.username || e.detail.username !== username) return;
      if (e.detail?.payment) {
        setPayments((prev) => [e.detail.payment, ...prev]);
      } else {
        fetchData();
      }
    };
    window.addEventListener("payments-updated", onUpdated);
    return () => window.removeEventListener("payments-updated", onUpdated);
  }, [username]);

  return (
    <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[color:var(--border)] shadow-[0_0_24px_var(--accent-shadow)]">
      <h2 className="text-2xl font-bold mb-5 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">Recent Supporters</h2>
      <ul className="divide-y divide-[color:var(--divide)]">
        {payments.map((p) => (
          <li key={p._id} className="py-2">
            <span className="text-[color:var(--accent-solid)]">{p.name}</span> donated <span className="text-[color:var(--muted)]">₹{p.amount}</span> — “{p.message || "No message"}”
          </li>
        ))}
      </ul>
      {payments.length === 0 && <p className="text-[color:var(--muted)]">No supporters yet.</p>}
    </div>
  );
}
