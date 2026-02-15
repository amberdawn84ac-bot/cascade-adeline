import React from 'react';
import { IllustrationProps } from './types';

export function CorporateBuilding({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <rect x="18" y="14" width="28" height="36" rx="2" />
      <path d="M14 50h36" />
      <path d="M26 22h4" />
      <path d="M34 22h4" />
      <path d="M26 30h4" />
      <path d="M34 30h4" />
      <path d="M26 38h4" />
      <path d="M34 38h4" />
      <path d="M28 50v-8h8v8" />
      <path d="M22 14V10h20v4" />
    </svg>
  );
}
