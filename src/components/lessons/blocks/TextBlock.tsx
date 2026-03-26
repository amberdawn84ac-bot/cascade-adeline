'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface TextBlockProps {
  blockData: {
    block_id: string;
    content: string;
    visual_style?: 'paragraph' | 'callout' | 'handwritten';
    emphasis?: 'normal' | 'highlighted' | 'important';
  };
  onResponse?: (response: any) => void;
}

export default function TextBlock({ blockData }: TextBlockProps) {
  // Map visual styles to Tailwind modifier classes
  const styleClasses: Record<string, string> = {
    callout: 'bg-[#FFF9C4] border-l-[#BD6809] rotate-[-0.3deg]',
    handwritten: 'bg-[#E8F5E9] border-l-[#2F4731] rotate-[0.3deg]',
  };
  const emphasisClasses: Record<string, string> = {
    highlighted: 'bg-[#FFF9C4] border-l-[#BD6809]',
    important: 'border-l-[#9A3F4A] border-l-[6px] font-bold',
  };

  const extra = [
    styleClasses[blockData.visual_style || ''] || '',
    emphasisClasses[blockData.emphasis || ''] || '',
  ].join(' ');

  return (
    <div className={`text-block ${extra}`}>
      <div
        className="prose prose-sm max-w-none text-[#121B13] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(convertMarkdown(blockData.content)) }}
      />
    </div>
  );
}

function convertMarkdown(text: string): string {
  return text
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>');
}
