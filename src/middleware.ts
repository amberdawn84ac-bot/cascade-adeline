import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/parent', '/api/clubs', '/api/transcript'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Supabase sets auth cookies; we check for presence as a lightweight gate.
  const hasSession = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/parent/:path*', '/api/clubs/:path*', '/api/transcript/:path*'],
};
