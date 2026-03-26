'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Zap, BookOpen } from 'lucide-react';

interface StudentProfile {
  name: string;
  gradeLabel: string;
  learningMode: string;
  pace: string;
  paceVariant: 'accelerated' | 'standard' | 'slower';
  totalCreditsEarned: number;
  totalCreditsNeeded: number;
  progressPct: number;
  graduationLabel: string;
}

export function StudentStatusBar() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    fetch('/api/student/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setProfile(data))
      .catch(() => null);
  }, []);

  if (!profile) {
    // Skeleton while loading — same height so layout doesn't jump
    return (
      <div className="w-full mb-6 rounded-xl border border-[#E7DAC3] bg-[#FFFEF7] p-4 animate-pulse">
        <div className="h-3 w-48 bg-[#E7DAC3] rounded mb-3" />
        <div className="h-2 w-full bg-[#E7DAC3] rounded-full mb-2" />
        <div className="h-2 w-32 bg-[#E7DAC3] rounded" />
      </div>
    );
  }

  const isExpedition = profile.learningMode.toLowerCase().includes('expedition');
  const isAccelerated = profile.paceVariant === 'accelerated';

  return (
    <div className="w-full mb-6 rounded-xl border border-[#E7DAC3] bg-[#FFFEF7] overflow-hidden shadow-sm">
      {/* Top row: grade · mode · pace */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-3 border-b border-[#E7DAC3]">
        {/* Grade badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold">
          <BookOpen className="w-3 h-3" />
          {profile.gradeLabel}
        </span>

        {/* Learning mode badge */}
        <span className={[
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
          isExpedition
            ? 'bg-[#BD6809]/10 text-[#BD6809]'
            : 'bg-[#9A3F4A]/10 text-[#9A3F4A]',
        ].join(' ')}>
          {isExpedition ? '🧭' : '📚'} {profile.learningMode}
        </span>

        {/* Pace badge — highlighted when accelerated */}
        <span className={[
          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold',
          isAccelerated
            ? 'bg-[#BD6809] text-white'
            : 'bg-[#E7DAC3] text-[#2F4731]',
        ].join(' ')}>
          {isAccelerated && <Zap className="w-3 h-3" />}
          {profile.pace}
        </span>

        {/* Graduation date — pushed right */}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-[#2F4731]/60">
          <GraduationCap className="w-3.5 h-3.5" />
          Expected graduation: <strong className="text-[#2F4731]">{profile.graduationLabel}</strong>
        </span>
      </div>

      {/* Progress bar row */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#2F4731]/70 font-medium">Progress toward graduation</span>
          <span className="text-xs font-bold text-[#BD6809]">
            {profile.totalCreditsEarned} / {profile.totalCreditsNeeded} credits &nbsp;·&nbsp; {profile.progressPct}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-[#E7DAC3] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${profile.progressPct}%`,
              background: 'linear-gradient(90deg, #2F4731, #BD6809)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
