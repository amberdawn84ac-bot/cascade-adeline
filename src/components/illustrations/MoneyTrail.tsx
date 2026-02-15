import React from 'react';
import { IllustrationProps } from './types';

export function MoneyTrail({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M14 46c6-4 12-6 18-6 8 0 14 3 18 6" />
      <path d="M18 36c4-3 9-4 14-4 6 0 12 2 18 6" />
      <path d="M26 26c3-2 7-3 12-3 6 0 12 2 18 6" />
      <path d="M20 18c2-1 5-2 8-2 8 0 15 4 22 10" />
      <circle cx="22" cy="18" r="3" />
      <circle cx="26" cy="26" r="3" />
      <circle cx="18" cy="36" r="3" />
      <circle cx="14" cy="46" r="3" />
      <circle cx="46" cy="22" r="3" />
      <circle cx="52" cy="30" r="3" />
      <circle cx="48" cy="40" r="3" />
    </svg>
  );
}
