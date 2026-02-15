import React from 'react';
import { IllustrationProps } from './types';

export function LeafBranch({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M16 46c14-8 24-20 30-32" />
      <path d="M20 34c4 0 8 3 9 7-5 2-9 0-11-3" />
      <path d="M28 26c4 0 7 3 8 7-4 2-8 1-10-2" />
      <path d="M36 18c4 0 7 3 8 7-4 2-8 1-10-2" />
      <path d="M24 40c-3 4-6 9-8 14" />
    </svg>
  );
}
