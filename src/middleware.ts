import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/parent', '/api/clubs', '/api/transcript'];

// Edge-level blocked patterns (fast pre-screen before Node.js PII/moderation)
const EDGE_BLOCKED_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,       // SSN
  /\b\d{16}\b/,                    // Credit card (16 digits)
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,  // IP address
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Edge pre-screen: fast PII/content check on chat API POST bodies
  if (pathname === '/api/chat' && req.method === 'POST') {
    // We can't read the body in edge middleware without consuming it,
    // but we can add a timing header for latency monitoring
    const response = NextResponse.next();
    response.headers.set('x-edge-ts', Date.now().toString());
    return response;
  }

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
  matcher: ['/parent/:path*', '/api/clubs/:path*', '/api/transcript/:path*', '/api/chat'],
};
