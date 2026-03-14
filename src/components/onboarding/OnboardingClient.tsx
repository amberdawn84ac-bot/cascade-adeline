'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WelcomeFlow } from './WelcomeFlow';
import type { OnboardingData } from './types';

export function OnboardingClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleComplete = async (data: OnboardingData) => {
    setError(null);
    setGenerating(true);
    try {
      // Step 1: Save student profile
      const res = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: data.childName,
          gradeLevel: data.gradeLevel,
          interests: data.interests ?? [],
          cognitiveProfile: data.cognitiveProfile ?? null,
          learningStyle: data.learningStyle ?? null,
          state: data.state ?? null,
          graduationYear: data.graduationYear ?? null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Failed to save profile');
      }

      // Step 2: Generate personalized learning plan if state + graduation year were provided
      if (data.state && data.graduationYear) {
        const planRes = await fetch('/api/learning-plan/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: data.state,
            graduationYear: data.graduationYear,
          }),
        });
        // Non-fatal: plan generation failure shouldn't block onboarding
        if (!planRes.ok) {
          console.warn('[Onboarding] Learning plan generation failed — will retry on first journey visit');
        }
      }

      router.refresh();
      router.push('/dashboard');
    } catch (err: unknown) {
      setGenerating(false);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (generating) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(47,71,49,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, gap: 24,
      }}>
        <div style={{ fontSize: 64 }}>🌿</div>
        <h2 style={{ fontFamily: '"Emilys Candy", cursive', color: '#FFF', fontSize: '2rem', margin: 0 }}>
          Building Your Learning Path
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Kalam, system-ui', fontSize: '1.1rem', textAlign: 'center', maxWidth: 400 }}>
          Adeline is mapping your graduation journey to your interests. This takes about 30 seconds...
        </p>
        <div style={{ width: 48, height: 48, border: '4px solid rgba(189,104,9,0.3)', borderTop: '4px solid #BD6809', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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

