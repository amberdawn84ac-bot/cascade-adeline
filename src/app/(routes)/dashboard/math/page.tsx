'use client';

import { useState, useEffect } from 'react';
import { Ruler, DollarSign, BarChart2, Loader2, ChevronRight, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// ── Grade tier helpers ─────────────────────────────────────────────────────
function getGradeTier(gradeLevel: string | null): 'elementary' | 'middle' | 'high' {
  if (!gradeLevel) return 'middle';
  const g = gradeLevel.trim().toUpperCase();
  if (g === 'K' || ['1','2','3','4','5'].includes(g)) return 'elementary';
  if (['6','7','8'].includes(g)) return 'middle';
  return 'high';
}

// ── Tier-based content config ─────────────────────────────────────────────
const TIER_CONFIG = {
  elementary: {
    label: 'Farm & Home Math',
    tagline: 'Count, measure, and share — math that happens every day on the homestead.',
    geometry: {
      title: 'Garden Shapes',
      badge: 'Measurement',
      badgeColor: 'bg-amber-500',
      description: 'Measure garden beds, count fence posts, and figure out how much space you have.',
      examples: [
        'My garden bed is 4 feet wide and 6 feet long. What is its area?',
        'I need to fence a chicken pen that is 8 feet on each side. How much fencing do I need?',
        'My round water trough has a diameter of 3 feet. What is its area?',
      ],
    },
    business: {
      title: 'Farm Stand',
      badge: 'Counting & Money',
      badgeColor: 'bg-green-500',
      description: 'Count eggs, price your produce, and figure out how much you earned.',
      businessName: 'Farm Stand',
      pricePlaceholder: '0.50',
      qtyPlaceholder: '12',
      costPlaceholder: '0.10',
      fixedPlaceholder: '0',
    },
    data: {
      title: 'Harvest Count',
      badge: 'Data & Patterns',
      badgeColor: 'bg-blue-500',
      description: 'Count your harvest each day and find patterns — which day had the most eggs?',
      placeholder: 'Enter your daily counts separated by commas\ne.g. 5, 7, 4, 8, 6, 7, 9',
      questionPlaceholder: 'e.g. Which day had the most eggs? What was the average?',
    },
  },
  middle: {
    label: 'Homestead Workshop',
    tagline: 'Real calculations for real projects — fractions, percentages, and problem solving.',
    geometry: {
      title: 'Building Plans',
      badge: 'Geometry',
      badgeColor: 'bg-amber-600',
      description: 'Calculate room dimensions, material quantities, and fencing for real homestead projects.',
      examples: [
        'A chicken coop is 12 ft × 8 ft. What is the floor area and perimeter?',
        'I need to build a ramp with a rise of 3 feet over a run of 9 feet. What is the slope angle?',
        'A circular greenhouse has a radius of 10 feet. What is the floor area and circumference?',
      ],
    },
    business: {
      title: 'Market Day',
      badge: 'Business Math',
      badgeColor: 'bg-green-600',
      description: 'Price your products, subtract costs, and calculate your actual profit margin.',
      businessName: 'Homestead Market Booth',
      pricePlaceholder: '8.00',
      qtyPlaceholder: '24',
      costPlaceholder: '3.50',
      fixedPlaceholder: '15',
    },
    data: {
      title: 'Field Records',
      badge: 'Statistics',
      badgeColor: 'bg-blue-600',
      description: 'Analyze rainfall totals, crop yields, or animal weights to find patterns and plan ahead.',
      placeholder: 'Enter your measurements separated by commas\ne.g. 2.3, 1.8, 3.1, 2.7, 2.0, 3.5, 1.9',
      questionPlaceholder: 'e.g. What was the average rainfall? Was there a trend?',
    },
  },
  high: {
    label: 'Applied Mathematics',
    tagline: 'The math that builders, traders, and entrepreneurs use every day.',
    geometry: {
      title: 'Architectural Geometry',
      badge: 'Advanced Geometry',
      badgeColor: 'bg-amber-700',
      description: 'Calculate roof pitch, rafter lengths, structural loads, and material quantities for real builds.',
      examples: [
        'A 16×60 saltbox barn has a 6:12 roof pitch. Calculate the rafter length and total roof area.',
        'A greenhouse foundation is 24 ft × 40 ft × 4 inches deep. Calculate cubic yards of concrete needed.',
        'A deck needs joists every 16 inches on center across a 20-foot span. How many joists are needed?',
      ],
    },
    business: {
      title: 'Trade Shop Economics',
      badge: 'Business Finance',
      badgeColor: 'bg-green-700',
      description: 'Calculate landed costs, profit margins, break-even points, and true hourly rates for a trade shop.',
      businessName: 'Walnut Woodworking Shop',
      pricePlaceholder: '850',
      qtyPlaceholder: '4',
      costPlaceholder: '220',
      fixedPlaceholder: '450',
    },
    data: {
      title: 'Market Analysis',
      badge: 'Data Science',
      badgeColor: 'bg-blue-700',
      description: 'Analyze price trends, yields, or sales data to make real decisions about your business or farm.',
      placeholder: 'Enter your dataset (numbers separated by commas)\ne.g. 1240, 1380, 1195, 1420, 1310, 1580, 1245, 1400',
      questionPlaceholder: 'e.g. What is the trend? Should I expand production this year?',
    },
  },
};

// ── Geometry Calculator ───────────────────────────────────────────────────
function GeometryPanel({ tier }: { tier: keyof typeof TIER_CONFIG }) {
  const cfg = TIER_CONFIG[tier].geometry;
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; steps: string[]; formula: string; funFact: string } | null>(null);
  const [error, setError] = useState('');

  const solve = async () => {
    if (!problem.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res = await fetch('/api/math/geometry/solve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setResult(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-black text-[#2F4731] uppercase tracking-wider block mb-2">Describe your problem</label>
        <Textarea
          value={problem} onChange={e => setProblem(e.target.value)}
          placeholder="Describe what you need to calculate…"
          className="border-2 border-[#E7DAC3] min-h-[80px] text-sm"
        />
      </div>
      <div className="bg-[#FFFEF7] border border-[#E7DAC3] rounded-xl p-3">
        <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wider mb-2">Try one of these:</p>
        <div className="space-y-1">
          {cfg.examples.map((ex, i) => (
            <button key={i} onClick={() => setProblem(ex)}
              className="text-xs text-left w-full text-[#2F4731]/70 hover:text-[#2F4731] hover:bg-[#E7DAC3] px-2 py-1 rounded transition-colors">
              → {ex}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={solve} disabled={loading || !problem.trim()} className="bg-[#2F4731] hover:bg-[#BD6809] text-white w-full font-bold">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Solving…</> : 'Solve It'}
      </Button>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
      {result && (
        <div className="space-y-3 border-t-2 border-[#E7DAC3] pt-4">
          <div className="bg-[#2F4731] text-[#FFFEF7] rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Answer</p>
            <p className="text-xl font-black">{result.answer}</p>
            <p className="text-xs opacity-60 mt-1 font-mono">{result.formula}</p>
          </div>
          <div className="bg-[#E7DAC3] rounded-xl p-4">
            <p className="text-xs font-bold text-[#2F4731] uppercase tracking-wider mb-2">Step-by-Step</p>
            <ol className="space-y-1">
              {result.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#2F4731]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#BD6809] text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{result.funFact}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Business Calculator ───────────────────────────────────────────────────
function BusinessPanel({ tier }: { tier: keyof typeof TIER_CONFIG }) {
  const cfg = TIER_CONFIG[tier].business;
  const [fields, setFields] = useState({ price: '', quantity: '', costPerUnit: '', fixedCosts: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    revenue: number; 
    costs: number; 
    profit: number; 
    profitMargin: string; 
    analysis: string; 
    advice: string; 
    mathBreakdown: string[];
    policyAnalysis?: {
      injusticeDetected: string;
      affectedPopulation: string;
      policyRecommendation: string;
      budgetImpact: string;
    }
  } | null>(null);
  const [error, setError] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFields(p => ({ ...p, [k]: e.target.value }));

  const analyze = async () => {
    if (!fields.price || !fields.quantity) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res = await fetch('/api/math/business/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, price: parseFloat(fields.price), quantity: parseInt(fields.quantity), costPerUnit: parseFloat(fields.costPerUnit || '0'), fixedCosts: parseFloat(fields.fixedCosts || '0'), businessName: cfg.businessName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setResult(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'price', label: 'Selling Price ($)', ph: cfg.pricePlaceholder },
          { key: 'quantity', label: 'Units to Sell', ph: cfg.qtyPlaceholder },
          { key: 'costPerUnit', label: 'Cost Per Unit ($)', ph: cfg.costPlaceholder },
          { key: 'fixedCosts', label: 'Fixed Costs ($)', ph: cfg.fixedPlaceholder },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs font-black text-[#2F4731] uppercase tracking-wider block mb-1">{f.label}</label>
            <Input type="number" min="0" step="0.01" value={(fields as any)[f.key]} onChange={set(f.key)} placeholder={f.ph}
              className="border-2 border-[#E7DAC3] text-sm" />
          </div>
        ))}
      </div>
      <Button onClick={analyze} disabled={loading || !fields.price || !fields.quantity} className="bg-[#2F4731] hover:bg-[#BD6809] text-white w-full font-bold">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Calculating…</> : 'Calculate Profit'}
      </Button>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
      {result && (
        <div className="space-y-3 border-t-2 border-[#E7DAC3] pt-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Revenue', val: `$${result.revenue.toFixed(2)}`, color: 'bg-blue-50 border-blue-200 text-blue-900' },
              { label: 'Costs', val: `$${result.costs.toFixed(2)}`, color: 'bg-red-50 border-red-200 text-red-900' },
              { label: 'Profit', val: `$${result.profit.toFixed(2)}`, color: result.profit >= 0 ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{s.label}</p>
                <p className="text-lg font-black">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#2F4731] text-[#FFFEF7] rounded-xl p-3 text-center">
            <p className="text-xs opacity-70 uppercase tracking-wider">Profit Margin</p>
            <p className="text-2xl font-black">{result.profitMargin}</p>
          </div>
          <div className="bg-[#E7DAC3] rounded-xl p-4">
            <p className="text-xs font-bold text-[#2F4731] uppercase tracking-wider mb-2">The Math</p>
            <ul className="space-y-1">
              {result.mathBreakdown.map((s, i) => <li key={i} className="text-sm text-[#2F4731] font-mono">{s}</li>)}
            </ul>
          </div>
          
          {result.policyAnalysis && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">⚖️ Ethical Business Analysis</p>
              </div>
              <div className="space-y-2 text-sm text-rose-900">
                <p><strong>Systemic Risk:</strong> {result.policyAnalysis.injusticeDetected}</p>
                <p><strong>Who it affects:</strong> {result.policyAnalysis.affectedPopulation}</p>
                <div className="bg-white/60 p-3 rounded-lg border border-rose-100 mt-2">
                  <p className="font-bold mb-1">Recommended Policy:</p>
                  <p>{result.policyAnalysis.policyRecommendation}</p>
                  <p className="mt-2 text-xs font-mono bg-rose-100 p-2 rounded">Budget Impact: {result.policyAnalysis.budgetImpact}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800"><strong>Adeline says:</strong> {result.advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Data Analyzer ─────────────────────────────────────────────────────────
function DataPanel({ tier }: { tier: keyof typeof TIER_CONFIG }) {
  const cfg = TIER_CONFIG[tier].data;
  const [data, setData] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ mean: number; median: number; mode: string; range: number; analysis: string; insight: string; chartType: string } | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!data.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res = await fetch('/api/math/data/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, question }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setResult(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-black text-[#2F4731] uppercase tracking-wider block mb-2">Your Data</label>
        <Textarea value={data} onChange={e => setData(e.target.value)} placeholder={cfg.placeholder}
          className="border-2 border-[#E7DAC3] min-h-[80px] text-sm font-mono" />
      </div>
      <div>
        <label className="text-xs font-black text-[#2F4731] uppercase tracking-wider block mb-2">Your Question (optional)</label>
        <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder={cfg.questionPlaceholder}
          className="border-2 border-[#E7DAC3] text-sm" />
      </div>
      <Button onClick={analyze} disabled={loading || !data.trim()} className="bg-[#2F4731] hover:bg-[#BD6809] text-white w-full font-bold">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing…</> : 'Analyze Data'}
      </Button>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
      {result && (
        <div className="space-y-3 border-t-2 border-[#E7DAC3] pt-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Mean (Average)', val: result.mean.toFixed(2) },
              { label: 'Median (Middle)', val: result.median.toFixed(2) },
              { label: 'Mode (Most Common)', val: result.mode },
              { label: 'Range (Spread)', val: result.range.toFixed(2) },
            ].map(s => (
              <div key={s.label} className="bg-[#E7DAC3] rounded-xl p-3 border border-[#BD6809]/20">
                <p className="text-xs font-bold text-[#2F4731]/60 uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-black text-[#2F4731]">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Best Chart: {result.chartType}</p>
            <p className="text-sm text-blue-900">{result.analysis}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800"><strong>Insight:</strong> {result.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
type WorkshopId = 'geometry' | 'business' | 'data';

export default function MathPage() {
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [activeWorkshop, setActiveWorkshop] = useState<WorkshopId | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setGradeLevel(d.gradeLevel); setInterests(d.interests ?? []); } })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const tier = getGradeTier(gradeLevel);
  const cfg = TIER_CONFIG[tier];

  const WORKSHOPS: { id: WorkshopId; title: string; badge: string; badgeColor: string; description: string; icon: React.ReactNode }[] = [
    { id: 'geometry', ...cfg.geometry, icon: <Ruler size={28} /> },
    { id: 'business', ...cfg.business, icon: <DollarSign size={28} /> },
    { id: 'data',     ...cfg.data,     icon: <BarChart2 size={28} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                {cfg.label}
              </h1>
              <p className="text-[#2F4731]/70 text-base mt-1">{cfg.tagline}</p>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {interests.slice(0, 4).map(i => (
                    <span key={i} className="text-xs bg-[#2F4731] text-[#FFFEF7] px-2 py-0.5 rounded-full">{i}</span>
                  ))}
                </div>
              )}
            </div>
            {gradeLevel && (
              <div className="bg-[#2F4731] text-[#FFFEF7] rounded-2xl px-5 py-3 text-center">
                <p className="text-xs opacity-60 uppercase tracking-widest">Grade</p>
                <p className="text-3xl font-black">{gradeLevel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Workshop cards */}
        {!activeWorkshop && (
          <div className="grid md:grid-cols-3 gap-6">
            {WORKSHOPS.map(w => (
              <button key={w.id} onClick={() => setActiveWorkshop(w.id)}
                className="text-left bg-white rounded-[2rem] border-2 border-[#BD6809]/20 hover:border-[#BD6809] hover:shadow-xl transition-all p-6 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-[#2F4731] group-hover:bg-[#BD6809] transition-colors rounded-xl text-[#FFFEF7]">
                    {w.icon}
                  </div>
                  <Badge className={`${w.badgeColor} text-white text-xs`}>{w.badge}</Badge>
                </div>
                <h3 className="text-xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  {w.title}
                </h3>
                <p className="text-sm text-[#2F4731]/70 leading-relaxed mb-4">{w.description}</p>
                <div className="flex items-center gap-1 text-[#BD6809] text-sm font-bold">
                  Open Workshop <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Active workshop panel */}
        {activeWorkshop && (() => {
          const w = WORKSHOPS.find(x => x.id === activeWorkshop)!;
          return (
            <div className="bg-white rounded-[2rem] border-2 border-[#BD6809]/30 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#2F4731] rounded-xl text-[#FFFEF7]">{w.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>{w.title}</h2>
                    <Badge className={`${w.badgeColor} text-white text-xs mt-1`}>{w.badge}</Badge>
                  </div>
                </div>
                <button onClick={() => setActiveWorkshop(null)}
                  className="text-[#2F4731]/50 hover:text-[#2F4731] p-2 rounded-xl hover:bg-[#E7DAC3] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeWorkshop === 'geometry' && <GeometryPanel tier={tier} />}
              {activeWorkshop === 'business' && <BusinessPanel tier={tier} />}
              {activeWorkshop === 'data'     && <DataPanel tier={tier} />}

              <button onClick={() => setActiveWorkshop(null)}
                className="text-xs text-[#2F4731]/50 hover:text-[#2F4731] underline">
                ← Back to workshops
              </button>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

