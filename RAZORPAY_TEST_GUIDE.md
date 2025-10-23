# 🧪 Razorpay Test Guide

## Step 1: Get Your Test Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings → API Keys**
3. Click **Generate Test Keys**
4. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (long string)

## Step 2: Update .env.local

Replace these values in your `.env.local` file:

```env
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_key_secret_here
RAZORPAY_WEBHOOK_SECRET=any_random_string_for_now
```

## Step 3: Test the Payment Flow

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Open:** `http://localhost:3000`

3. **Login and navigate to a creator profile**

4. **Click "Buy me a chai"**

5. **Use Test Payment Details:**
   
   **For Cards:**
   - **Card Number:** `4111 1111 1111 1111`
   - **CVV:** `123`
   - **Expiry:** `12/25`
   - **Name:** `Test User`
   
   **For UPI:**
   - **UPI ID:** `success@razorpay` (for success)
   - **UPI ID:** `failure@razorpay` (for failure test)

## Step 4: Check Results

### ✅ Success Indicators:
- Payment popup closes
- Success message appears
- Payment shows in Razorpay Dashboard → Transactions
- Console shows "Payment verified successfully"

### ❌ If Payment Fails:
- Check browser console for errors
- Verify your API keys are correct
- Ensure .env.local has no extra spaces/quotes

## Test Payment Scenarios

| Test Case | Card/UPI | Expected Result |
|-----------|----------|-----------------|
| Success | `4111 1111 1111 1111` | ✅ Payment succeeds |
| Failure | `4000 0000 0000 0002` | ❌ Payment fails |
| UPI Success | `success@razorpay` | ✅ UPI payment succeeds |
| UPI Failure | `failure@razorpay` | ❌ UPI payment fails |

## Debugging Tips

### Check API Routes:
- **Create Order:** `POST /api/payments/razorpay/create-order`
- **Verify Payment:** `POST /api/payments/razorpay/verify`

### Common Issues:
1. **"Key ID not found"** → Wrong API key
2. **"Payment verification failed"** → Wrong key secret
3. **"Network Error"** → Check localhost:3000 is running

### Console Commands for Testing:
```javascript
// Test create order API
fetch('/api/payments/razorpay/create-order', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    amount: 50,
    to_username: 'testuser',
    name: 'Test Supporter',
    message: 'Test payment'
  })
}).then(r => r.json()).then(console.log);
```

## Next Steps (Optional)

### For Webhook Testing:
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3000`
3. Copy the https URL
4. Add webhook in Razorpay Dashboard:
   - URL: `https://xyz123.ngrok.io/api/payments/razorpay/webhook`
   - Events: `payment.captured`, `payment.failed`

### For Production:
1. Get **Live Keys** from Razorpay Dashboard
2. Complete KYC verification
3. Update environment variables with live keys
4. Change `DOMAIN` to your production URL

---

## 🎯 Quick Test Checklist

- [ ] Updated .env.local with real test keys
- [ ] Started dev server (`npm run dev`)
- [ ] Can access creator profiles
- [ ] Payment popup opens when clicking "Buy chai"
- [ ] Test card `4111 1111 1111 1111` works
- [ ] Success message appears after payment
- [ ] Payment visible in Razorpay Dashboard

If all checkboxes are ✅, your Razorpay integration is working perfectly!