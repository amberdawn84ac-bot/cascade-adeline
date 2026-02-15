import React from 'react';
import { IllustrationProps } from './types';

export function Dove({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M18 36c-6-2-10-8-10-14 4 2 9 2 12 0 1-6 6-10 12-10 7 0 12 5 12 12 0 2 0 4-1 6l10 6c-4 6-12 8-18 6-5 4-11 6-18 6" />
      <path d="M20 40c4 0 8-2 10-6" />
      <path d="M30 22c2 2 3 5 2 8" />
      <path d="M38 28c2 0 4-2 5-4" />
      <path d="M44 34c2 0 4 2 6 4" />
    </svg>
  );
}
