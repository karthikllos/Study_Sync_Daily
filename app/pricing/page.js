"use client";
import React, { useState } from 'react';
import { Check, Zap, Cpu, TrendingUp, Users, Shield, Star, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Assume Razorpay is globally available via a script tag in layout.js, as is standard practice.

export default function PricingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    // Define new theme variables (Emerald/Teal)
    const themeVars = {
        '--background': 'var(--color-gray-50, #f9fafb)', 
        '--surface': 'var(--color-white, #ffffff)',
        '--surface-2': 'var(--color-gray-100, #f3f4f6)', 
        '--foreground': 'var(--color-gray-900, #111827)',
        '--muted': 'var(--color-gray-600, #4b5563)',
        '--border': 'rgba(16, 185, 129, 0.12)', 
        '--accent-from': '#047857', 
        '--accent-to': '#34d399',   
        '--accent-shadow': 'rgba(16, 185, 129, 0.25)',
    };

    const plans = [
        { 
            name: "Free", 
            price: "$0", 
            planId: 'PLAN_FREE',
            features: [
                { icon: <Check />, desc: "Daily Blueprint & Routine Manager" },
                { icon: <Check />, desc: "Manual Task Creation" },
                { icon: <Zap />, desc: "5 Free AI Credits per month" },
                { icon: <Shield />, desc: "Standard Email Support" }
            ],
            buttonText: "Get Started Free",
            isHighlighted: false,
        },
        { 
            name: "Pro", 
            price: "$9/mo", 
            planId: 'PLAN_PRO_MONTHLY', // Server-side plan ID
            features: [
                { icon: <Check />, desc: "**Everything in Free**" },
                { icon: <Star />, desc: "AI Predictive Scheduling (Optimal Study Windows)" },
                { icon: <TrendingUp />, desc: "Advanced Reflection Analytics" },
                { icon: <Clock />, desc: "Integrated Pomodoro Timer" },
                { icon: <Cpu />, desc: "50 AI Credits per month" },
            ],
            buttonText: "Start Pro Trial",
            isHighlighted: true,
        },
        { 
            name: "Pro Max", 
            price: "$19/mo", 
            planId: 'PLAN_PRO_MAX_MONTHLY', // Server-side plan ID
            features: [
                { icon: <Check />, desc: "**Everything in Pro**" },
                { icon: <Users />, desc: "Group Project Collaboration Tools" },
                { icon: <Shield />, desc: "Dedicated Accountability Partner Slot" },
                { icon: <Star />, desc: "Premium Template Library Access" },
                { icon: <Cpu />, desc: "Unlimited AI Credits" },
            ],
            buttonText: "Go Pro Max",
            isHighlighted: false,
        },
    ];

    const handleSubscription = async (plan) => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        if (plan.name === 'Free') {
             // Already using the free tier or redirect to dashboard
             router.push('/dashboard');
             return;
        }

        setLoadingPlanId(plan.planId);

        try {
            // 1. Initiate subscription order creation on the server
            const response = await fetch('/api/checkout/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    planId: plan.planId, 
                    planName: plan.name,
                    price: plan.price, 
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error creating order: ${error.message || 'Server error'}`);
                return;
            }

            const data = await response.json();
            
            // 2. Integrate with Razorpay (client-side)
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: data.amount, 
                currency: data.currency,
                name: 'StudySync Daily',
                description: `${plan.name} Plan Subscription`,
                order_id: data.orderId, 
                handler: function (response) {
                    // 3. Verify payment after success
                    fetch('/api/checkout/subscription/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            planName: plan.name,
                        }),
                    }).then(res => res.json()).then(verificationData => {
                        if (verificationData.success) {
                            alert(`Subscription to ${plan.name} successful! Welcome to Pro Mode.`);
                            router.push('/dashboard'); // Go to dashboard after success
                        } else {
                            alert("Payment verification failed. Please contact support.");
                        }
                    });
                },
                prefill: {
                    name: session?.user?.name,
                    email: session?.user?.email,
                },
                theme: {
                    color: themeVars['--accent-from'],
                }
            };
            
            // Ensure Razorpay script is loaded before calling new window.Razorpay()
            if (typeof window.Razorpay === 'undefined') {
                 alert("Payment gateway not loaded. Please try again or check network connection.");
                 return;
            }

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Subscription initiation error:", error);
            alert("Could not start payment process. Please try again.");
        } finally {
            setLoadingPlanId(null);
        }
    };

    return (
        <main className="relative min-h-[100vh] px-6 py-20" style={themeVars}>
            {/* --- Background Layers (Emerald/Teal Theme) --- */}
            <div 
                className="absolute inset-0 z-0" 
                style={{ background: themeVars['--background'] }} 
            />
            <div 
                className="absolute inset-0 z-0" 
                style={{ 
                    background: `linear-gradient(135deg, ${themeVars['--background']} 0%, ${themeVars['--surface-2']} 50%, transparent 100%)`
                }} 
            />
            <div 
                className="absolute inset-0 z-0" 
                style={{ 
                    background: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(52, 211, 153, 0.3) 0%, transparent 70%)`
                }} 
            />
            
            {/* --- Header Section --- */}
            <div className="relative z-10 max-w-4xl mx-auto text-center mb-16">
                <h1 className="text-5xl font-extrabold mb-4" style={{ color: themeVars['--foreground'] }}>
                    Choose Your Path to Mastery
                </h1>
                <p className="text-xl" style={{ color: themeVars['--muted'] }}>
                    Unlock intelligent planning, AI study tools, and community features designed to optimize your time and grades.
                </p>
            </div>

            {/* --- Pricing Grid --- */}
            <section 
                className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
                style={{ color: themeVars['--foreground'] }}
            >
                {plans.map((p, index) => (
                    <div 
                        key={index} 
                        className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl flex flex-col ${p.isHighlighted ? 'ring-4 ring-emerald-500' : ''}`}
                        style={{ 
                            backgroundColor: themeVars['--surface'],
                            border: `1px solid ${p.isHighlighted ? '#10b981' : themeVars['--border']}`,
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)'
                        }}
                    >
                        {/* Highlight Tag */}
                        {p.isHighlighted && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                                Recommended
                            </div>
                        )}
                        
                        {/* Hover overlay (Updated gradient) */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none rounded-2xl"
                            style={{ 
                                background: `linear-gradient(135deg, ${themeVars['--accent-from']}, ${themeVars['--accent-to']})`
                            }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 flex-grow">
                            <h3 
                                className="text-3xl font-bold mb-3"
                                style={{ 
                                    background: `linear-gradient(135deg, ${themeVars['--accent-from']}, ${themeVars['--accent-to']})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                {p.name}
                            </h3>
                            
                            <p 
                                className="text-5xl font-extrabold mb-8"
                                style={{ color: themeVars['--foreground'] }}
                            >
                                {p.price}
                            </p>
                            
                            <ul className="space-y-4 mb-8">
                                {p.features.map((f, featureIndex) => (
                                    <li 
                                        key={featureIndex} 
                                        className="flex items-start space-x-3"
                                        style={{ color: themeVars['--muted'] }}
                                    >
                                        <span 
                                            className="text-lg flex-shrink-0 mt-1"
                                            style={{ color: themeVars['--accent-from'] }}
                                        >
                                            {f.icon}
                                        </span>
                                        <span 
                                            className="text-base"
                                            style={{ color: f.desc.includes('**') ? themeVars['--foreground'] : themeVars['--muted'] }}
                                        >
                                            {f.desc.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Button is positioned at the bottom and uses the handler */}
                        <div className="relative z-10 mt-auto">
                            <button 
                                onClick={() => handleSubscription(p)}
                                disabled={loadingPlanId === p.planId || p.name === 'Free' || (loadingPlanId !== null && loadingPlanId !== p.planId)}
                                className="w-full py-4 px-4 rounded-xl text-lg font-bold transition-all duration-200 hover:shadow-2xl hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ 
                                    background: p.isHighlighted ? themeVars['--accent-from'] : themeVars['--surface-2'],
                                    color: p.isHighlighted ? 'white' : themeVars['--accent-from'],
                                    boxShadow: p.isHighlighted ? `0 4px 10px ${themeVars['--accent-shadow']}` : 'none',
                                    border: p.isHighlighted ? 'none' : `2px solid ${themeVars['--accent-from']}`
                                }}
                            >
                                {loadingPlanId === p.planId ? 'Processing...' : p.buttonText}
                            </button>
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}