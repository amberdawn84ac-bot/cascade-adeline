import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import prisma from '@/lib/db';

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  
  // Get user role from database
  const userRecord = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true }
  });
  
  if (!userRecord) redirect('/login');
  
  return <OnboardingForm userId={user.userId} userName={user.email?.split('@')[0] || 'Friend'} userRole={userRecord.role as 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN'} />;
}
