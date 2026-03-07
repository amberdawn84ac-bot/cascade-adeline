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
  try {
    const body = (await req.json()) as CreateUserBody;
    const { userId, name, role } = body;

    if (!userId || !name || !role || !(role in ROLE_MAP)) {
      return NextResponse.json({ error: 'Missing or invalid fields: userId, name, role required' }, { status: 400 });
    }

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError.message 
      }, { status: 503 });
    }

    // Idempotent: return existing user if already provisioned
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // Fallback to a safe placeholder email if we can't fetch it from auth
    const safeEmail = `${userId}@placeholder.local`;
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: safeEmail, // The auto-heal in auth.ts will eventually overwrite this with the real email upon first login
        name: name.trim(),
        role: ROLE_MAP[role],
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error provisioning user:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json({ 
      error: 'Failed to provision user',
      details: error.message || 'Unknown error',
      code: error.code
    }, { status: 500 });
  }
}
