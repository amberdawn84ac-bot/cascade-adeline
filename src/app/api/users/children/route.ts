import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { createServerClient } from '@supabase/ssr';

const SEAT_LIMITS: Record<string, number> = {
  PARENT: 6,
  TEACHER: 40,
};

/**
 * GET /api/users/children
 * Returns the list of students linked to the current parent/teacher.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!SEAT_LIMITS[user.role]) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const children = await prisma.user.findMany({
    where: { parentId: user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      gradeLevel: true,
      interests: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    children,
    count: children.length,
    limit: SEAT_LIMITS[user.role],
    slotsRemaining: SEAT_LIMITS[user.role] - children.length,
  });
}

/**
 * POST /api/users/children
 * Creates a new student account linked to the current parent/teacher.
 *
 * Body: { name: string; email: string; gradeLevel?: string; password: string }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = SEAT_LIMITS[user.role];
  if (!limit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, gradeLevel, password } = await req.json().catch(() => ({}));

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 });
  }

  // Enforce seat limit
  const currentCount = await prisma.user.count({ where: { parentId: user.userId } });
  if (currentCount >= limit) {
    return NextResponse.json(
      { error: `Seat limit reached. ${user.role === 'TEACHER' ? 'Teachers' : 'Parents'} can manage up to ${limit} students.` },
      { status: 403 }
    );
  }

  // Create Supabase auth user for the student
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation for parent-created accounts
  });

  if (authError || !authData.user) {
    console.error('[Children] Supabase auth create failed:', authError?.message);
    return NextResponse.json({ error: authError?.message ?? 'Failed to create auth account' }, { status: 400 });
  }

  // Provision the Prisma user record, linked to this parent/teacher
  const student = await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      name: name.trim(),
      role: 'STUDENT',
      parentId: user.userId,
      ...(gradeLevel ? { gradeLevel } : {}),
    },
  });

  return NextResponse.json(student, { status: 201 });
}
