import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import connectDb from '../../../../../lib/connectDb';
import Payment from '../../../../../models/Payment';
import User from '../../../../../models/user';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, to_username, name, message } = await request.json();

    if (!amount || !to_username || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDb();

    // Find recipient user
    const recipient = await User.findOne({ username: to_username });
    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Convert amount to smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

    // Create payment record
    const payment = await Payment.create({
      name,
      to_user: recipient._id,
      oid: `razorpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: message || '',
      amount: amountInPaise,
      currency: process.env.CURRENCY || 'inr',
      paymentGateway: 'razorpay',
      status: 'pending'
    });

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: (process.env.CURRENCY || 'inr').toUpperCase(),
      receipt: payment.oid,
      notes: {
        paymentId: payment._id.toString(),
        recipientUsername: to_username,
        customerName: name,
        message: message || ''
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update payment with Razorpay order ID
    await Payment.findByIdAndUpdate(payment._id, {
      gatewayOrderId: razorpayOrder.id,
      status: 'processing'
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID,
      name: `StudySync Daily - ${recipient.name || recipient.username}`,
      description: message ? `Message: \"${message}\"` : 'StudySync Daily Purchase',
      image: recipient.profilepic || 'https://via.placeholder.com/300x300?text=StudySync',
      prefill: {
        name: name
      },
      theme: {
        color: '#10b981'
      }
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}