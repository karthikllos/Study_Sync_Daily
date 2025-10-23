import Razorpay from 'razorpay';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDb from '../../../../../lib/connectDb';
import Payment from '../../../../../models/Payment';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentId } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !paymentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDb();

    // Find the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify the payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      // Payment verification failed
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'failed',
        done: false,
        errorMessage: 'Payment verification failed'
      });

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Payment verification successful
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'succeeded',
      done: true,
      gatewayPaymentId: razorpay_payment_id,
      completedAt: new Date(),
      metadata: new Map(Object.entries({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      }))
    });

    console.log('Payment verified successfully:', paymentId);

    // Trigger any post-payment actions (emails, notifications, etc.)
    // await sendThankYouEmail(payment);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: paymentId
    });

  } catch (error) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}