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
  const getClassName = () => {
    let className = 'text-block';
    if (blockData.visual_style) {
      className += ` style-${blockData.visual_style}`;
    }
    if (blockData.emphasis) {
      className += ` emphasis-${blockData.emphasis}`;
    }
    return className;
  };

  return (
    <div className={getClassName()}>
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(convertMarkdown(blockData.content)) }} />
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
