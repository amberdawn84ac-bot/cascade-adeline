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

  // Normalise: agent puts options in interactive.options, descriptions in interactive.guidingQuestions
  const choices: Choice[] = blockData.choices?.length
    ? blockData.choices
    : (blockData.interactive?.options || []).map((label, i) => ({
        label,
        description: blockData.interactive?.guidingQuestions?.[i],
      }));

  const handleSelect = (index: number) => {
    if (selected !== null) return; // locked after first pick
    setSelected(index);
    onResponse?.({ selected: index, label: choices[index]?.label, blockId: blockData.block_id });
  };

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
                ? 'border-[#2F4731] bg-[#2F4731] text-white shadow-md'
                : selected !== null
                ? 'border-[#E7DAC3] bg-[#FAF5E4] text-[#2F4731]/50 cursor-not-allowed'
                : 'border-[#E7DAC3] bg-white text-[#121B13] hover:border-[#BD6809] hover:shadow-md cursor-pointer',
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
        <p className="mt-3 text-xs text-[#2F4731]/60 italic">
          Great choice — Adeline will tailor what comes next.
        </p>
      )}
    </div>
  );
}
