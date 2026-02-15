import React from 'react';

export type HighlightVariant = 'vocab' | 'warning' | 'nature' | 'scripture';

export type HighlightSpanProps = {
  variant?: HighlightVariant;
  children: React.ReactNode;
  className?: string;
};

const styles: Record<HighlightVariant, React.CSSProperties> = {
  vocab: {
    background: '#FFF3CD',
    color: '#BD6809',
    padding: '0 6px',
    borderRadius: 6,
    fontWeight: 600,
  },
  warning: {
    background: '#FFE4EC',
    color: '#9A3F4A',
    padding: '0 6px',
    borderRadius: 6,
    fontWeight: 600,
  },
  nature: {
    background: '#D4EDDA',
    color: '#2F4731',
    padding: '0 6px',
    borderRadius: 6,
    fontWeight: 600,
  },
  scripture: {
    background: '#FFFBEF',
    color: '#9A3F4A',
    padding: '0 6px',
    borderRadius: 6,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontStyle: 'italic',
  },
};

export function HighlightSpan({ variant = 'vocab', children, className }: HighlightSpanProps) {
  return (
    <span style={styles[variant]} className={className}>
      {children}
    </span>
  );
}
