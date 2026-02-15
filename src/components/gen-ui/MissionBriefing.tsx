import React from 'react';
import { DottedArrow, Compass } from '../illustrations';

export type MissionBriefingProps = {
  title: string;
  objective: string;
  steps: string[];
  riskNote?: string;
};

const PAPAYA = '#BD6809';
const PALM = '#2F4731';
const CREAM = '#FFFDF7';

export function MissionBriefing({ title, objective, steps, riskNote }: MissionBriefingProps) {
  return (
    <div
      style={{
        background: CREAM,
        border: `1px solid ${PAPAYA}33`,
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 12, color: PAPAYA }}>
        <Compass size={22} color={PAPAYA} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: PAPAYA, fontWeight: 700, marginBottom: 6 }}>
        <DottedArrow size={120} color={PAPAYA} />
      </div>
      <div style={{ color: '#121B13', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#4B3424', marginBottom: 10 }}>Objective: {objective}</div>
      <div style={{ display: 'grid', gap: 6, marginBottom: riskNote ? 8 : 0 }}>
        {steps.map((step, idx) => (
          <div
            key={`${step}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '8px 10px',
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #F2E7CC',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ color: PALM, fontWeight: 700, minWidth: 20 }}>{idx + 1}.</span>
            <span style={{ color: '#121B13', lineHeight: 1.4 }}>{step}</span>
          </div>
        ))}
      </div>
      {riskNote ? <div style={{ color: '#9A3F4A', fontStyle: 'italic' }}>Watch for: {riskNote}</div> : null}
    </div>
  );
}
