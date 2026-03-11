import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingClient } from '@/components/onboarding/OnboardingClient';
import prisma from '@/lib/db';

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const userRecord = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { gradeLevel: true },
  });

  if (!userRecord) redirect('/login');

  // Invisible bounce: existing users already have gradeLevel, skip straight to dashboard
  if (userRecord.gradeLevel) redirect('/dashboard');

  // New user: show the WelcomeFlow modal experience
  return <OnboardingClient />;
}

