'use client';

import { useState } from 'react';
import type { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

interface Props {
  block: LessonBlock;
  topic?: string;
  subject?: string;
}

type InvestigationPhase = 'choose' | 'investigate' | 'filed';

interface PathConfig {
  label: string;
  icon: string;
  tagline: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  badgeBg: string;
  questions: string[];
}

const PATH_CONFIG: Record<string, PathConfig> = {
  'follow-the-money': {
    label: 'Follow the Money',
    icon: '💰',
    tagline: 'Trace who gained and who lost.',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-400',
    accentText: 'text-emerald-900',
    badgeBg: 'bg-emerald-100',
    questions: [
      'Who funded this policy, law, or event?',
      'What economic interests were served by the official narrative?',
      'Who lost wealth, land, or resources as a result?',
      'Where did the money go — and who received it?',
    ],
  },
  'compare-sources': {
    label: 'Compare Sources',
    icon: '⚖️',
    tagline: 'Hold both accounts side-by-side.',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-400',
    accentText: 'text-blue-900',
    badgeBg: 'bg-blue-100',
    questions: [
      'What does the official source claim happened?',
      'What does the counter-source say happened?',
      'Where do the two accounts agree? Where do they diverge?',
      'What details appear in one source but are absent from the other?',
    ],
  },
  'timeline': {
    label: 'Timeline',
    icon: '📅',
    tagline: 'Sequence reveals what summaries hide.',
    accentBg: 'bg-purple-50',
    accentBorder: 'border-purple-400',
    accentText: 'text-purple-900',
    badgeBg: 'bg-purple-100',
    questions: [
      'What is the official sequence of events?',
      'When were key decisions made vs. when were they announced publicly?',
      'What significant events does the official timeline skip over?',
      'What do you notice when you view the sequence from the victims\' perspective?',
    ],
  },
  'network-map': {
    label: 'Network Map',
    icon: '🕸️',
    tagline: 'Map who knew whom — and who profited.',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-400',
    accentText: 'text-teal-900',
    badgeBg: 'bg-teal-100',
    questions: [
      'Who are the key decision-makers in this event?',
      'What were their relationships, loyalties, and conflicts of interest?',
      'Who had the most power to shape the outcome?',
      'Who was excluded from the room? Whose voice was silenced?',
    ],
  },
  'propaganda-analysis': {
    label: 'Propaganda Analysis',
    icon: '🎭',
    tagline: 'Identify what the narrative was built to hide.',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-orange-400',
    accentText: 'text-orange-900',
    badgeBg: 'bg-orange-100',
    questions: [
      'What emotional language or imagery does the official document use?',
      'Who is the intended audience for this message?',
      'What truth is being hidden, minimized, or distorted?',
      'How did this narrative shape what people believed — and what they did?',
    ],
  },
  'document-analysis': {
    label: 'Document Analysis',
    icon: '🔎',
    tagline: 'Read every word like a detective.',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-400',
    accentText: 'text-amber-900',
    badgeBg: 'bg-amber-100',
    questions: [
      'Who wrote this document, and what was their role or authority?',
      'What is the stated purpose? What might the unstated purpose be?',
      'What word choices reveal the author\'s perspective or bias?',
      'What would need to be true for every claim in this document to be accurate?',
    ],
  },
};

const PATH_ORDER = [
  'propaganda-analysis',
  'compare-sources',
  'follow-the-money',
  'document-analysis',
  'timeline',
  'network-map',
];

export default function InvestigationBlock({ block, topic = 'this topic', subject = 'history' }: Props) {
  const [phase, setPhase] = useState<InvestigationPhase>('choose');
  const [chosenPath, setChosenPath] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const content = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
  const { investigationType, guidingQuestions, whoBenefits } = block.interactive ?? {};

  const recommendedPath = investigationType ?? 'document-analysis';

  const activePath = chosenPath ?? recommendedPath;
  const pathCfg = PATH_CONFIG[activePath] ?? PATH_CONFIG['document-analysis'];

  // Combine path-universal questions with topic-specific guiding questions from block
  const topicQuestions: string[] = guidingQuestions ?? [];
  const allQuestions: string[] = [...pathCfg.questions, ...topicQuestions];

  function handleChoose(path: string) {
    setChosenPath(path);
    setAnswers({});
    setPhase('investigate');
  }

  async function handleSubmit() {
    const filled = allQuestions.map((q, i) => ({ question: q, response: answers[i] ?? '' }));
    const hasAny = filled.some(a => a.response.trim().length > 0);
    if (!hasAny) {
      setError('Write at least one response before filing your investigation.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/investigation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          investigationPath: activePath,
          answers: filled,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedId(data.id);
        setPhase('filed');
      } else {
        setError('Could not save — try again.');
      }
    } catch {
      setError('Network error — try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Phase 1: Choose a path ────────────────────────────────────────────────
  if (phase === 'choose') {
    return (
      <div className="my-4 rounded-xl border-2 border-stone-300 bg-[#fdf8f0] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-white">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
            🕵️ Phase 2 — Investigation
          </p>
          <p className="text-base font-semibold text-stone-800 leading-snug">{content}</p>
          {whoBenefits && (
            <p className="mt-2 text-sm text-stone-500 italic">
              💡 <span className="font-semibold">Seed question:</span> {whoBenefits}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-stone-700 mb-3">
            Choose your investigation lens:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PATH_ORDER.map(pathKey => {
              const cfg = PATH_CONFIG[pathKey];
              const isRecommended = pathKey === recommendedPath;
              return (
                <button
                  key={pathKey}
                  onClick={() => handleChoose(pathKey)}
                  className={`relative text-left rounded-lg border-2 px-4 py-3 transition-all hover:shadow-md active:scale-95 ${
                    isRecommended
                      ? `${cfg.accentBorder} ${cfg.accentBg}`
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  {isRecommended && (
                    <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badgeBg} ${cfg.accentText}`}>
                      Suggested
                    </span>
                  )}
                  <span className="text-xl mr-2">{cfg.icon}</span>
                  <span className={`font-semibold text-sm ${isRecommended ? cfg.accentText : 'text-stone-800'}`}>
                    {cfg.label}
                  </span>
                  <p className="mt-1 text-xs text-stone-500 leading-snug">{cfg.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 2: Investigate ──────────────────────────────────────────────────
  if (phase === 'investigate') {
    return (
      <div className={`my-4 rounded-xl border-2 ${pathCfg.accentBorder} overflow-hidden`}>
        <div className={`flex items-center gap-3 px-5 py-3 ${pathCfg.accentBg}`}>
          <span className="text-2xl">{pathCfg.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Investigation — Phase 2</p>
            <p className={`font-bold text-base ${pathCfg.accentText}`}>{pathCfg.label}</p>
          </div>
          <button
            onClick={() => setPhase('choose')}
            className="ml-auto text-xs text-stone-400 hover:text-stone-700 underline"
          >
            ← Change lens
          </button>
        </div>

        <div className="bg-white px-5 py-4 space-y-4">
          {allQuestions.map((question, i) => {
            const isTopicSpecific = i >= pathCfg.questions.length;
            return (
              <div key={i} className={`rounded-lg border px-4 py-3 ${isTopicSpecific ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-stone-50'}`}>
                {isTopicSpecific && (
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1">Source-Specific</p>
                )}
                <p className={`text-sm font-semibold mb-2 ${isTopicSpecific ? 'text-amber-900' : 'text-stone-700'}`}>
                  {i + 1}. {question}
                </p>
                <textarea
                  className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  rows={3}
                  placeholder="Write your analysis here..."
                  value={answers[i] ?? ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>

        {error && (
          <p className="px-5 py-2 text-sm text-red-600 bg-red-50 border-t border-red-200">{error}</p>
        )}

        <div className="px-5 py-4 border-t border-stone-100 bg-[#fdf8f0] flex items-center justify-between">
          <p className="text-xs text-stone-400 italic">
            Answer what you can. You don&apos;t have to get it right — just think honestly.
          </p>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all ${
              saving
                ? 'bg-stone-400 cursor-not-allowed'
                : `${pathCfg.accentBorder.replace('border-', 'bg-').replace('-400', '-600')} hover:opacity-90 active:scale-95`
            }`}
          >
            {saving ? 'Filing…' : '📁 File My Investigation'}
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 3: Filed ────────────────────────────────────────────────────────
  return (
    <div className={`my-4 rounded-xl border-2 ${pathCfg.accentBorder} overflow-hidden`}>
      <div className={`px-5 py-4 ${pathCfg.accentBg} border-b ${pathCfg.accentBorder}`}>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Investigation Filed</p>
        <p className={`text-lg font-bold ${pathCfg.accentText}`}>
          {pathCfg.icon} {pathCfg.label}: {topic}
        </p>
        {savedId && (
          <p className="text-xs text-stone-500 mt-1 font-mono">ID: {savedId}</p>
        )}
      </div>

      <div className="bg-white px-5 py-4 space-y-3">
        <p className="text-sm font-semibold text-stone-700">
          Your findings are saved. Here&apos;s what you wrote:
        </p>
        {allQuestions.map((question, i) => {
          const response = answers[i]?.trim();
          if (!response) return null;
          return (
            <div key={i} className="rounded-lg border border-stone-200 px-4 py-3">
              <p className="text-xs font-semibold text-stone-500 mb-1">{question}</p>
              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-stone-100 bg-[#fdf8f0]">
        <p className="text-xs text-stone-500 italic">
          Every real historian starts exactly like this — with a document, a question, and honest curiosity.
          Your investigation is now part of your learning record.
        </p>
      </div>
    </div>
  );
}
