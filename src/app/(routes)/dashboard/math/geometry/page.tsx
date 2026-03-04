'use client';

import { useState } from 'react';
import { Ruler, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GeometryResult {
  answer: string;
  steps: string[];
  formula: string;
  visualDescription: string;
  funFact: string;
}

export default function GeometryPage() {
  const [problem, setProblem] = useState('');
  const [result, setResult] = useState<GeometryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSolve = async () => {
    if (!problem.trim()) return;
    setIsLoading(true);
    setResult(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/math/geometry/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
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
      const res = await fetch('/api/math/geometry/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, result }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const PROMPTS = [
    'Find the area of a circle with radius 7',
    'What is the perimeter of a rectangle with sides 8 and 5?',
    'Calculate the volume of a cube with side length 4',
    'Find the hypotenuse of a right triangle with legs 3 and 4',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex items-center gap-4">
        <div className="p-3 bg-amber-100 rounded-xl text-amber-700"><Ruler size={32} /></div>
        <div>
          <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Geometry Solver</h1>
          <p className="text-amber-800/70">Type any geometry problem. Adeline will solve it step by step.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-amber-100 space-y-4">
        <div className="flex gap-2">
          <Input
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
            placeholder="E.g. Find the area of a triangle with base 6 and height 4"
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSolve} disabled={isLoading || !problem.trim()} className="bg-amber-600 hover:bg-amber-700">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Solve'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map(p => (
            <button key={p} onClick={() => setProblem(p)} className="text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 hover:bg-amber-100 transition-colors">{p}</button>
          ))}
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>}

      {result && (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Formula Used</p>
            <p className="font-mono text-lg font-bold text-amber-900">{result.formula}</p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-3">Step-by-Step Solution</h3>
            <ol className="space-y-2">{result.steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-slate-700 font-mono text-sm">{step}</span>
              </li>
            ))}</ol>
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Answer</p>
              <p className="text-xl font-bold text-green-800">{result.answer}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-[2rem] p-6 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Did You Know?</p>
            <p className="text-blue-800">{result.funFact}</p>
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
