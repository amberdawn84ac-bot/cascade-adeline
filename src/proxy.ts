// src/proxy.ts — renamed from middleware.ts (Next.js 16 convention change)
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PATHS = ['/dashboard', '/parent', '/library', '/api/clubs', '/api/transcript'];

export async function proxy(request: NextRequest) {
  // Generate request ID for distributed tracing
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  let supabaseResponse = NextResponse.next({ request });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookies: any = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      supabaseResponse = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabaseResponse.cookies.set(name, value, options as any)
      );
    },
  };

  // Validate required Supabase env vars - fail fast if misconfigured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Proxy] CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('Supabase configuration missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    { cookies }
  );

  // IMPORTANT: Do not write logic between createServerClient and auth.getUser().
  const { data: { user } } = await supabase.auth.getUser();

  // Add request ID and timing headers for observability
  supabaseResponse.headers.set('x-request-id', requestId);
  supabaseResponse.headers.set('x-edge-ts', Date.now().toString());

  const { pathname } = request.nextUrl;

  // Redirect old subject-specific rooms to unified journey page
  const oldSubjectRooms = ['/dashboard/science', '/dashboard/math', '/dashboard/ela', '/dashboard/history'];
  if (oldSubjectRooms.some(room => pathname.startsWith(room))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard/journey';
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?redirectTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
