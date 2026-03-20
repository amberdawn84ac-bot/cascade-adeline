'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizCard } from '@/components/gen-ui/patterns/QuizCard';
import { Flashcard } from '@/components/gen-ui/patterns/Flashcard';
import { StepList } from '@/components/gen-ui/patterns/StepList';
import { MathDisplay } from '@/components/gen-ui/patterns/MathDisplay';
import type { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const WINE = '#9A3F4A';
const CREAM = '#FFFEF7';

interface LessonBlockRendererProps {
  block: LessonBlock;
  userId?: string;
}

export function LessonBlockRenderer({ block }: LessonBlockRendererProps) {
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

    case 'infographic':
      return (
        <div className="my-4">
          <a
            href={content as string}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: PALM, color: CREAM }}
          >
            <span>🔍</span>
            <span>View Images</span>
          </a>
        </div>
      );

    case 'video':
      return (
        <div className="my-4">
          <a
            href={content as string}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#CC0000', color: '#fff' }}
          >
            <span>▶</span>
            <span>Watch Video</span>
          </a>
        </div>
      );

    case 'photo':
      return (
        <div className="my-4 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: PAPAYA }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PAPAYA }}>
            📸 Photo Challenge
          </p>
          <p className="text-sm mb-3" style={{ color: PALM }}>{content as string}</p>
          <label
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: PAPAYA, color: CREAM }}
          >
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  console.log('[PhotoBlock] File selected:', file.name);
                }
              }}
            />
          </label>
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
}

export function LessonBlockList({ blocks, userId }: LessonBlockListProps) {
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <LessonBlockRenderer key={index} block={block} userId={userId} />
      ))}
    </div>
  );
}
