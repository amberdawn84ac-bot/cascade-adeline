import React from 'react';
import { OpenBook } from '../illustrations';

export type TranscriptCardProps = {
  activityName: string;
  mappedSubjects: string[];
  creditsEarned: number | string;
  extensionSuggestion?: string;
};

const PAPAYA = '#BD6809';
const CREAM = '#FFFDF7';

export function TranscriptCard({ activityName, mappedSubjects, creditsEarned, extensionSuggestion }: TranscriptCardProps) {
  return (
    <div
      style={{
        background: CREAM,
        borderLeft: `6px solid ${PAPAYA}`,
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        animation: 'stampPop 280ms ease-out',
      }}
    >
      <style>{`
        @keyframes stampPop {
          0% { transform: scale(0.7) rotate(-6deg); opacity: 0; }
          60% { transform: scale(1.05) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
      <div style={{ position: 'absolute', top: 10, right: 12, color: PAPAYA }}>
        <OpenBook size={26} color={PAPAYA} />
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2F4731', marginBottom: 6 }}>{activityName}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {mappedSubjects.map((subj) => (
          <span
            key={subj}
            style={{
              background: '#FFEBD7',
              color: PAPAYA,
              padding: '4px 8px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {subj}
          </span>
        ))}
      </div>
      <div style={{ color: '#121B13', fontWeight: 600, marginBottom: extensionSuggestion ? 6 : 0 }}>
        Credits earned: {creditsEarned}
      </div>
      {extensionSuggestion ? (
        <div style={{ color: '#4B3424', fontSize: '0.95rem' }}>Next step: {extensionSuggestion}</div>
      ) : null}
    </div>
  );
}
