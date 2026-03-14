'use client';

import { motion } from 'framer-motion';

export interface MathDisplayProps {
  problem: string;
  steps: Array<{
    equation: string;
    explanation: string;
  }>;
  finalAnswer: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function MathDisplay({ problem, steps, finalAnswer }: MathDisplayProps) {
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
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>
        {problem}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div style={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              color: PALM,
              fontWeight: 600,
              marginBottom: 6,
              letterSpacing: 1,
            }}>
              {step.equation}
            </div>
            <div style={{
              color: '#4B3424',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              paddingLeft: 8,
              borderLeft: `3px solid ${PAPAYA}40`,
            }}>
              {step.explanation}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: steps.length * 0.1 + 0.2 }}
        style={{
          background: `linear-gradient(135deg, ${PAPAYA}20 0%, ${PAPAYA}10 100%)`,
          border: `2px solid ${PAPAYA}`,
          borderRadius: 12,
          padding: '14px 16px',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ color: PAPAYA, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Final Answer
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '1.3rem',
          color: PALM,
          fontWeight: 700,
          letterSpacing: 1,
        }}>
          {finalAnswer}
        </div>
      </motion.div>
    </motion.div>
  );
}
