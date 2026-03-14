'use client';

import { motion } from 'framer-motion';

export interface ProgressRingProps {
  label: string;
  current: number;
  total: number;
  unit?: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function ProgressRing({ label, current, total, unit = 'items' }: ProgressRingProps) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        padding: '20px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, textAlign: 'center' }}>
        {label}
      </div>

      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#E7DAC3"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={PAPAYA}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ color: PAPAYA, fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
            {percentage}%
          </div>
          <div style={{ color: '#4B3424', fontSize: '0.75rem', marginTop: 4 }}>
            {current} / {total}
          </div>
        </div>
      </div>

      <div style={{
        color: '#4B3424',
        fontSize: '0.9rem',
        marginTop: 16,
        textAlign: 'center',
        opacity: 0.8,
      }}>
        {current} of {total} {unit} completed
      </div>
    </motion.div>
  );
}
