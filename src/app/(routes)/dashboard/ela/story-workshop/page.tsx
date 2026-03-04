'use client';

import { useState } from 'react';
import { PenTool, BookOpen, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StoryResult {
  title: string;
  opening: string;
  characterSketch: string;
  plotHook: string;
  writingTip: string;
}

const GENRES = ['Adventure', 'Mystery', 'Fantasy', 'Historical Fiction', 'Science Fiction', 'Realistic Fiction'];

const STARTER_PROMPTS = [
  'A child discovers a hidden door in their school basement',
  'A letter arrives addressed to someone who disappeared 100 years ago',
  'A young inventor builds something that changes their entire town',
  'The last tree in the world is guarded by a girl who refuses to leave',
];

export default function StoryWorkshopPage() {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Adventure');
  const [result, setResult] = useState<StoryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ela/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre }),
      });
      if (!res.ok) throw new Error('Failed');
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/ela/story/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: result.title, result }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 flex items-center gap-4">
        <div className="p-3 bg-rose-100 rounded-xl text-rose-700"><PenTool size={32} /></div>
        <div>
          <h1 className="text-3xl font-bold text-rose-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Story Workshop</h1>
          <p className="text-rose-800/70">Give Adeline a prompt. She'll write you a story starter to continue.</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-[2rem] p-6 border border-rose-100 space-y-4">
        <div className="flex gap-3">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="border border-rose-200 rounded-xl px-3 py-2 text-sm font-medium text-rose-700 bg-rose-50 focus:outline-none"
          >
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Your story idea or opening situation..."
            disabled={isGenerating}
            className="flex-1"
          />
          <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="bg-rose-600 hover:bg-rose-700">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {/* Starter prompts */}
        {!result && !isGenerating && (
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map(p => (
              <button key={p} onClick={() => setPrompt(p)} className="text-xs px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-rose-700 hover:bg-rose-100 transition-colors text-left">
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-3 text-rose-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium italic">Adeline is writing...</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Title */}
          <div className="text-center py-4">
            <h2 className="text-3xl font-bold text-rose-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              {result.title}
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 mt-1 inline-block">{genre}</span>
          </div>

          {/* Opening */}
          <div className="bg-white rounded-[2rem] p-8 border border-rose-100">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-rose-900">Opening</h3>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg italic">&ldquo;{result.opening}&rdquo;</p>
          </div>

          {/* Character + Hook */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-[2rem] p-6 border border-purple-100">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">Main Character</p>
              <p className="text-slate-700">{result.characterSketch}</p>
            </div>
            <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">The Central Conflict</p>
              <p className="text-slate-700">{result.plotHook}</p>
            </div>
          </div>

          {/* Writing Tip */}
          <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-100">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">✍️ Adeline's Writing Tip</p>
            <p className="text-rose-800">{result.writingTip}</p>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleSave} disabled={isSaving || saveSuccess} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 py-5 rounded-2xl">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saveSuccess ? '✨ Saved to Writing Portfolio!' : '🌿 Save to Writing Portfolio'}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/ela" className="text-sm text-rose-600 hover:underline">← Back to ELA Hub</Link>
      </div>
    </div>
  );
}
