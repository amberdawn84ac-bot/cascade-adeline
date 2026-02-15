import React from 'react';
import { IllustrationProps } from './types';

export function WheatDivider({ size = 24, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size / 3}
      viewBox="0 0 120 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 12h100" />
      <path d="M24 12c-4 0-6-3-6-6" />
      <path d="M24 12c4 0 6-3 6-6" />
      <path d="M18 12c-4 0-6-3-6-6" />
      <path d="M18 12c4 0 6-3 6-6" />
      <path d="M96 12c-4 0-6 3-6 6" />
      <path d="M96 12c4 0 6 3 6 6" />
      <path d="M102 12c-4 0-6 3-6 6" />
      <path d="M102 12c4 0 6 3 6 6" />
    </svg>
  );
}
