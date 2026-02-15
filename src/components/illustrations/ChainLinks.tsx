import React from 'react';
import { IllustrationProps } from './types';

export function ChainLinks({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <rect x="14" y="30" width="18" height="10" rx="5" />
      <rect x="32" y="24" width="18" height="10" rx="5" />
      <path d="M32 35h4" />
      <path d="M32 29h4" />
      <path d="M46 29c4 0 6-2 6-5" />
      <path d="M18 40c0 3 2 5 6 5" />
    </svg>
  );
}
