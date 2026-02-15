import React from 'react';
import { IllustrationProps } from '../illustrations';

export type CalloutBoxProps = {
  color?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function CalloutBox({ color = '#BD6809', icon, children, className }: CalloutBoxProps) {
  return (
    <div
      className={className}
      style={{
        background: '#FFFBEF',
        borderLeft: `4px solid ${color}`,
        padding: '12px 14px',
        borderRadius: 12,
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        position: 'relative',
        color: '#121B13',
        lineHeight: 1.5,
      }}
    >
      {icon ? (
        <div style={{ position: 'absolute', top: 8, right: 10, color }}>
          {icon}
        </div>
      ) : null}
      {children}
    </div>
  );
}
