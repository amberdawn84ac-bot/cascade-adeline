'use client';

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export interface StepListProps {
  title: string;
  steps: Array<{
    number: number;
    instruction: string;
    tip?: string;
  }>;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function StepList({ title, steps }: StepListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        padding: '16px 18px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>
        {title}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                background: PAPAYA,
                color: CREAM,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}>
                {step.number}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: PALM, fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4, marginBottom: step.tip ? 8 : 0 }}>
                  {step.instruction}
                </div>
                {step.tip && (
                  <div style={{
                    background: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: 8,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <Lightbulb size={14} color={PAPAYA} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ color: '#856404', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      {step.tip}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
