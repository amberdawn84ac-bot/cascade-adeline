'use client';

import React, { useState } from 'react';

interface Choice {
  label: string;
  description?: string;
  nextPath?: string;
}

interface ChoiceBlockProps {
  blockData: {
    block_id: string;
    content: string;
    // Agent format: choices in interactive.options + interactive.guidingQuestions
    interactive?: {
      options?: string[];
      guidingQuestions?: string[];
    };
    // Legacy format
    choices?: Choice[];
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function ChoiceBlock({ blockData, onResponse, studentResponse }: ChoiceBlockProps) {
  const [selected, setSelected] = useState<number | null>(studentResponse?.selected ?? null);

  // Normalise: contentAgent puts choices on the block directly; fallback to interactive.options
  const raw = blockData as any;
  const choices: Choice[] = (raw.choices?.length
    ? raw.choices
    : null) ||
    (raw.interactive?.options?.length
      ? raw.interactive.options.map((label: string, i: number) => ({
          label,
          description: raw.interactive?.guidingQuestions?.[i],
        }))
      : null) ||
    // Last resort: split content by common delimiters to infer choices
    [];

  const handleSelect = (index: number) => {
    if (selected !== null) return; // locked after first pick
    setSelected(index);
    onResponse?.({ selected: index, label: choices[index]?.label, blockId: blockData.block_id });
  };

  // No choices — render as a plain text block with a thinking prompt
  if (choices.length === 0) {
    return (
      <div className="my-4 p-5 rounded-xl border-2 border-[#BD6809]/40 bg-[#FFFEF7] shadow-sm">
        <p className="text-[#121B13] font-semibold leading-snug">{blockData.content}</p>
      </div>
    );
  }

  return (
    <div className="my-4 p-5 rounded-xl border-2 border-[#BD6809] bg-[#FFFEF7] shadow-sm">
      <p className="text-[#121B13] font-semibold mb-4 leading-snug">{blockData.content}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={selected !== null}
            className={[
              'text-left p-4 rounded-lg border-2 transition-all duration-200',
              selected === i
                ? 'border-[#2F4731] bg-[#2F4731] text-white shadow-md ring-2 ring-[#2F4731]/30'
                : selected !== null
                ? 'border-[#E7DAC3] bg-[#FAF5E4] text-[#2F4731]/40 cursor-not-allowed'
                : 'border-[#E7DAC3] bg-white text-[#121B13] hover:border-[#BD6809] hover:bg-[#FFF9F0] hover:shadow-md cursor-pointer active:scale-[0.98]',
            ].join(' ')}
          >
            <span className="font-semibold block text-sm mb-1">{choice.label}</span>
            {choice.description && (
              <span className="text-xs opacity-80 leading-snug">{choice.description}</span>
            )}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="mt-3 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#2F4731] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-xs text-[#2F4731] font-medium">
            You chose: <strong>{choices[selected]?.label}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
