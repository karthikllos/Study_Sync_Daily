"use client";
import React, { useState } from "react";
import Script from "next/script";
import { toast } from "react-hot-toast";
import { Loader2, CreditCard, Check } from "lucide-react";

export default function CheckoutModal({
  productName,
  productId,
  price, // expected in smallest currency unit (e.g. paise)
  currency = "INR",
  description = "",
  mode = "one_time", // "one_time" | "subscription"
  planType = "monthly", // for subscriptions: "monthly" | "yearly"
  onSuccess = () => {},
  onClose = () => {},
}) {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const handleCreateOrder = async () => {
    if (!productId || !productName) {
      toast.error("Missing product information");
      return;
    }

    if (mode === "one_time" && (!price || Number(price) <= 0)) {
      toast.error("Invalid product price");
      return;
    }

    setLoading(true);
    try {
      let data;

      if (mode === "subscription") {
        const res = await fetch("/api/checkout/subscription/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planType }),
        });
        data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to start subscription");
        }
      } else {
        const res = await fetch("/api/checkout/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            amount: Number(price),
            currency,
          }),
        });
        data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to create order");
        }
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Refresh the page.");
      }

      const options = {
        key: data.key || data.razorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: mode === "one_time" ? data.amount || price : undefined,
        currency: mode === "one_time" ? data.currency || currency : undefined,
        name: productName,
        description:
          description || data.description || (mode === "subscription" ? "StudySync Pro Subscription" : productName),
        order_id: mode === "one_time" ? data.orderId || data.order_id || data.oid : undefined,
        subscription_id: mode === "subscription" ? data.subscriptionId : undefined,
        image: data.image || undefined,
        prefill: data.prefill || {},
        theme: data.theme || { color: "#10b981" },
        handler: async function (response) {
          try {
            setLoading(true);

            if (mode === "one_time") {
              const verifyRes = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  paymentId: data.paymentId || data.payment_id || data.payment,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                toast.error(verifyData?.error || "Verification failed");
                setLoading(false);
                return;
              }
              toast.success("Purchase successful");
              onSuccess(verifyData);
            } else {
              // For subscriptions, Razorpay will trigger webhooks for final status.
              toast.success("Subscription started successfully");
              onSuccess({ subscriptionId: data.subscriptionId, response });
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment verification failed");
          } finally {
            setLoading(false);
            onClose();
            window.dispatchEvent(new Event("payments-updated"));
          }
        },
        modal: {
          ondismiss: function () {
            toast("Payment cancelled");
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        console.error("Payment failed:", resp.error);
        toast.error(resp.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Create order error:", err);
      toast.error(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{productName}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-2xl font-bold">
                {currency === "INR" ? "₹" : ""}{Number(price) / 100}
                <span className="text-sm text-gray-500"> {currency}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Product ID</p>
              <p className="text-sm text-gray-600">{productId}</p>
            </div>
          </div>

          <button
            onClick={handleCreateOrder}
            disabled={loading || !razorpayLoaded}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>Buy {productName}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="mt-3 w-full text-sm text-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}