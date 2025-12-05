import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
      planName,
    } = body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    }
  );
}