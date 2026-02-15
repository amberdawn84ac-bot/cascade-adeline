import React from 'react';
import { IllustrationProps } from './types';

export function MasonJar({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M24 10h16" />
      <path d="M24 10v4h16v-4" />
      <path d="M26 14v2" />
      <path d="M38 14v2" />
      <path d="M26 16c-6 2-8 6-8 8v20c0 4 2 6 6 6h16c4 0 6-2 6-6V24c0-2-2-6-8-8" />
      <path d="M28 28h8" />
      <path d="M26 34h12" />
      <path d="M24 50c0 2 2 4 4 4h8c2 0 4-2 4-4" />
    </svg>
  );
}
