import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/OnboardingForm';

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return <OnboardingForm userId={user.userId} userName={user.email?.split('@')[0] || 'Friend'} />;
}
