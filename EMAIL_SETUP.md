# Email Configuration Setup

To enable email verification and password reset functionality, you need to configure SMTP settings.

## Gmail Setup (Recommended)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
3. **Add to `.env.local`**:

```env
# SMTP Configuration for Gmail
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password

# Required for email verification links
NEXTAUTH_URL=http://localhost:3000
```

## Alternative SMTP Providers

### SendGrid
```env
SMTP_EMAIL=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_EMAIL=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-smtp-password
```

## Testing Email Functionality

1. **Start your development server**: `npm run dev`
2. **Create a new account** with your real email
3. **Check your inbox** for verification email
4. **Test "Forgot Password"** feature

## Email Features Included

✅ **Email Verification**: New users receive verification emails
✅ **Password Reset**: Secure password reset via email
✅ **Resend Verification**: Users can request new verification emails
✅ **Professional Templates**: HTML emails with your branding
✅ **Security**: Tokens expire after 1-24 hours
✅ **Graceful Fallbacks**: App works even without SMTP configured

## Troubleshooting

**Emails not sending?**
- Check `.env.local` file exists and has correct credentials
- Verify Gmail App Password (not regular password)
- Check spam folder
- Look at console logs for error messages

**"Authentication failed" error?**
- Make sure 2-Step Verification is enabled
- Use App Password, not regular Gmail password
- Double-check email address spelling

## Production Deployment

For production, consider using:
- **SendGrid** (recommended for high volume)
- **Mailgun** (good reliability)
- **AWS SES** (cost-effective)
- **Postmark** (excellent deliverability)

Update your production environment variables accordingly.