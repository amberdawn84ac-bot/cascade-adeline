import React from 'react';
import { IllustrationProps } from './types';

export function HerbSprig({ size = 24, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M30 12c0 10-2 26-8 40" />
      <path d="M34 20c-4 2-9 1-11-3 4-3 8-2 11 0" />
      <path d="M36 28c-4 2-9 1-11-3 4-3 8-2 11 0" />
      <path d="M38 36c-4 2-9 1-11-3 4-3 8-2 11 0" />
      <path d="M24 34c4-2 9-1 11 3-4 3-8 2-11 0" />
    </svg>
  );
}
