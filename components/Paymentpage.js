"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PaymentPage = ({ username }) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (username) getData();
  }, [username]);

  const getData = async () => {
    try {
      const res = await fetch(`/api/payments?username=${encodeURIComponent(username)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const paymentData = await res.json();
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  const handleSubmit = async () => {
    if (!username) {
      toast.error("Cannot process payment: Username is missing.");
      return;
    }

    if (!name || !amount) {
      toast.error("Name and amount are required!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          message,
          amount: parseInt(amount),
          to_username: username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      toast.success("Payment sent successfully!");

      // Optimistic update
      try {
        window.dispatchEvent(
          new CustomEvent("payments-updated", {
            detail: {
              username,
              payment: {
                _id: `temp_${Date.now()}`,
                name,
                message,
                amount: parseInt(amount),
                createdAt: new Date().toISOString(),
              },
            },
          })
        );
      } catch {}

      setName("");
      setMessage("");
      setAmount("");

      await getData();
      router.refresh();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[color:var(--border)] shadow-[0_0_24px_var(--accent-shadow)]">
      <h2 className="text-2xl font-bold mb-5 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">Make a Payment</h2>

      <p className="text-lg font-semibold mb-2 text-center text-[color:var(--muted)]">
        Support <span className="text-[color:var(--accent-solid)]">@{username}</span>
      </p>

      <input
        type="text"
        placeholder="Your name"
        className="w-full mb-3 p-2 rounded bg-[var(--input-bg)] border border-[color:var(--border)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)]"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="Message"
        className="w-full mb-3 p-2 rounded bg-[var(--input-bg)] border border-[color:var(--border)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)]"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount (e.g. 500)"
        className="w-full mb-3 p-2 rounded bg-[var(--input-bg)] border border-[color:var(--border)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)]"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2 px-4 rounded font-semibold text-white bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] hover:opacity-95 transition-transform duration-200 shadow-[0_0_20px_var(--accent-shadow)] ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01]"}`}
      >
        {loading ? "Processing..." : "Send Support ☕"}
      </button>
    </div>
  );
};

export default PaymentPage;
