"use client";

import { useState } from 'react';
import { Loader2, Save, ExternalLink, Tag, FlaskConical, BookOpen, Calculator, Globe, Zap } from 'lucide-react';
import Link from 'next/link';

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const INTEREST_OPTIONS = [
  'Chickens & Poultry', 'Horses', 'Sheep & Wool', 'Goats', 'Rabbits',
  'Gardening', 'Canning & Preservation', 'Greenhouse', 'Soil & Composting',
  'Off-Grid Systems', 'Building & Woodworking', 'Welding & Metalwork',
  'Cooking & Baking', 'Soap & Candle Making', 'Sewing & Textiles',
  'Animals & Zoology', 'Science', 'History', 'Math', 'Art',
  'Music', 'Reading', 'Writing', 'Coding', 'Minecraft',
  'Debate', 'Film Making', 'Nature & Ecology', 'Entrepreneurship',
];

const PACING_OPTIONS = [
  { value: 1.0,  label: 'Standard',   desc: 'Normal grade-level pacing' },
  { value: 1.25, label: 'Accelerated', desc: '25% faster — minor head start' },
  { value: 1.5,  label: 'Fast Track',  desc: '50% faster — early graduation path' },
  { value: 2.0,  label: 'Sprint',      desc: '2× speed — advanced self-directed learners only' },
];

const SUBJECT_CONFIG = [
  { key: 'mathLevel'    as const, label: 'Math',    icon: Calculator, color: 'text-blue-600',   bg: 'bg-blue-50' },
  { key: 'elaLevel'     as const, label: 'ELA / Reading', icon: BookOpen,   color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'scienceLevel' as const, label: 'Science',  icon: FlaskConical, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'historyLevel' as const, label: 'History',  icon: Globe,        color: 'text-amber-600',  bg: 'bg-amber-50' },
];

interface Props {
  user: {
    name?: string;
    email?: string;
    role?: string;
    gradeLevel?: string;
    mathLevel?: number;
    elaLevel?: number;
    scienceLevel?: number;
    historyLevel?: number;
    pacingMultiplier?: number;
    targetGraduationYear?: number;
    interests?: string[];
    learningStyle?: string;
  };
  subscription?: {
    tier: string;
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export function SettingsForm({ user, subscription }: Props) {
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || '');
  const [mathLevel, setMathLevel] = useState<number | null>(user.mathLevel ?? null);
  const [elaLevel, setElaLevel] = useState<number | null>(user.elaLevel ?? null);
  const [scienceLevel, setScienceLevel] = useState<number | null>(user.scienceLevel ?? null);
  const [historyLevel, setHistoryLevel] = useState<number | null>(user.historyLevel ?? null);
  const [pacingMultiplier, setPacingMultiplier] = useState(user.pacingMultiplier ?? 1.0);
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [learningStyle, setLearningStyle] = useState(user.learningStyle || 'EXPEDITION');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');

  const subjectStateMap = {
    mathLevel:    { get: mathLevel,    set: setMathLevel },
    elaLevel:     { get: elaLevel,     set: setElaLevel },
    scienceLevel: { get: scienceLevel, set: setScienceLevel },
    historyLevel: { get: historyLevel, set: setHistoryLevel },
  };
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handlePromoRedeem = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setPromoMessage({ text: `✅ Promo code applied! You now have ${data.tier === 'STUDENT' ? 'Student' : 'Parent'} plan access.`, ok: true });
      setPromoCode('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      setPromoMessage({ text: err instanceof Error ? err.message : 'Invalid code', ok: false });
    } finally {
      setPromoLoading(false);
    }
  };

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
        body: JSON.stringify({
          gradeLevel, interests, learningStyle,
          mathLevel, elaLevel, scienceLevel, historyLevel,
          pacingMultiplier,
        }),
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

  const currentTier = subscription?.tier || 'FREE';
  const isActive = subscription?.status === 'ACTIVE';

  return (
    <div className="space-y-8">
      {/* Subscription & Billing */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F4731]">Subscription & Billing</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#F5EFE0] rounded-xl">
            <div>
              <div className="font-bold text-[#2F4731] text-lg">
                {currentTier === 'FREE' ? 'Free Account' : 
                 currentTier === 'STUDENT' ? 'Student Plan' :
                 currentTier === 'PARENT' ? 'Parent Plan' :
                 currentTier === 'TEACHER' ? 'Teacher Plan' : 'Unknown'}
              </div>
              <div className="text-sm text-[#2F4731]/60 mt-1">
                {currentTier === 'FREE' ? 'Full app access • Enter promo code below for extended plan' :
                 currentTier === 'STUDENT' ? '$2.99/mo • Full access for 1 student' :
                 currentTier === 'PARENT' ? '$9.99/mo • Up to 5 students + parent dashboard' :
                 currentTier === 'TEACHER' ? '$29.99/mo • Up to 40 students + classroom tools' : ''}
              </div>
              {subscription && isActive && (
                <div className="text-xs text-[#2F4731]/50 mt-2">
                  {subscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {currentTier !== 'FREE' && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-[#BD6809] text-[#BD6809] rounded-xl font-bold hover:bg-[#FFF3E7] transition-colors text-sm"
                >
                  Change Plan
                  <ExternalLink size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F4731]">Promo Code</h2>
        <p className="text-sm text-[#2F4731]/60">Have a promo code? Enter it here to unlock your plan.</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={promoCode}
            onChange={e => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className={inputClass + ' flex-1 uppercase tracking-widest font-bold'}
          />
          <button
            onClick={handlePromoRedeem}
            disabled={promoLoading || !promoCode.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[#2F4731] text-white rounded-xl font-bold hover:bg-[#BD6809] transition-colors disabled:opacity-50"
          >
            {promoLoading ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
            Apply
          </button>
        </div>
        {promoMessage && (
          <p className={`text-sm font-semibold ${promoMessage.ok ? 'text-green-700' : 'text-red-600'}`}>
            {promoMessage.text}
          </p>
        )}
      </div>

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
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-3 block">Overall Grade Level <span className="font-normal normal-case">(fallback when subject level not set)</span></label>
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
                {g === 'K' ? 'K' : `${g}`}
              </button>
            ))}
          </div>
        </div>

        {/* Subject-specific grade levels */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Subject-Specific Levels</label>
          <p className="text-xs text-[#2F4731]/50 mb-3">Override the grade level for each subject independently. Leave blank to use the overall grade level above.</p>
          <div className="space-y-4">
            {SUBJECT_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
              const current = subjectStateMap[key].get;
              const setter = subjectStateMap[key].set;
              return (
                <div key={key} className={`p-4 rounded-xl border border-[#E7DAC3] ${bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-sm font-bold ${color}`}>{label}</span>
                    {current !== null && (
                      <span className="ml-auto text-xs text-[#2F4731]/50">
                        Currently: <strong>Grade {current === 0 ? 'K' : current}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setter(null)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        current === null
                          ? 'bg-gray-600 border-gray-600 text-white'
                          : 'border-gray-300 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      Use overall
                    </button>
                    {GRADE_LEVELS.map(g => {
                      const numVal = g === 'K' ? 0 : parseInt(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setter(numVal)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            current === numVal
                              ? 'bg-[#BD6809] border-[#BD6809] text-white'
                              : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#BD6809]'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pacing multiplier */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#BD6809]" />
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50">Learning Pace</label>
          </div>
          <p className="text-xs text-[#2F4731]/50 mb-3">Control how fast Adeline moves through grade-level material. Accelerate for early graduation.</p>
          <div className="grid grid-cols-2 gap-2">
            {PACING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPacingMultiplier(opt.value)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  pacingMultiplier === opt.value
                    ? 'bg-[#BD6809] border-[#BD6809] text-white'
                    : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#BD6809]'
                }`}
              >
                <div className="font-bold text-sm">{opt.label}</div>
                <div className={`text-xs mt-0.5 ${
                  pacingMultiplier === opt.value ? 'text-white/80' : 'text-[#2F4731]/50'
                }`}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-3 block">Learning Mode</label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setLearningStyle('EXPEDITION')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                learningStyle === 'EXPEDITION'
                  ? 'bg-[#BD6809] border-[#BD6809] text-white'
                  : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#BD6809]'
              }`}
            >
              <div className="font-bold mb-1">🗺️ Expedition Mode</div>
              <div className={`text-sm ${
                learningStyle === 'EXPEDITION' ? 'text-white/90' : 'text-[#2F4731]/60'
              }`}>
                Unified, cross-curricular learning adventures. Perfect for project-based learners.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLearningStyle('CLASSIC')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                learningStyle === 'CLASSIC'
                  ? 'bg-[#2F4731] border-[#2F4731] text-white'
                  : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#2F4731]'
              }`}
            >
              <div className="font-bold mb-1">📚 Classic Mode</div>
              <div className={`text-sm ${
                learningStyle === 'CLASSIC' ? 'text-white/90' : 'text-[#2F4731]/60'
              }`}>
                Traditional, siloed subjects with structured lessons and printable worksheets.
              </div>
            </button>
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

