"use client";

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const INTEREST_OPTIONS = ['Science', 'Math', 'Reading', 'Writing', 'History', 'Art', 'Music', 'Coding', 'Nature', 'Business', 'Sports', 'Cooking'];

interface Props {
  user: { name?: string; email?: string; role?: string; gradeLevel?: string; interests?: string[] };
}

export function SettingsForm({ user }: Props) {
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || '');
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeLevel, interests }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage('Settings saved!');
    } catch {
      setMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5]";

  return (
    <div className="space-y-8">
      {/* Read-only info */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F4731]">Account Info</h2>
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Name</label>
            <div className={inputClass + " text-[#2F4731]/70 cursor-not-allowed"}>{user.name || '—'}</div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Email</label>
            <div className={inputClass + " text-[#2F4731]/70 cursor-not-allowed"}>{user.email || '—'}</div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Role</label>
            <div className={inputClass + " text-[#2F4731]/70 cursor-not-allowed capitalize"}>{user.role?.toLowerCase() || '—'}</div>
          </div>
        </div>
      </div>

      {/* Editable preferences */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 space-y-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F4731]">Learning Preferences</h2>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-3 block">Grade Level</label>
          <div className="flex flex-wrap gap-2">
            {GRADE_LEVELS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeLevel(g)}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  gradeLevel === g
                    ? 'bg-[#BD6809] border-[#BD6809] text-white'
                    : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#BD6809]'
                }`}
              >
                {g === 'K' ? 'Kindergarten' : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-3 block">Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                  interests.includes(interest)
                    ? 'bg-[#2F4731] border-[#2F4731] text-white'
                    : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#2F4731]'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className={`text-sm font-bold text-center p-2 rounded-lg ${message.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#2F4731] text-white rounded-xl font-bold hover:bg-[#1E2E20] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
