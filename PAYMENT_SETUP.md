# Payment Integration Setup Guide

This guide will help you integrate **Stripe** and **Razorpay** payment gateways into your "Buy Me A Chai" application.

## 🚀 Quick Start

### 1. Environment Setup

Update your `.env.local` file with the following credentials:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_key_secret
RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret

# Payment Configuration
DOMAIN=http://localhost:3001
CURRENCY=inr
```

### 2. Get API Keys

#### **For Stripe** (International Payments)
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or login
3. Go to **Developers > API keys**
4. Copy **Publishable key** and **Secret key** (use test keys for development)
5. For webhooks: Go to **Developers > Webhooks > Add endpoint**
   - Endpoint URL: `https://yourdomain.com/api/payments/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

#### **For Razorpay** (Best for Indian Market)
1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create an account and complete KYC
3. Go to **Settings > API Keys**
4. Generate and copy **Key ID** and **Key Secret** (use test mode for development)
5. For webhooks: Go to **Settings > Webhooks > Add New Webhook**
   - Webhook URL: `https://yourdomain.com/api/payments/razorpay/webhook`
   - Events: Select payment-related events

## 📁 File Structure

The payment integration includes these new files:

```
app/
├── api/
│   └── payments/
│       ├── stripe/
│       │   ├── checkout/route.js     # Stripe checkout session
│       │   └── webhook/route.js      # Stripe webhook handler
│       └── razorpay/
│           ├── create-order/route.js # Razorpay order creation
│           └── verify/route.js       # Razorpay payment verification
components/
└── PaymentForm.js                   # Payment form component
models/
└── Payment.js                       # Enhanced payment model
```

## 🔧 Integration Steps

### 3. Replace Old Payment Form

Find where you currently show the payment form (likely in a user profile page) and replace it with:

```jsx
import PaymentForm from '../components/PaymentForm';

// In your component
<PaymentForm 
  username={user.username} 
  recipientName={user.name} 
/>
```

### 4. Update Payment Display

Update your payment display components to use the new payment fields:

```jsx
// Show payment status
<div className={`status-badge ${payment.status}`}>
  {payment.status === 'succeeded' ? '✅ Completed' : 
   payment.status === 'pending' ? '⏳ Pending' : 
   payment.status === 'failed' ? '❌ Failed' : payment.status}
</div>

// Show amount with currency
<div>
  ₹{(payment.amount / 100).toFixed(2)} {/* Convert from paise to rupees */}
</div>
```

### 5. Set Up Webhooks (Production)

#### Stripe Webhooks
1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/stripe/webhook`
3. Select events: 
   - `checkout.session.completed`
   - `payment_intent.succeeded` 
   - `payment_intent.payment_failed`
   - `checkout.session.expired`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Razorpay Webhooks (Optional)
1. In Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/razorpay/webhook`
3. Select relevant events
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

## 💳 Payment Flow

### Stripe Flow
1. User fills payment form
2. Frontend calls `/api/payments/stripe/checkout`
3. Redirects to Stripe Checkout page
4. User completes payment
5. Stripe sends webhook to `/api/payments/stripe/webhook`
6. Database updated automatically
7. User redirected back to your site

### Razorpay Flow  
1. User fills payment form
2. Frontend calls `/api/payments/razorpay/create-order`
3. Razorpay modal opens on your site
4. User completes payment
5. Frontend calls `/api/payments/razorpay/verify`
6. Database updated
7. Success message shown

## 🧪 Testing

### Test Cards

#### Stripe Test Cards
- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

#### Razorpay Test Cards
- **Success:** `5555 5555 5555 4444`
- **Failure:** `4000 0000 0000 0002`
- **CVV:** `123`
- **Expiry:** Any future date

### Test UPI (Razorpay)
- **Success:** `success@razorpay`
- **Failure:** `failure@razorpay`

## 🔒 Security Features

- **Payment verification** using cryptographic signatures
- **Webhook signature verification** to prevent fraud
- **Amount validation** on server-side
- **Secure API key handling** via environment variables
- **PCI DSS compliance** through payment gateway providers

## 📱 Supported Payment Methods

### Stripe
- ✅ Credit/Debit Cards
- ✅ International payments
- ✅ Strong 3D Secure authentication

### Razorpay  
- ✅ Credit/Debit Cards
- ✅ UPI (Google Pay, PhonePe, etc.)
- ✅ Net Banking
- ✅ Wallets (Paytm, FreeCharge, etc.)
- ✅ EMI options

## 🌍 Going Live

### For Production:

1. **Switch to live API keys** in both Stripe and Razorpay dashboards
2. **Update environment variables** with live keys
3. **Set up live webhooks** pointing to your production domain
4. **Test thoroughly** with real small amounts
5. **Enable KYC and business verification** (required for live payments)

### Domain Configuration:
```env
# Production
DOMAIN=https://yourproductiondomain.com
```

## 🎯 Features

### ✅ What's Included
- **Dual payment gateway support** (Stripe + Razorpay)
- **Responsive payment form** with method selection
- **Real-time payment status** tracking
- **Webhook handling** for automatic updates
- **Payment verification** and security
- **Success/failure handling** with user feedback
- **Mobile-optimized** payment flows

### 🚧 Optional Enhancements
- **Email notifications** on payment success
- **Payment receipts** generation
- **Refund handling** APIs
- **Subscription payments** for recurring support
- **Analytics dashboard** for payment insights

## 🆘 Troubleshooting

### Common Issues:

1. **"Invalid API key"** - Check environment variables are loaded correctly
2. **Webhook not working** - Verify webhook URL is accessible and using HTTPS in production
3. **Payment stuck in pending** - Check webhook events are properly configured
4. **Razorpay signature mismatch** - Ensure webhook secret is correct
5. **Stripe redirect fails** - Verify `DOMAIN` environment variable is correct

### Debug Tips:
- Check server console for detailed error logs
- Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3001/api/payments/stripe/webhook`
- Test with small amounts first (₹1-10)
- Verify all environment variables are set correctly

## 🎉 You're Ready!

Your "Buy Me A Chai" app now supports real payments! Users can support creators using:
- **Cards** (via Stripe/Razorpay)  
- **UPI** (via Razorpay)
- **Wallets** (via Razorpay)
- **Net Banking** (via Razorpay)

The payment system is secure, reliable, and ready for production use! 🚀☕