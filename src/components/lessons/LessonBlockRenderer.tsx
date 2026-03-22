'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizCard } from '@/components/gen-ui/patterns/QuizCard';
import { Flashcard } from '@/components/gen-ui/patterns/Flashcard';
import { StepList } from '@/components/gen-ui/patterns/StepList';
import { MathDisplay } from '@/components/gen-ui/patterns/MathDisplay';
import type { LessonBlock } from '@/lib/langgraph/lesson/lessonState';
import PrimarySourceBlock from './PrimarySourceBlock';
import InvestigationBlock from './InvestigationBlock';

const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const WINE = '#9A3F4A';
const CREAM = '#FFFEF7';

function PhotoBlock({ prompt }: { prompt: string }) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/lesson-stream/photo-upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setPhotoUrl(url);
    } catch {
      setError('Upload failed — try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="my-4 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: PAPAYA }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PAPAYA }}>
        📸 Photo Challenge
      </p>
      <p className="text-sm mb-3" style={{ color: PALM }}>{prompt}</p>

      {photoUrl ? (
        <div className="space-y-2">
          <img src={photoUrl} alt="Completion evidence" className="rounded-lg max-h-64 object-contain border border-amber-200" />
          <p className="text-xs font-bold text-emerald-700">✅ Photo uploaded — great work!</p>
          <label
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: PALM, color: PALM }}
          >
            Replace Photo
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
        </div>
      ) : (
        <label
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          style={{ backgroundColor: PAPAYA, color: CREAM }}
        >
          {uploading ? '⏳ Uploading…' : '📷 Upload Photo'}
          <input type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface LessonBlockRendererProps {
  block: LessonBlock;
  blockIndex?: number;
  userId?: string;
  topic?: string;
  subject?: string;
  onQuizAnswer?: (blockIndex: number, isCorrect: boolean) => void;
}

export function LessonBlockRenderer({ block, blockIndex = 0, onQuizAnswer, topic, subject }: LessonBlockRendererProps) {
  const { type, content, interactive, metadata } = block;

  switch (type) {
    case 'text':
      return (
        <div className="my-4 prose prose-sm max-w-none" style={{ color: PALM, lineHeight: 1.8 }}>
          <ReactMarkdown>{content as string}</ReactMarkdown>
        </div>
      );

    case 'scripture':
      return (
        <div
          className="my-4 px-5 py-4 rounded-lg border-l-4"
          style={{ borderColor: WINE, backgroundColor: `${WINE}12` }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: WINE }}>
            Scripture
          </p>
          <div className="prose prose-sm max-w-none italic" style={{ color: PALM }}>
            <ReactMarkdown>{content as string}</ReactMarkdown>
          </div>
        </div>
      );

    case 'prompt':
      return (
        <div
          className="my-4 px-5 py-4 rounded-lg border-l-4"
          style={{ borderColor: PAPAYA, backgroundColor: `${PAPAYA}15` }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PAPAYA }}>
            Think About It
          </p>
          <p className="font-medium" style={{ color: PALM }}>
            {content as string}
          </p>
        </div>
      );

    case 'quiz':
      if (!interactive?.options || interactive.correctIndex === undefined) return null;
      return (
        <div className="my-4">
          <QuizCard
            question={content as string}
            options={interactive.options}
            correctIndex={interactive.correctIndex}
            explanation={interactive.explanation}
            onAnswer={(isCorrect) => onQuizAnswer?.(blockIndex, isCorrect)}
          />
        </div>
      );

    case 'flashcards':
      if (!interactive?.term || !interactive?.definition) return null;
      return (
        <div className="my-4">
          <Flashcard
            term={interactive.term}
            definition={interactive.definition}
            example={interactive.example}
            category={interactive.category}
          />
        </div>
      );

    case 'hands-on': {
      let parsed: { title?: string; fullInstructions?: string; supplies?: string[] } = {};
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content as typeof parsed;
      } catch {
        parsed = { title: 'Activity', fullInstructions: content as string, supplies: [] };
      }
      const steps = (parsed.fullInstructions || '')
        .split('\n')
        .filter(l => l.trim())
        .map((instruction, idx) => ({ number: idx + 1, instruction: instruction.replace(/^\d+\.\s*/, '').trim() }));
      return (
        <div className="my-4">
          {parsed.supplies && parsed.supplies.length > 0 && (
            <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: `${PALM}10` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PALM }}>Supplies</p>
              <ul className="list-disc list-inside text-sm" style={{ color: PALM }}>
                {parsed.supplies.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          <StepList title={parsed.title || 'Activity'} steps={steps} />
        </div>
      );
    }

    case 'worksheet': {
      let parsed: { problem?: string; steps?: Array<{ equation: string; explanation: string }>; finalAnswer?: string } = {};
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content as typeof parsed;
      } catch {
        return (
          <div className="my-4 prose prose-sm max-w-none">
            <ReactMarkdown>{content as string}</ReactMarkdown>
          </div>
        );
      }
      if (parsed.problem && parsed.steps && parsed.finalAnswer) {
        return (
          <div className="my-4">
            <MathDisplay
              problem={parsed.problem}
              steps={parsed.steps}
              finalAnswer={parsed.finalAnswer}
            />
          </div>
        );
      }
      return (
        <div className="my-4 prose prose-sm max-w-none">
          <ReactMarkdown>{content as string}</ReactMarkdown>
        </div>
      );
    }

    case 'infographic': {
      const url = content as string;
      const qParam = url.includes('?q=') ? decodeURIComponent(url.split('?q=')[1].split('&')[0]) : 'image search';
      return (
        <div className="my-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-md transition-shadow group"
            style={{ borderColor: `${PALM}30`, backgroundColor: `${PALM}08` }}
          >
            <div
              className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${PALM}18` }}
            >
              🖼️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: PAPAYA }}>
                Visual Reference
              </p>
              <p className="font-semibold text-sm truncate group-hover:underline" style={{ color: PALM }}>
                {qParam}
              </p>
              <p className="text-xs mt-0.5" style={{ color: `${PALM}70` }}>
                Google Images — opens in new tab
              </p>
            </div>
            <span className="flex-shrink-0 text-lg">↗</span>
          </a>
        </div>
      );
    }

    case 'video': {
      const url = content as string;
      const qParam = url.includes('search_query=')
        ? decodeURIComponent(url.split('search_query=')[1].split('&')[0]).replace(/\+/g, ' ')
        : 'video';
      return (
        <div className="my-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-md transition-shadow group"
            style={{ borderColor: '#CC000030', backgroundColor: '#CC000008' }}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
              <span className="text-white text-xl">▶</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5 text-red-600">
                Watch on YouTube
              </p>
              <p className="font-semibold text-sm truncate group-hover:underline" style={{ color: PALM }}>
                {qParam}
              </p>
              <p className="text-xs mt-0.5" style={{ color: `${PALM}70` }}>
                Search results — opens in new tab
              </p>
            </div>
            <span className="flex-shrink-0 text-lg" style={{ color: PALM }}>↗</span>
          </a>
        </div>
      );
    }

    case 'photo':
      return <PhotoBlock prompt={content as string} />;

    case 'primary_source':
      return <PrimarySourceBlock block={block} />;

    case 'investigation':
      return <InvestigationBlock block={block} topic={topic} subject={subject} />;

    case 'source_gap':
      return (
        <div className="my-4 rounded-lg border-2 border-amber-300 bg-amber-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
            ⚠️ Primary Source Needed
          </p>
          <div className="prose prose-sm max-w-none text-amber-900">
            <ReactMarkdown>{content as string}</ReactMarkdown>
          </div>
        </div>
      );

    default:
      return (
        <div className="my-4 prose prose-sm max-w-none">
          <ReactMarkdown>{content as string}</ReactMarkdown>
        </div>
      );
  }
}

interface LessonBlockListProps {
  blocks: LessonBlock[];
  userId?: string;
  topic?: string;
  subject?: string;
  onQuizAnswer?: (blockIndex: number, isCorrect: boolean) => void;
}

export function LessonBlockList({ blocks, userId, topic, subject, onQuizAnswer }: LessonBlockListProps) {
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <LessonBlockRenderer key={index} block={block} blockIndex={index} userId={userId} topic={topic} subject={subject} onQuizAnswer={onQuizAnswer} />
      ))}
    </div>
  );
}
