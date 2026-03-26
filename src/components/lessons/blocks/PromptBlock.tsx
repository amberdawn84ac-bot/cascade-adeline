'use client';

import React, { useState } from 'react';

interface PromptBlockProps {
  blockData: {
    block_id: string;
    content: string;
    metadata?: { faith_tie?: boolean };
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function PromptBlock({ blockData, onResponse, studentResponse }: PromptBlockProps) {
  const [answer, setAnswer] = useState(studentResponse?.answer || '');
  const [saved, setSaved] = useState(!!studentResponse?.saved);
  const isFaithTie = (blockData as any).metadata?.faith_tie;

  const handleSave = () => {
    if (!answer.trim()) return;
    setSaved(true);
    onResponse?.({ answer, blockId: blockData.block_id, saved: true });
  };

  return (
    <div className={[
      'my-4 p-5 rounded-xl border-l-4 shadow-sm',
      isFaithTie
        ? 'border-l-[#9A3F4A] bg-[#FCE4EC]/30'
        : 'border-l-[#BD6809] bg-[#FFF9C4]/40',
    ].join(' ')}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xl mt-0.5" aria-hidden="true">
          {isFaithTie ? '✝' : '💭'}
        </span>
        <p className="text-[#121B13] font-semibold leading-snug">{blockData.content}</p>
      </div>

      {!saved ? (
        <div className="ml-8">
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write your thoughts here…"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[#E7DAC3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BD6809] bg-white resize-none"
          />
          <button
            onClick={handleSave}
            disabled={!answer.trim()}
            className="mt-2 px-4 py-1.5 text-sm font-semibold bg-[#2F4731] text-white rounded-full hover:bg-[#BD6809] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save reflection
          </button>
        </div>
      ) : (
        <div className="ml-8 p-3 bg-[#2F4731]/5 rounded-lg text-sm text-[#121B13] italic">
          "{answer}"
          <span className="block mt-1 text-xs text-[#2F4731]/50 not-italic">Saved ✓</span>
        </div>
      )}
    </div>
  );
}
