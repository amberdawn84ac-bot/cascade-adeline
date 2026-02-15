import React from 'react';
import { IllustrationProps } from './types';

export function Wildflower({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M32 38v20" />
      <path d="M24 58c3-6 10-6 13 0" />
      <path d="M28 44c-6 2-9-4-6-8 3-3 9-1 10 3" />
      <path d="M36 44c6 2 9-4 6-8-3-3-9-1-10 3" />
      <path d="M32 24c1-5 7-7 10-3 4 4 0 10-5 10" />
      <path d="M32 24c-1-5-7-7-10-3-4 4 0 10 5 10" />
      <path d="M32 32c4 0 7-3 7-6s-3-5-7-5-7 2-7 5 3 6 7 6Z" />
      <path d="M32 18c0-4 2-8 4-10" />
      <path d="M32 18c0-4-2-8-4-10" />
      <path d="M32 14c-2-2-5-3-8-3" />
      <path d="M32 14c2-2 5-3 8-3" />
    </svg>
  );
}
