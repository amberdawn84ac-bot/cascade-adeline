import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Adeline <hello@dear-adeline.com>';

/**
 * Send MFA setup confirmation email with the user's backup codes.
 */
export async function sendMFASetupEmail(
  toEmail: string,
  backupCodes: string[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping MFA setup email');
    return;
  }

  const codesHtml = backupCodes
    .map(c => `<code style="display:block;font-family:monospace;font-size:14px;letter-spacing:2px;padding:4px 0;">${c}</code>`)
    .join('');

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: '🔐 Your Dear Adeline MFA Backup Codes',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FFFEF7;border-radius:16px;">
        <h1 style="color:#2F4731;font-size:24px;margin-bottom:8px;">Two-Factor Authentication Enabled</h1>
        <p style="color:#4a6155;font-size:15px;">Your account is now protected with two-factor authentication. Store these backup codes somewhere safe — each can be used once if you lose access to your authenticator app.</p>
        <div style="background:#f0f7f0;border:2px solid #c8e6c9;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="color:#2F4731;font-weight:bold;margin-bottom:12px;">Your Backup Codes:</p>
          ${codesHtml}
        </div>
        <p style="color:#888;font-size:13px;">If you did not enable two-factor authentication, please contact support immediately.</p>
        <p style="color:#2F4731;font-size:14px;margin-top:24px;">— The Dear Adeline Team 🌿</p>
      </div>
    `,
  });
}

/**
 * Send password reset email (custom flow, separate from Supabase's built-in reset).
 * Use this when you want a branded reset email outside of Supabase templates.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping password reset email');
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: '🔑 Reset Your Dear Adeline Password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FFFEF7;border-radius:16px;">
        <h1 style="color:#2F4731;font-size:24px;margin-bottom:8px;">Password Reset Request</h1>
        <p style="color:#4a6155;font-size:15px;">We received a request to reset the password for your Dear Adeline account. Click the button below to choose a new password.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetLink}" style="background:#BD6809;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">Reset My Password</a>
        </div>
        <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color:#2F4731;font-size:14px;margin-top:24px;">— The Dear Adeline Team 🌿</p>
      </div>
    `,
  });
}

/**
 * Send a welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  displayName: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping welcome email');
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `🌿 Welcome to Dear Adeline, ${displayName}!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FFFEF7;border-radius:16px;">
        <h1 style="color:#2F4731;font-size:26px;margin-bottom:8px;">Welcome, ${displayName}! 🌿</h1>
        <p style="color:#4a6155;font-size:15px;line-height:1.6;">Adeline is so glad you're here. Your personalized learning journey is ready — complete your placement assessment to help Adeline tailor lessons just for you.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dear-adeline.com'}/dashboard" style="background:#2F4731;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:bold;display:inline-block;">Start Learning →</a>
        </div>
        <p style="color:#2F4731;font-size:14px;margin-top:24px;">— Adeline 🌸</p>
      </div>
    `,
  });
}
