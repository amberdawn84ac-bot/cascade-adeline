'use client';

import { useState } from 'react';
import { BarChart3, Loader2, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataResult {
  mean: number;
  median: number;
  mode: string;
  range: number;
  analysis: string;
  interpretation: string;
  chartType: string;
  insight: string;
}

export default function DataPage() {
  const [data, setData] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DataResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (!data.trim()) return;
    setIsLoading(true);
    setResult(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/math/data/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, question }),
      });
      if (!res.ok) throw new Error('Failed');
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/math/data/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, result }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const SAMPLE_DATASETS = [
    { label: 'Test Scores', data: '85, 92, 78, 95, 88, 72, 90, 83, 91, 87' },
    { label: 'Daily Temps (°F)', data: '72, 75, 68, 80, 77, 65, 82, 79, 71, 74' },
    { label: 'Books Read Per Month', data: '3, 5, 2, 4, 6, 3, 5, 4, 7, 2, 5, 4' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex items-center gap-4">
        <div className="p-3 bg-amber-100 rounded-xl text-amber-700"><BarChart3 size={32} /></div>
        <div>
          <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Data Science Lab</h1>
          <p className="text-amber-800/70">Enter any dataset. Adeline will calculate statistics and find insights.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-amber-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Your Dataset (comma-separated numbers)</label>
          <Input
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="E.g. 85, 92, 78, 95, 88, 72, 90"
            className="font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Question (optional)</label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="E.g. What does this tell us about the class performance?"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DATASETS.map(s => (
            <button key={s.label} onClick={() => setData(s.data)} className="text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 hover:bg-amber-100">{s.label}</button>
          ))}
        </div>
        <Button onClick={handleAnalyze} disabled={isLoading || !data.trim()} className="w-full bg-amber-600 hover:bg-amber-700">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Activity className="w-4 h-4 mr-2" />Analyze with Adeline</>}
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Mean', value: result.mean.toFixed(2) },
              { label: 'Median', value: result.median.toFixed(2) },
              { label: 'Mode', value: result.mode },
              { label: 'Range', value: result.range.toFixed(2) },
            ].map(stat => (
              <div key={stat.label} className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-amber-900 font-mono">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-amber-100 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
              <BarChart3 className="w-3 h-3" /> Best chart: {result.chartType}
            </div>
            <p className="text-slate-700 leading-relaxed">{result.analysis}</p>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">What This Means</p>
              <p className="text-amber-800">{result.interpretation}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">� Surprising Insight</p>
              <p className="text-purple-800">{result.insight}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleSave} disabled={isSaving || saveSuccess} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 py-5 rounded-2xl">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saveSuccess ? '✨ Saved!' : '🌿 Save to Portfolio'}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/math" className="text-sm text-amber-600 hover:underline">← Back to Math Hub</Link>
      </div>
    </div>
  );
}

