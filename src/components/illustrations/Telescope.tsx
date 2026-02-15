import React from 'react';
import { IllustrationProps } from './types';

export function Telescope({ size = 24, color = 'currentColor', className }: IllustrationProps) {
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
      <path d="M14 26 46 14l4 10-32 12-4-10Z" />
      <path d="M42 48 32 34" />
      <path d="M26 52 34 34" />
      <path d="M46 16l6-2" />
      <path d="M12 24l-4 2" />
    </svg>
  );
}
