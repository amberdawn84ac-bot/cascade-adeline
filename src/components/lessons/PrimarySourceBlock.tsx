'use client';

import { useState } from 'react';
import type { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

interface Props {
  block: LessonBlock;
}

const NARRATIVE_ROLE_LABELS: Record<string, { label: string; color: string; borderColor: string }> = {
  official_claim:    { label: 'OFFICIAL RECORD',      color: 'bg-blue-100 text-blue-800',   borderColor: 'border-blue-300' },
  government_record: { label: 'GOVERNMENT DOCUMENT',  color: 'bg-blue-100 text-blue-800',   borderColor: 'border-blue-300' },
  propagandist:      { label: 'PROPAGANDA',            color: 'bg-orange-100 text-orange-800', borderColor: 'border-orange-300' },
  eyewitness:        { label: 'EYEWITNESS ACCOUNT',   color: 'bg-green-100 text-green-800', borderColor: 'border-green-300' },
  victim_testimony:  { label: 'SURVIVOR TESTIMONY',   color: 'bg-amber-100 text-amber-800', borderColor: 'border-amber-300' },
  counter_document:  { label: 'COUNTER-EVIDENCE',     color: 'bg-purple-100 text-purple-800', borderColor: 'border-purple-300' },
  investigative_data:{ label: 'INVESTIGATIVE RECORD', color: 'bg-teal-100 text-teal-800',   borderColor: 'border-teal-300' },
  scripture:         { label: 'SCRIPTURE',             color: 'bg-yellow-100 text-yellow-800', borderColor: 'border-yellow-300' },
  evidence:          { label: 'PRIMARY SOURCE',        color: 'bg-stone-100 text-stone-700', borderColor: 'border-stone-300' },
};

export default function PrimarySourceBlock({ block }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const content = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
  const { narrativeRole, citation, creator, date, collection, url, investigationPrompts, sourceType } = block.interactive ?? {};

  const roleKey = narrativeRole ?? 'evidence';
  const roleStyle = NARRATIVE_ROLE_LABELS[roleKey] ?? NARRATIVE_ROLE_LABELS.evidence;

  return (
    <div className={`rounded-lg border-2 ${roleStyle.borderColor} bg-[#fdf8f0] overflow-hidden my-4`}>
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-stone-200">
        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${roleStyle.color}`}>
          {roleStyle.label}
        </span>
        <span className="text-xs text-stone-400 font-mono">
          {sourceType?.replace(/_/g, ' ').toUpperCase() ?? 'DOCUMENT'}
        </span>
      </div>

      {(creator || date) && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-x-4 gap-y-1">
          {creator && (
            <span className="text-xs text-stone-600">
              <span className="font-semibold">Author:</span> {creator}
            </span>
          )}
          {date && (
            <span className="text-xs text-stone-600">
              <span className="font-semibold">Date:</span> {date}
            </span>
          )}
          {collection && (
            <span className="text-xs text-stone-600">
              <span className="font-semibold">Source:</span> {collection}
            </span>
          )}
        </div>
      )}

      <blockquote className="mx-4 my-3 px-4 py-3 border-l-4 border-stone-400 bg-[#f5ede0] rounded-r text-sm text-stone-800 leading-relaxed font-serif italic whitespace-pre-wrap">
        {content}
      </blockquote>

      {citation && (
        <div className="px-4 pb-2">
          <p className="text-[11px] text-stone-500 italic">
            📜 {citation}
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 not-italic underline">
                View Original
              </a>
            )}
          </p>
        </div>
      )}

      {investigationPrompts && investigationPrompts.length > 0 && (
        <div className="mx-4 mb-3 mt-1 rounded bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">🔍 Investigate This Source</p>
          <ol className="list-decimal list-inside space-y-2">
            {investigationPrompts.map((prompt, i) => (
              <li key={i} className="text-sm text-amber-900 leading-snug">{prompt}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="px-4 pb-3">
        <button
          onClick={() => setNotesOpen(o => !o)}
          className="text-xs text-stone-500 hover:text-stone-700 underline"
        >
          {notesOpen ? 'Hide notes' : '✏️ Take notes on this source'}
        </button>
        {notesOpen && (
          <textarea
            className="mt-2 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={3}
            placeholder="Write your observations here..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
