import React from 'react';
import { IllustrationProps } from './types';

export function Acorn({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M24 22h16" />
      <path d="M28 16h8" />
      <path d="M32 22c10 0 16 6 12 16-3 8-9 14-12 14s-9-6-12-14c-4-10 2-16 12-16Z" />
      <path d="M32 22c0-4-1-7-4-10" />
      <path d="M32 22c0-4 1-7 4-10" />
    </svg>
  );
}
