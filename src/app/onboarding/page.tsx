import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingClient } from '@/components/onboarding/OnboardingClient';
import prisma from '@/lib/db';

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const userRecord = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { onboardingComplete: true },
  });

  if (!userRecord) redirect('/login');

  // Skip onboarding for users who have already completed it
  if (userRecord.onboardingComplete) redirect('/dashboard');

  // New user: show the WelcomeFlow modal experience
  return <OnboardingClient />;
}

