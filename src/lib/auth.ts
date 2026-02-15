import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import prisma from './db';

export type SessionUser = { userId: string; role: string; email: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-op setters for server-only reads; Supabase requires these functions.
        set() {},
        remove() {},
      },
      headers,
    },
  );

  const { data } = await supabase.auth.getUser();
  const supaUser = data.user;
  if (!supaUser) return null;

  const user = await prisma.user.findUnique({ where: { id: supaUser.id }, select: { role: true, email: true, id: true } });
  if (!user) return null;
  return { userId: user.id, role: user.role, email: user.email };
}
