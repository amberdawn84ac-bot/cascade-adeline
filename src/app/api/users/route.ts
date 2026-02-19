// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

type CreateUserBody = {
  userId: string;
  name: string;
  role: 'student' | 'parent' | 'teacher';
};

const ROLE_MAP = {
  student: 'STUDENT',
  parent: 'PARENT',
  teacher: 'TEACHER',
} as const;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateUserBody;
  const { userId, name, role } = body;

  if (!userId || !name || !role || !(role in ROLE_MAP)) {
    return NextResponse.json({ error: 'Missing or invalid fields: userId, name, role required' }, { status: 400 });
  }

  // Verify the Supabase auth user actually exists using service role key
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: authData, error: authError } = await adminSupabase.auth.admin.getUserById(userId);
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Supabase user not found' }, { status: 400 });
  }

  // Idempotent: return existing user if already provisioned
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: authData.user.email!,
      name: name.trim(),
      role: ROLE_MAP[role],
    },
  });

  return NextResponse.json(user, { status: 201 });
}
