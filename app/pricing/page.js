"use client";
import React, { useState } from 'react';
import { Check, Zap, Cpu, TrendingUp, Users, Shield, Star, Clock, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PricingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    const plans = [
        { 
            name: "Free", 
            price: "0", 
            planId: 'PLAN_FREE',
            amount: 0,
            features: [
                { icon: <Check className="w-5 h-5" />, desc: "Daily Blueprint & Routine Manager" },
                { icon: <Check className="w-5 h-5" />, desc: "Manual Task Creation" },
                { icon: <Zap className="w-5 h-5" />, desc: "5 Free AI Credits per month" },
                { icon: <Shield className="w-5 h-5" />, desc: "Standard Email Support" }
            ],
            buttonText: "Get Started Free",
            isHighlighted: false,
        },
        { 
            name: "Pro", 
            price: "99", 
            planId: 'PLAN_PRO_MONTHLY',
            amount: 9900,
            features: [
                { icon: <Star className="w-5 h-5" />, desc: "Everything in Free" },
                { icon: <Sparkles className="w-5 h-5" />, desc: "AI Predictive Scheduling" },
                { icon: <TrendingUp className="w-5 h-5" />, desc: "Advanced Reflection Analytics" },
                { icon: <Clock className="w-5 h-5" />, desc: "Integrated Pomodoro Timer" },
                { icon: <Cpu className="w-5 h-5" />, desc: "50 AI Credits per month" },
            ],
            buttonText: "Start Pro Trial",
            isHighlighted: true,
        },
        { 
            name: "Pro Max", 
            price: "199", 
            planId: 'PLAN_PRO_MAX_MONTHLY',
            amount: 19900,
            features: [
                { icon: <Star className="w-5 h-5" />, desc: "Everything in Pro" },
                { icon: <Users className="w-5 h-5" />, desc: "Group Project Collaboration" },
                { icon: <Shield className="w-5 h-5" />, desc: "Dedicated Accountability Partner" },
                { icon: <Sparkles className="w-5 h-5" />, desc: "Premium Template Library" },
                { icon: <Cpu className="w-5 h-5" />, desc: "Unlimited AI Credits" },
            ],
            buttonText: "Go Pro Max",
            isHighlighted: false,
        },
    ];

    const handleSubscription = async (plan) => {
        if (status !== 'authenticated') {
            toast.error('Please login to subscribe');
            router.push('/auth?mode=login');
            return;
        }

        if (plan.name === 'Free') {
            router.push('/dashboard');
            return;
        }

        setLoadingPlanId(plan.planId);
        const loadingToast = toast.loading(`Preparing ${plan.name} checkout...`);

        try {
            const response = await fetch('/api/checkout/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    planId: plan.planId, 
                    planName: plan.name,
                    amount: plan.amount,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create order');
            }

            const orderData = await response.json();

            if (typeof window.Razorpay === 'undefined') {
                throw new Error('Payment gateway not loaded. Please refresh and try again.');
            }

            toast.dismiss(loadingToast);

            const options = {
                key:   orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: orderData.amount, 
                currency: orderData.currency || 'INR',
                name: 'StudySync Daily',
                description: `${plan.name} Plan Subscription`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    const verifyToast = toast.loading('Verifying payment...');
                    try {
                        const verifyRes = await fetch('/api/checkout/subscription/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: plan.planId,
                                planName: plan.name,
                            }),
                        });

                        const verificationData = await verifyRes.json();
                        toast.dismiss(verifyToast);
                        
                        if (verificationData.success) {
                            toast.success(`🎉 Welcome to ${plan.name}!`);
                            
                            // 🔥 FIX: Force reload to refresh navbar and session
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1500);
                        } else {
                            toast.error('Payment verification failed. Contact support.');
                        }
                    } catch (verifyError) {
                        toast.dismiss(verifyToast);
                        console.error("Verification error:", verifyError);
                        toast.error("Payment verification error. Please contact support.");
                    } finally {
                        setLoadingPlanId(null);
                    }
                },
                modal: {
                    ondismiss: function() {
                        toast.error('Payment cancelled');
                        setLoadingPlanId(null);
                    }
                },
                prefill: {
                    name: session?.user?.name || '',
                    email: session?.user?.email || '',
                },
                theme: {
                    color: '#10b981',
                },
                notes: {
                    planId: plan.planId,
                    userId: session?.user?.id,
                }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();

        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Subscription error:", error);
            toast.error(error.message || 'Failed to start checkout');
            setLoadingPlanId(null);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-16 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span>Simple, Transparent Pricing</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Unlock intelligent planning, AI study tools, and features designed to optimize your academic success.
                </p>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                {plans.map((plan, index) => (
                    <div 
                        key={index}
                        className={`relative rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
                            plan.isHighlighted 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-400' 
                                : 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-xl border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        {plan.isHighlighted && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                                ⭐ Most Popular
                            </div>
                        )}

                        <div className="p-8">
                            <div className="mb-8">
                                <h3 className={`text-2xl font-bold mb-2 ${plan.isHighlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-5xl font-black ${plan.isHighlighted ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        ₹{plan.price}
                                    </span>
                                    {plan.price !== "0" && (
                                        <span className={`text-lg ${plan.isHighlighted ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            /month
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-3">
                                        <span className={`flex-shrink-0 mt-0.5 ${plan.isHighlighted ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {feature.icon}
                                        </span>
                                        <span className={`text-sm ${plan.isHighlighted ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {feature.desc}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscription(plan)}
                                disabled={loadingPlanId === plan.planId || (loadingPlanId !== null && loadingPlanId !== plan.planId)}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    plan.isHighlighted
                                        ? 'bg-white text-emerald-600 hover:bg-gray-50 shadow-lg hover:shadow-xl'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {loadingPlanId === plan.planId ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    plan.buttonText
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="relative z-10 max-w-4xl mx-auto mt-20 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Trusted by thousands of students worldwide</p>
                <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Cancel Anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Money Back Guarantee</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </main>
    );
}