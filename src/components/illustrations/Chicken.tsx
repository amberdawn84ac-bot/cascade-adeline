import React from 'react';
import { IllustrationProps } from './types';

export function Chicken({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M22 30c-6 2-8 10-4 16 4 6 12 8 18 6 9-2 14-10 12-20-1-4-3-7-7-9" />
      <path d="M28 26c-2-6 2-10 8-10 4 0 7 2 9 5" />
      <path d="M40 18c2-2 3-5 2-7-2 1-4 2-5 4-1-2-3-3-5-4 0 3 1 6 3 7" />
      <path d="M20 32c-2-2-5-3-8-3 2 3 3 6 7 6" />
      <path d="M30 38c2 2 5 3 8 2" />
      <path d="M26 48c0 2-1 4-3 6" />
      <path d="M32 50c1 2 2 4 2 6" />
      <path d="M38 48c0 2 1 4 3 6" />
      <path d="M44 34c2 0 4-2 5-4" />
      <path d="M46 22c2 2 4 2 6 2-1-2-2-4-5-5" />
    </svg>
  );
}
