import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email/email-service';

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gradeLevel, interests } = await req.json();

  await prisma.user.update({
    where: { id: user.userId },
    data: {
      gradeLevel: gradeLevel || null,
      interests: Array.isArray(interests) ? interests : [],
    },
  });

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { childName, gradeLevel, interests, cognitiveProfile, learningStyle } = await req.json();

  const existing = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { metadata: true },
  });

  const updatedMetadata = {
    ...((existing?.metadata as Record<string, unknown>) ?? {}),
    ...(cognitiveProfile ? { cognitiveProfile } : {}),
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

  if (updated.email && !updated.email.endsWith('@placeholder.local')) {
    sendWelcomeEmail(updated.email, updated.name ?? 'Explorer').catch(err =>
      console.error('[Onboarding] Failed to send welcome email:', err)
    );
  }

  return NextResponse.json({ ok: true });
}

