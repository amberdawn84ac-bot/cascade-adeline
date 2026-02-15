import React from 'react';
import { IllustrationProps } from './types';

export function WheatStalk({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M32 10v44" />
      <path d="M32 16c-4 0-6-3-6-6" />
      <path d="M32 20c4 0 6-3 6-6" />
      <path d="M32 24c-5 0-8-3-8-7" />
      <path d="M32 28c5 0 8-3 8-7" />
      <path d="M32 32c-5 0-9-3-9-8" />
      <path d="M32 36c5 0 9-3 9-8" />
      <path d="M32 40c-4 0-7-3-7-7" />
      <path d="M32 44c4 0 7-3 7-7" />
      <path d="M26 50c2-3 4-4 6-4s4 1 6 4" />
    </svg>
  );
}
