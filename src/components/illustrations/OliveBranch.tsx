import React from 'react';
import { IllustrationProps } from './types';

export function OliveBranch({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M14 46c12-8 22-18 30-30" />
      <path d="M22 40c4 1 7 4 8 8-5 1-8-1-10-4" />
      <path d="M30 32c4 1 7 4 8 8-4 1-7-1-9-3" />
      <path d="M38 24c4 1 7 4 8 8-4 1-7-1-9-3" />
      <path d="M18 44c-2 4-4 8-5 12" />
    </svg>
  );
}
