import React from 'react';
import { IllustrationProps } from './types';

export function BarnSilhouette({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M14 52V26l18-12 18 12v26H14Z" />
      <path d="M24 52V36h16v16" />
      <path d="M20 30h4" />
      <path d="M40 30h4" />
      <path d="M28 44h8" />
      <path d="M28 40h8" />
      <path d="M32 18v-4" />
    </svg>
  );
}
