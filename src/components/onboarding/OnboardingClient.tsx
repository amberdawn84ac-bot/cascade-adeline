'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WelcomeFlow } from './WelcomeFlow';
import type { OnboardingData } from './types';

export function OnboardingClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (data: OnboardingData) => {
    setError(null);
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: data.childName,
          gradeLevel: data.gradeLevel,
          interests: data.interests ?? [],
          cognitiveProfile: data.cognitiveProfile ?? null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Failed to save profile');
      }

      router.refresh();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <WelcomeFlow onComplete={handleComplete} />
      {error && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#9A3F4A',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: 12,
          fontFamily: 'Kalam, system-ui',
          fontSize: 14,
          zIndex: 10000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {error}
        </div>
      )}
    </>
  );
}
