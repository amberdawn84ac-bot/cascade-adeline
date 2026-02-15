import React from 'react';
import { IllustrationProps } from './types';

export function Trowel({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M30 10h4v10l-4 4V10Z" />
      <path d="M32 24 16 40c-2 2-2 6 0 8s6 2 8 0l16-16" />
      <path d="M40 32c2-2 5-2 7 0s2 5 0 7l-6 6" />
    </svg>
  );
}
