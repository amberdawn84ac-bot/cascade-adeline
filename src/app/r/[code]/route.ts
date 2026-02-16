import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Set referral cookie and redirect to signup
  const response = NextResponse.redirect(
    new URL(`/signup?ref=${code}`, req.url)
  );

  response.cookies.set('referral_code', code, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}
