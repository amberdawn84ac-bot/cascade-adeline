import React from 'react';
import { IllustrationProps } from './types';

export function BraidedRope({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M6 18c6-8 12-8 18 0s12 8 18 0 12-8 18 0 12 8 18 0 12-8 18 0" />
      <path d="M12 6c6 8 12 8 18 0s12-8 18 0 12 8 18 0 12-8 18 0 12 8 18 0" />
    </svg>
  );
}
