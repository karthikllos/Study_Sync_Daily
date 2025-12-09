"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Loader2, RefreshCw, XCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

// --- Reusable Metric Card Component ---
const MetricCard = ({ title, value, subtitle, icon: Icon, iconColor, valueColor = 'text-[var(--foreground)]' }) => (
    <div className="bg-[var(--surface)] rounded-xl p-6 shadow-lg border border-[var(--border)] transition-all duration-300 hover:shadow-xl hover:border-[var(--accent-from)]">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-1 truncate">{title}</p>
                <p className={`text-3xl font-extrabold mt-1 ${valueColor}`}>
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">{subtitle}</p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${iconColor}/10`}>
                <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
        </div>
    </div>
);

// --- Main Component ---
export default function AdminAnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth");
        } else if (status === "authenticated" && session?.user) {
            // NOTE: Security check (e.g., checking session.user.role === 'admin') 
            // should be enforced server-side, but a client-side route guard is often added here.
            fetchAnalytics();
        }
    }, [status, session, router]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/analytics/subscriptions");
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to fetch analytics");
                return;
            }

            // Assume the API returns an object that includes all expected keys, even if null/zero
            setAnalytics(data);
        } catch (err) {
            setError("Error fetching analytics: " + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Loading, Error, and Empty States ---

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--accent-solid)]" />
                    <span className="text-xl font-medium text-[var(--foreground)]">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--background)] py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="p-6 rounded-xl bg-red-900/10 border border-red-500/30 shadow-lg flex items-center gap-4">
                        <XCircle className="h-6 w-6 text-red-400" />
                        <p className="text-red-400 font-medium">Error: {error}</p>
                        <button
                            onClick={fetchAnalytics}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-[var(--accent-solid)] text-white rounded-lg hover:bg-[var(--accent-to)] transition"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry Fetch
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-[var(--background)] py-12 px-4">
                <div className="max-w-6xl mx-auto p-6 text-center text-[var(--text-secondary)] bg-[var(--surface)] rounded-xl shadow-lg">
                    <p>No analytics data available. Try refreshing or check the API connection.</p>
                </div>
            </div>
        );
    }

    // --- Data Processing (Unchanged) ---
    const {
        totalUsers = 0,
        paidUsers = 0,
        freeUsers = 0,
        totalRevenue = 0,
        monthlyRecurringRevenue = 0,
        subscriptionBreakdown = {},
        churnRate = 0,
        conversionRate = 0,
        averageRevenuePerUser = 0,
    } = analytics;

    const paidPercentage = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0;
    const freePercentage = totalUsers > 0 ? ((freeUsers / totalUsers) * 100).toFixed(1) : 0;
    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const formatPercentage = (rate) => `${Number(rate || 0).toFixed(2)}%`;


    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-12 px-4">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="mb-10 flex justify-between items-center border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-4">
                        <BarChart3 className="h-10 w-10 text-[var(--accent-solid)]" />
                        <h1 className="text-4xl font-extrabold tracking-tight">Admin Analytics Dashboard</h1>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)] transition"
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Data
                    </button>
                </div>

                {/* --- Key Metrics Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <MetricCard 
                        title="Total Registered Users" 
                        value={totalUsers.toLocaleString()} 
                        subtitle="All users on the platform"
                        icon={Users} 
                        iconColor="text-blue-500"
                        valueColor="text-blue-400"
                    />
                    <MetricCard 
                        title="Monthly Recurring Revenue (MRR)" 
                        value={formatCurrency(monthlyRecurringRevenue)} 
                        subtitle="Expected monthly income from subs"
                        icon={DollarSign} 
                        iconColor="text-green-500"
                        valueColor="text-green-400"
                    />
                    <MetricCard 
                        title="Average Revenue Per User (ARPU)" 
                        value={formatCurrency(averageRevenuePerUser)} 
                        subtitle="Revenue divided by paid users"
                        icon={TrendingUp} 
                        iconColor="text-yellow-500"
                        valueColor="text-yellow-400"
                    />
                    <MetricCard 
                        title="Total Lifetime Revenue" 
                        value={formatCurrency(totalRevenue)} 
                        subtitle="Cumulative revenue to date"
                        icon={DollarSign} 
                        iconColor="text-purple-500"
                        valueColor="text-purple-400"
                    />
                </div>

                {/* --- User and Rate Metrics --- */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                    {/* Paid/Free Users */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold mb-2">User Segmentation</h2>
                        <div className="grid grid-cols-2 gap-4">
                             <MetricCard 
                                title="Paid Subscribers" 
                                value={paidUsers.toLocaleString()} 
                                subtitle={`${paidPercentage}% of total users`}
                                icon={TrendingUp} 
                                iconColor="text-green-500"
                            />
                            <MetricCard 
                                title="Free/Trial Users" 
                                value={freeUsers.toLocaleString()} 
                                subtitle={`${freePercentage}% of total users`}
                                icon={Users} 
                                iconColor="text-red-500"
                            />
                        </div>
                    </div>
                    
                    {/* Churn Rate */}
                    <MetricCard 
                        title="Churn Rate (Cancellations)" 
                        value={formatPercentage(churnRate)} 
                        subtitle="Users lost/canceled subscription"
                        icon={ArrowDownRight} 
                        iconColor="text-red-500"
                        valueColor="text-red-400"
                    />

                    {/* Conversion Rate */}
                    <MetricCard 
                        title="Conversion Rate (Free -> Paid)" 
                        value={formatPercentage(conversionRate)} 
                        subtitle="Free users converting to paid"
                        icon={ArrowUpRight} 
                        iconColor="text-emerald-500"
                        valueColor="text-emerald-400"
                    />
                </div>

                {/* --- Subscription Breakdown --- */}
                <div className="bg-[var(--surface)] rounded-2xl p-6 shadow-2xl border border-[var(--border)]">
                    <h3 className="text-2xl font-bold mb-6">Plan Breakdown by Revenue</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(subscriptionBreakdown).map(([plan, data]) => (
                            <div key={plan} className="p-4 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] shadow-inner">
                                <h4 className="font-extrabold text-xl mb-3 capitalize text-[var(--accent-solid)]">{plan}</h4>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-[var(--text-tertiary)] text-sm">Active Users</p>
                                        <p className="text-2xl font-bold">{data.count || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--text-tertiary)] text-sm">Monthly Revenue</p>
                                        <p className="text-xl font-bold text-green-500">
                                            {formatCurrency(data.revenue)}
                                        </p>
                                    </div>
                                    {data.monthlyPrice !== undefined && (
                                        <div>
                                            <p className="text-[var(--text-tertiary)] text-sm">Monthly Price</p>
                                            <p className="text-lg">{formatCurrency(data.monthlyPrice)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}