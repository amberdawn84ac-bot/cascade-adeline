import React from 'react';
import { IllustrationProps } from './types';

export function Sunflower({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <circle cx="32" cy="28" r="8" />
      <path d="M32 10v6" />
      <path d="M20 16l4 4" />
      <path d="M12 28h6" />
      <path d="M20 40l4-4" />
      <path d="M32 46v-6" />
      <path d="M44 40l-4-4" />
      <path d="M52 28h-6" />
      <path d="M44 16l-4 4" />
      <path d="M32 46c0 6-2 10-6 12" />
      <path d="M32 46c0 6 2 10 6 12" />
    </svg>
  );
}
