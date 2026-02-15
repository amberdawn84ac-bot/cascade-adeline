import React from 'react';
import { IllustrationProps } from './types';

export function Beehive({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M24 52h16c4 0 7-3 7-7 0-2-1-4-2-5 2-2 2-5 0-7 1-1 2-3 2-5 0-4-3-7-7-7H24c-4 0-7 3-7 7 0 2 1 4 2 5-2 2-2 5 0 7-1 1-2 3-2 5 0 4 3 7 7 7Z" />
      <path d="M22 28h20" />
      <path d="M20 40h24" />
      <path d="M26 34h12" />
      <path d="M30 44h4" />
      <path d="M32 18v-4" />
      <path d="M26 18h12" />
      <path d="M14 52h36" />
    </svg>
  );
}
