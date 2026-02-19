"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

const GRADE_OPTIONS = [
  { value: 'K-2', label: 'Kindergarten – 2nd Grade' },
  { value: '3-5', label: '3th – 5th Grade' },
  { value: '6-8', label: '6th – 8th Grade' },
  { value: '9-12', label: '9th – 12th Grade' },
];

const INTEREST_OPTIONS = [
  'Science', 'Math', 'History', 'Writing', 'Coding', 'Art',
  'Music', 'Gardening', 'Business', 'Animals', 'Building',
];

type Props = { userId: string; userName: string };

export function OnboardingForm({ userName }: Props) {
  const router = useRouter();
  const [gradeLevel, setGradeLevel] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeLevel) { setError('Please select a grade level.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeLevel, interests }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Welcome, {userName}!
          </h1>
          <p className="text-[#BD6809] font-medium">Let&apos;s personalize your learning journey.</p>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#E7DAC3]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-[#2F4731] font-bold mb-3">What grade level?</label>
              <div className="grid grid-cols-2 gap-3">
                {GRADE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGradeLevel(value)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      gradeLevel === value
                        ? 'border-[#BD6809] bg-[#FFF3E7] text-[#BD6809]'
                        : 'border-[#E7DAC3] text-[#2F4731]/70 hover:border-[#BD6809]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#2F4731] font-bold mb-3">What do you love? (pick any)</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                      interests.includes(interest)
                        ? 'border-[#2F4731] bg-[#2F4731] text-white'
                        : 'border-[#E7DAC3] text-[#2F4731]/70 hover:border-[#2F4731]'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2F4731] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#1E2E20] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><span>Start Learning</span><ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
