import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendPasswordResetEmail } from '@/lib/email/email-service';
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  return withRateLimit(req, RATE_LIMITS.AUTH, async () => {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dear-adeline.com'}/reset-password`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: resetUrl },
  });

  if (error || !data?.properties?.action_link) {
    console.error('[ForgotPassword] generateLink error:', error?.message);
    // Return 200 regardless to prevent email enumeration
    return NextResponse.json({ ok: true });
  }

  await sendPasswordResetEmail(email, data.properties.action_link).catch(err =>
    console.error('[ForgotPassword] email send failed:', err)
  );

  return NextResponse.json({ ok: true });
  });
}
