"use client";
import React, { useState } from "react";
import Script from "next/script";
import { toast } from "react-hot-toast";
import { Smartphone, Loader2, Coffee, Heart, Sparkles, Shield } from "lucide-react";

export default function PaymentForm({ username, recipientName }) {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    amount: 50
  });
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const predefinedAmounts = [25, 50, 100, 250, 500];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (formData.amount < 1) {
      toast.error("Amount must be at least ₹1");
      return false;
    }
    return true;
  };

  const handleRazorpayPayment = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting payment process...');

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }
      console.log('✅ Razorpay SDK loaded');

      console.log('📤 Sending order request:', {
        amount: formData.amount,
        to_username: username,
        name: formData.name
      });

      const response = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formData.amount,
          to_username: username,
          name: formData.name,
          message: formData.message
        })
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      console.log('💳 Opening Razorpay checkout...');
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        image: data.image,
        order_id: data.orderId,
        prefill: data.prefill,
        theme: data.theme,
        handler: async function (response) {
          try {
            console.log('✅ Payment completed, verifying...');
            setLoading(true);
            const verifyResponse = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: data.paymentId
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              console.log('🎉 Payment verified successfully!');
              toast.success("🎉 Payment successful! Thank you for your support!");
              setFormData({ name: "", message: "", amount: 50 });
              window.dispatchEvent(new Event('payments-updated'));
            } else {
              console.error('❌ Verification failed:', verifyData);
              toast.error(verifyData.error || "Payment verification failed");
            }
            setLoading(false);
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            toast.error("Payment verification failed");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ Payment modal dismissed');
            toast.error("Payment cancelled");
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        console.error('❌ Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
      console.log('✅ Razorpay popup opened');
      
    } catch (error) {
      console.error('❌ Razorpay payment error:', error);
      toast.error(error.message || 'Payment failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    await handleRazorpayPayment();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="relative">
        {/* Decorative background elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="relative bg-gradient-to-br from-white/90 via-white/95 to-white/90 dark:from-gray-800/90 dark:via-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Header with floating animation */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center mb-4 animate-bounce-slow">
              <div className="relative">
                <Coffee className="h-12 w-12 text-emerald-500 animate-wiggle" />
                <Sparkles className="h-5 w-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2 animate-fade-in">
              Support {recipientName || username}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              Buy them a chai and show your appreciation! 
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field with enhanced styling */}
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <span>Your Name</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3.5 bg-white/70 dark:bg-gray-700/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                    focusedField === 'name'
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                  placeholder="Enter your name"
                  required
                />
                {focusedField === 'name' && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none"></div>
                )}
              </div>
            </div>

            {/* Amount Selection with modern card design */}
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span>Amount (₹)</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {predefinedAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleInputChange('amount', amount)}
                    className={`relative py-3 px-3 rounded-xl font-bold transition-all duration-300 transform ${
                      formData.amount === amount
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-110 -translate-y-1"
                        : "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md hover:scale-105 hover:-translate-y-0.5"
                    }`}
                  >
                    ₹{amount}
                    {formData.amount === amount && (
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping"></div>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                  onFocus={() => setFocusedField('amount')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3.5 bg-white/70 dark:bg-gray-700/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                    focusedField === 'amount'
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                  placeholder="Enter custom amount"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Message Field with character counter */}
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <span>Message</span>
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3.5 bg-white/70 dark:bg-gray-700/70 border-2 rounded-xl focus:outline-none transition-all duration-300 resize-none ${
                    focusedField === 'message'
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                  placeholder="Say something nice..."
                  rows={3}
                  maxLength={200}
                />
                <div className={`absolute bottom-3 right-3 text-xs font-medium transition-colors ${
                  formData.message.length > 180 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {formData.message.length}/200
                </div>
              </div>
            </div>

            {/* Submit Button with premium styling */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-xl overflow-hidden group"
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5 animate-pulse" />
                    <span>Support with ₹{formData.amount}</span>
                    <Coffee className="h-5 w-5" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Payment Method Info with enhanced design */}
          <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Secure Payment via Razorpay
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Supports UPI, Cards, Net Banking, and Wallets. Your payment information is encrypted and secure.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}