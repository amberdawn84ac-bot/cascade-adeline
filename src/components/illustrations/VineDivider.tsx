import React from 'react';
import { IllustrationProps } from './types';

export function VineDivider({ size = 24, color = 'currentColor', className }: IllustrationProps) {
  const height = size / 3;
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 120 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 12c8 6 20 6 28 0s20-6 28 0 20 6 28 0 20-6 28 0" />
      <path d="M20 12c0-4-2-7-6-8 2 3 2 6 0 8" />
      <path d="M44 12c0 4-2 7-6 8 2-3 2-6 0-8" />
      <path d="M68 12c0-4-2-7-6-8 2 3 2 6 0 8" />
      <path d="M92 12c0 4-2 7-6 8 2-3 2-6 0-8" />
    </svg>
  );
}
