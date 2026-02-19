import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Settings
        </h1>
        <p className="text-[#2F4731]/60 mt-2">Manage your profile and preferences.</p>
      </header>
      <SettingsForm user={user} />
    </div>
  );
}
