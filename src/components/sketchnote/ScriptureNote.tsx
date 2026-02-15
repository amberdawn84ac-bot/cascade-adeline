import React from 'react';
import { OliveBranch, Dove } from '../illustrations';

export type ScriptureNoteProps = {
  text: string;
  accent?: 'olive' | 'dove';
  className?: string;
};

export function ScriptureNote({ text, accent = 'olive', className }: ScriptureNoteProps) {
  const Icon = accent === 'dove' ? Dove : OliveBranch;
  return (
    <div
      className={className}
      style={{
        background: '#FFFBEF',
        border: '1px solid #F2E7CC',
        borderRadius: 12,
        padding: '10px 12px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        color: '#9A3F4A',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 8, right: 10, opacity: 0.8 }}>
        <Icon size={18} color="#9A3F4A" />
      </div>
      {text}
    </div>
  );
}
