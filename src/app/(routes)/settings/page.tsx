import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/SettingsForm';
import prisma from '@/lib/db';

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  // Fetch full user data from Prisma
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      name: true,
      email: true,
      role: true,
      gradeLevel: true,
      mathLevel: true,
      elaLevel: true,
      scienceLevel: true,
      historyLevel: true,
      pacingMultiplier: true,
      targetGraduationYear: true,
      interests: true,
      learningStyle: true,
    },
  });

  // Fetch subscription data
  const subscription = await prisma.subscription.findUnique({
    where: { userId: sessionUser.userId },
    select: {
      tier: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!user) redirect('/login');

  // Transform user to match SettingsForm props
  const userProps = {
    name: user.name || undefined,
    email: user.email || undefined,
    role: user.role || undefined,
    gradeLevel: user.gradeLevel || undefined,
    mathLevel: user.mathLevel ?? undefined,
    elaLevel: user.elaLevel ?? undefined,
    scienceLevel: user.scienceLevel ?? undefined,
    historyLevel: user.historyLevel ?? undefined,
    pacingMultiplier: user.pacingMultiplier ?? 1.0,
    targetGraduationYear: user.targetGraduationYear ?? undefined,
    interests: user.interests || undefined,
    learningStyle: user.learningStyle || 'EXPEDITION',
  };

  const subscriptionProps = subscription ? {
    tier: subscription.tier,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  } : null;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Settings
        </h1>
        <p className="text-[#2F4731]/60 mt-2">Manage your profile and preferences.</p>
      </header>
      <SettingsForm user={userProps} subscription={subscriptionProps} />
    </div>
  );
}

