# Razorpay Setup Guide

Your app now uses **only Razorpay** for payments! Here's how to set it up:

## 1. Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a new account
3. Complete the verification process

## 2. Get API Keys

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Keys** (for development)
4. Copy the **Key ID** and **Key Secret**

## 3. Update Environment Variables

Open your `.env.local` file and update:

```env
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret_here
```

## 4. Test Payment Flow

1. Start your development server: `npm run dev`
2. Go to any creator profile page
3. Click "Buy me a chai"
4. Fill in the form and test payment

## 5. For Production

1. **Activate your account**: Complete KYC verification
2. **Get Live Keys**: Generate live API keys
3. **Update environment variables** with live keys
4. **Set up webhooks** (optional for payment confirmations)

## Payment Features

✅ **UPI Payments** - PhonePe, Google Pay, Paytm, etc.  
✅ **Credit/Debit Cards** - Visa, MasterCard, RuPay  
✅ **Net Banking** - All major banks  
✅ **Digital Wallets** - Paytm, MobiKwik, etc.  
✅ **EMI Options** - For eligible cards  

## Test Cards (Development)

- **Visa**: 4111 1111 1111 1111
- **MasterCard**: 5555 5555 5555 4444
- **Any CVV**: 123
- **Any future date**: 12/25

## Support

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Integration Guide](https://razorpay.com/docs/payments/)