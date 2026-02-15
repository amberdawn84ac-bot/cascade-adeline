import React from 'react';
import { VineDivider } from '../illustrations';

export type ProjectStage = 'BRAINSTORM' | 'ACTIVE' | 'COMPLETED' | 'SHOWCASED';

export type ProjectImpactCardProps = {
  title: string;
  serviceGoal: string;
  beneficiaries: string;
  stage: ProjectStage;
};

const PALM = '#2F4731';
const GRAY = '#C7C7C7';
const CREAM = '#FFFDF7';

const STAGES: ProjectStage[] = ['BRAINSTORM', 'ACTIVE', 'COMPLETED', 'SHOWCASED'];

export function ProjectImpactCard({ title, serviceGoal, beneficiaries, stage }: ProjectImpactCardProps) {
  const currentIndex = STAGES.indexOf(stage);

  return (
    <div
      style={{
        background: CREAM,
        border: `1px solid ${PALM}26`,
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <style>{`
        @keyframes pulseStep {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ color: PALM, fontWeight: 700, fontSize: '1rem' }}>Project Impact</div>
        <VineDivider size={80} color={PALM} />
      </div>
      <div style={{ color: '#121B13', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#4B3424', marginBottom: 4 }}>Service goal: {serviceGoal}</div>
      <div style={{ color: '#4B3424', marginBottom: 12 }}>Who it helps: {beneficiaries}</div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 2, background: '#E4E0D8', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: -6,
                right: 0,
                bottom: -6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {STAGES.map((s, idx) => {
                const completed = idx < currentIndex;
                const current = idx === currentIndex;
                const color = completed || current ? PALM : GRAY;
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${color}`,
                        background: completed ? PALM : current ? `${PALM}22` : '#FFFFFF',
                        animation: current ? 'pulseStep 1200ms ease-in-out infinite' : undefined,
                      }}
                    />
                    <div style={{ color: '#121B13', fontSize: '0.75rem', fontWeight: current ? 700 : 500 }}>{s}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
