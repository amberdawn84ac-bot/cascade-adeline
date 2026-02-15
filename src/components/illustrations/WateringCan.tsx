import React from 'react';
import { IllustrationProps } from './types';

export function WateringCan({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M18 38c0-4 3-7 7-7h14c4 0 7 3 7 7v8H18v-8Z" />
      <path d="M32 31v-6c0-6-6-11-12-8" />
      <path d="M46 38c4 0 8-2 10-6l2-4" />
      <path d="M52 30l-6 2" />
      <path d="M24 46v4" />
      <path d="M40 46v4" />
    </svg>
  );
}
