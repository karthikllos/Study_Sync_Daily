// app/account/billing/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, AlertCircle, CheckCircle } from "lucide-react";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }
    if (status === "authenticated") {
      fetchBillingData();
    }
  }, [status, router]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch subscription status
      const subRes = await fetch("/api/checkout/subscription");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      // Fetch invoices
      const invRes = await fetch("/api/checkout/invoices");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(Array.isArray(invData) ? invData : invData.invoices || []);
      }
    } catch (err) {
      console.error("Error fetching billing data:", err);
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Subscription cancelled successfully");
        fetchBillingData();
      }
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      alert("Failed to cancel subscription");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Billing & Subscription
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        )}

        {/* Current Subscription */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-emerald-600" />
              Current Plan
            </h2>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {subscription.planName || "Free"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {subscription.status || "Active"}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.renewalDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Renews On</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(subscription.renewalDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.status === "active" && subscription.planName !== "Free" && (
                <button
                  onClick={handleCancelSubscription}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No active subscription</p>
              <a
                href="/pricing"
                className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                Upgrade Now
              </a>
            </div>
          )}
        </div>

        {/* Invoice History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Invoice History
          </h2>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                        ${(invoice.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            download
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No invoices yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}