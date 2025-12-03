import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(email, token) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured, skipping email verification');
    return;
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"StudySync Daily" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email - StudySync Daily',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 10px; 
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #3b82f6, #2563eb); 
              padding: 30px; 
              text-align: center; 
            }
            .header h1 { 
              color: white; 
              margin: 0; 
              font-size: 28px;
            }
            .content { 
              padding: 30px; 
            }
            .button { 
              display: inline-block; 
              background: #3b82f6; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              color: #666; 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to StudySync Daily! 📚</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up! Please click the button below to verify your email address and complete your registration.</p>
              
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              
              <p><strong>Or copy and paste this link:</strong></p>
              <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <p><small>This link will expire in 24 hours. If you didn't create an account, please ignore this email.</small></p>
            </div>
            <div class="footer">
              <p>© 2025 StudySync Daily. Made with ❤️ for students.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to StudySync Daily!
      
      Please verify your email address by clicking this link:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `
  };

  await getTransporter().sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email, token, username) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured, skipping password reset email');
    return;
  }

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"StudySync Daily" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Password Reset Request - StudySync Daily',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 10px; 
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #ef4444, #dc2626); 
              padding: 30px; 
              text-align: center; 
            }
            .header h1 { 
              color: white; 
              margin: 0; 
              font-size: 28px;
            }
            .content { 
              padding: 30px; 
            }
            .button { 
              display: inline-block; 
              background: #ef4444; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              color: #666; 
              font-size: 14px;
            }
            .warning {
              background: #fef3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔐</h1>
            </div>
            <div class="content">
              <h2>Hello ${username}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              
              <p><strong>Or copy and paste this link:</strong></p>
              <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will not be changed unless you click the link above</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 StudySync Daily. Stay secure! 🔒</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello ${username}!
      
      We received a request to reset your password. Click this link to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
      Your password will not be changed unless you click the link above.
    `
  };

  await getTransporter().sendMail(mailOptions);
}

export async function sendTaskReminder(toEmail, subject, taskName, dueDate) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping task reminder email");
    return;
  }

  const due = dueDate ? new Date(dueDate) : null;
  const dueStr = due && !isNaN(due) ? due.toLocaleString() : "No due date specified";
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  const mailOptions = {
    from: `"StudySync Daily" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: subject || `Reminder: ${taskName}`,
    html: `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Task Reminder</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; background:#f7fafc; margin:0; padding:20px; }
            .container { max-width:600px; margin:0 auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(15,23,42,0.08); }
            .header { background:linear-gradient(90deg,#10b981,#06b6d4); padding:20px; color:#fff; text-align:center; }
            .content { padding:24px; color:#374151; line-height:1.6; }
            .button { display:inline-block; padding:12px 20px; background:#10b981; color:#fff; border-radius:8px; text-decoration:none; font-weight:600; margin-top:16px; }
            .meta { margin-top:16px; font-size:13px; color:#6b7280; background:#f3f4f6; padding:12px; border-radius:8px; }
            .footer { padding:16px; text-align:center; font-size:12px; color:#9ca3af; background:#f8fafc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>StudySync Daily</h1>
            </div>
            <div class="content">
              <h2>Task Reminder</h2>
              <p>Hi,</p>
              <p>This is a friendly reminder for the following task:</p>
              <p style="font-weight:700; font-size:16px; margin:12px 0;">${taskName}</p>
              <p><strong>Due:</strong> ${dueStr}</p>
              ${appUrl ? `<p style="margin-top:12px;"><a class="button" href="${appUrl}/dashboard">Open Planner</a></p>` : ""}
              <div class="meta">
                <div><strong>Task:</strong> ${taskName}</div>
                <div><strong>Due:</strong> ${dueStr}</div>
              </div>
              <p style="margin-top:12px;">If you've already completed this task, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} StudySync Daily — Plan better, study smarter.
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Task Reminder

Task: ${taskName}
Due: ${dueStr}

Open your planner${appUrl ? `: ${appUrl}/dashboard` : "."}
`,
  };

  await getTransporter().sendMail(mailOptions);
}

export async function sendSubscriptionConfirmation(toEmail, planName, expiryDate) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping subscription confirmation email");
    return;
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const expiryStr = expiry && !isNaN(expiry) ? expiry.toDateString() : "your current billing period";

  const mailOptions = {
    from: `"StudySync Daily" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Welcome to StudySync Pro (${planName || "Pro"})`,
    html: `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Subscription Confirmed</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7fafc; margin:0; padding:24px; color:#111827; }
            .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(15,23,42,0.08); }
            .header { background:linear-gradient(90deg,#10b981,#06b6d4); padding:24px 28px; color:#ecfdf5; }
            .header h1 { margin:0; font-size:24px; }
            .content { padding:24px 28px; line-height:1.6; }
            .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:rgba(16,185,129,0.12); color:#047857; font-size:12px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
            .button { display:inline-block; margin-top:16px; padding:10px 18px; background:#10b981; color:#ffffff; text-decoration:none; border-radius:999px; font-weight:600; font-size:14px; }
            .meta { margin-top:20px; font-size:13px; color:#4b5563; background:#f9fafb; padding:14px 16px; border-radius:12px; }
            .footer { padding:16px 20px; text-align:center; font-size:12px; color:#9ca3af; background:#f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Subscription Active</span>
              <h1>Welcome to StudySync Pro</h1>
              <p style="margin:6px 0 0; font-size:14px; opacity:0.9;">Your study routines now unlock premium AI planning and insights.</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>
                Thank you for subscribing to <strong>StudySync Pro${planName ? ` – ${planName}` : ""}</strong>.
                Your subscription is now active and will remain valid until <strong>${expiryStr}</strong>.
              </p>
              <p>
                You now have access to:
              </p>
              <ul>
                <li>Unlimited AI-generated notes and quiz sessions</li>
                <li>Predictive focus scores and advanced analytics</li>
                <li>Priority access to new productivity features</li>
              </ul>
              ${appUrl ? `<a href="${appUrl}/dashboard" class="button">Open your dashboard</a>` : ""}
              <div class="meta">
                <div><strong>Plan:</strong> ${planName || "StudySync Pro"}</div>
                <div><strong>Renews / ends on:</strong> ${expiryStr}</div>
              </div>
              <p style="margin-top:16px; font-size:13px; color:#6b7280;">If you did not authorize this subscription or have any billing questions, please contact support immediately.</p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} StudySync Daily. Build consistent study momentum.
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to StudySync Pro${planName ? ` - ${planName}` : ""}.

Your subscription is now active and will remain valid until ${expiryStr}.

You now have access to premium AI-powered planning and analytics.

${appUrl ? `Open your dashboard: ${appUrl}/dashboard` : ""}
`,
  };

  await getTransporter().sendMail(mailOptions);
}

export async function sendAccountLockedEmail(toEmail) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping account locked email");
    return;
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  const mailOptions = {
    from: `"StudySync Daily" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: "Your StudySync Daily account has been temporarily locked",
    html: `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Account Locked</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#111827; margin:0; padding:24px; color:#e5e7eb; }
            .container { max-width:640px; margin:0 auto; background:#020617; border-radius:16px; border:1px solid #1f2937; padding:24px 28px; }
            .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:rgba(248,113,113,0.12); color:#fca5a5; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; }
            h1 { margin-top:12px; font-size:22px; color:#f9fafb; }
            p { font-size:14px; line-height:1.7; }
            .button { display:inline-block; margin-top:18px; padding:10px 18px; background:#f97316; color:#111827; text-decoration:none; border-radius:999px; font-weight:600; font-size:14px; }
            .hint { margin-top:16px; font-size:12px; color:#9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="badge">Security notice</span>
            <h1>We temporarily locked your account</h1>
            <p>
              For your protection, your StudySync Daily account has been temporarily locked after multiple unsuccessful sign-in attempts.
            </p>
            <p>
              If this was you, please wait a couple of hours before trying again or reset your password using the <strong>Forgot password</strong> option on the sign-in page.
            </p>
            <p>
              If you don't recognize this activity, we recommend resetting your password immediately and reviewing your recent logins.
            </p>
            ${appUrl ? `<a href="${appUrl}/auth" class="button">Go to sign-in</a>` : ""}
            <p class="hint">This lock is temporary and will automatically lift after a cooldown period.</p>
          </div>
        </body>
      </html>
    `,
    text: `Your StudySync Daily account has been temporarily locked after multiple unsuccessful sign-in attempts.

If this was you, please wait a couple of hours before trying again or use the Forgot password link on the sign-in page to reset your password.

If you don't recognize this activity, reset your password immediately.

${appUrl ? `Sign in: ${appUrl}/auth` : ""}
`,
  };

  await getTransporter().sendMail(mailOptions);
}

export async function sendWeeklyReflectionSummary(toEmail, performanceSummary) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping weekly reflection summary email");
    return;
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const summaryText = typeof performanceSummary === "string" ? performanceSummary : JSON.stringify(performanceSummary, null, 2);

  const mailOptions = {
    from: `"StudySync Daily" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: "Your weekly StudySync reflection summary",
    html: `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Weekly Reflection Summary</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f3f4f6; margin:0; padding:24px; color:#111827; }
            .container { max-width:680px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 10px 30px rgba(15,23,42,0.07); overflow:hidden; }
            .header { padding:22px 26px; background:linear-gradient(135deg,#4f46e5,#6366f1); color:#e0e7ff; }
            .header h1 { margin:0; font-size:22px; }
            .content { padding:22px 26px; line-height:1.7; }
            .summary-box { margin-top:12px; padding:14px 16px; background:#f9fafb; border-radius:12px; font-size:14px; white-space:pre-wrap; }
            .footer { padding:16px 20px; text-align:center; font-size:12px; color:#9ca3af; background:#f9fafb; }
            .button { display:inline-block; margin-top:16px; padding:9px 16px; border-radius:999px; background:#4f46e5; color:#eef2ff; font-size:13px; font-weight:600; text-decoration:none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Weekly Reflection Summary</h1>
              <p style="margin:6px 0 0; font-size:13px; opacity:0.9;">A quick snapshot of how your study week went.</p>
            </div>
            <div class="content">
              <p>Here are your highlights from this week's reflections:</p>
              <div class="summary-box">${summaryText.replace(/`/g, "'")}</div>
              ${appUrl ? `<a href="${appUrl}/dashboard" class="button">Review your planner</a>` : ""}
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} StudySync Daily. Keep building your streak.
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Weekly StudySync reflection summary:

${summaryText}

${appUrl ? `Open your dashboard: ${appUrl}/dashboard` : ""}
`,
  };

  await getTransporter().sendMail(mailOptions);
}
