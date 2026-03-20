import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email/email-service';
import { Prisma } from '@prisma/client';
import { invalidateStudentContext } from '@/lib/learning/student-context';

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gradeLevel, interests, learningStyle } = await req.json();

  // Fetch existing metadata to preserve other fields
  const existing = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { metadata: true },
  });

  const existingMetadata = (existing?.metadata as Record<string, unknown>) ?? {};
  
  // Clear learning plan cache when grade/interests change
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { journeyPlanSnapshot, journeyPlanCachedAt, ...preservedMetadata } = existingMetadata;

  await prisma.user.update({
    where: { id: user.userId },
    data: {
      gradeLevel: gradeLevel || null,
      interests: Array.isArray(interests) ? interests : [],
      ...(learningStyle ? { learningStyle } : {}),
      onboardingComplete: true,
      metadata: preservedMetadata as Prisma.JsonObject, // Clear cache by removing snapshot fields
    },
  });

  invalidateStudentContext(user.userId);
  console.log('[onboarding/PATCH] Settings updated, student context cache busted for user:', user.userId);

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { childName, gradeLevel, interests, cognitiveProfile, learningStyle, state, graduationYear } = await req.json();

  const existing = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { metadata: true },
  });

  const updatedMetadata = {
    ...((existing?.metadata as Record<string, unknown>) ?? {}),
    ...(cognitiveProfile ? { cognitiveProfile } : {}),
    ...(state ? { state } : {}),
    ...(graduationYear ? { graduationYear } : {}),
  };

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: {
      ...(childName ? { name: childName.trim() } : {}),
      gradeLevel: gradeLevel || null,
      interests: Array.isArray(interests) ? interests : [],
      ...(learningStyle ? { learningStyle } : {}),
      onboardingComplete: true,
      metadata: updatedMetadata,
    },
    select: { email: true, name: true, onboardingComplete: true },
  });

  invalidateStudentContext(user.userId);

  if (updated.email && !updated.email.endsWith('@placeholder.local')) {
    sendWelcomeEmail(updated.email, updated.name ?? 'Explorer').catch(err =>
      console.error('[Onboarding] Failed to send welcome email:', err)
    );
  }

  return NextResponse.json({ ok: true });
}

