'use client';

import { useState } from 'react';
import { Code, Terminal, Loader2, Send, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChallengeResult {
  explanation: string;
  codeSnippet: string;
  language: string;
  nextChallenge: string;
}

export default function CodingPage() {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('Python');
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setResult(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/arcade/coding-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/arcade/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: result.codeSnippet, title: question.slice(0, 60), type: 'challenge' }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-violet-50 rounded-[2rem] p-8 border border-violet-100">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-violet-100 rounded-xl text-violet-700"><Code size={32} /></div>
          <div>
            <h1 className="text-3xl font-bold text-purple-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Coding Challenge Lab
            </h1>
            <p className="text-purple-800/70">Ask Adeline any coding question. Get an explanation + working code.</p>
          </div>
        </div>
      </div>

      {/* Ask Input */}
      <div className="bg-white rounded-[2rem] p-6 border border-violet-100 space-y-4">
        <div className="flex gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-violet-200 rounded-xl px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 focus:outline-none"
          >
            {['Python', 'JavaScript', 'HTML/CSS', 'Scratch'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder='E.g. "How do I make a loop?", "What is a variable?"'
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleAsk} disabled={isLoading || !question.trim()} className="bg-violet-600 hover:bg-violet-700">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Starter prompts */}
        {!result && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {['How do I make a loop?', 'What is a variable?', 'How do I make a function?', 'How do I use if/else?'].map(p => (
              <button key={p} onClick={() => setQuestion(p)} className="text-xs px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-violet-700 hover:bg-violet-100 transition-colors">
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-3 text-violet-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Adeline is thinking...</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-white rounded-[2rem] p-6 border border-violet-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-violet-900">Adeline's Explanation</h3>
            </div>
            <p className="text-slate-700 leading-relaxed">{result.explanation}</p>
          </div>

          {/* Code Snippet */}
          <div className="bg-[#1e1e1e] rounded-[2rem] overflow-hidden border border-slate-700">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border-b border-slate-700">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-slate-400 ml-2 font-mono">{result.language}</span>
            </div>
            <pre className="p-6 font-mono text-sm text-[#9cdcfe] overflow-x-auto whitespace-pre-wrap">
              {result.codeSnippet}
            </pre>
          </div>

          {/* Next Challenge */}
          <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Next Challenge</p>
            <p className="text-amber-800">{result.nextChallenge}</p>
          </div>

          {/* Save */}
          <div className="flex justify-center">
            <Button onClick={handleSave} disabled={isSaving || saveSuccess} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 py-5 rounded-2xl">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saveSuccess ? '✨ Saved to Portfolio!' : '🌿 Save to Portfolio'}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/arcade" className="text-sm text-violet-600 hover:underline">← Back to Game Arcade</Link>
      </div>
    </div>
  );
}

