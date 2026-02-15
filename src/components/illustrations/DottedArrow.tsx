import React from 'react';
import { IllustrationProps } from './types';

export function DottedArrow({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M10 12h70" strokeDasharray="2 6" />
      <path d="M88 12l-8-6" />
      <path d="M88 12l-8 6" />
      <path d="M88 12h22" />
    </svg>
  );
}
