'use client';

import { motion } from 'framer-motion';
import { WheatDivider } from '@/components/illustrations';

type Props = {
  label: string;
};

export function DateDivider({ label }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '24px 0 16px',
      }}
    >
      <div style={{ flex: 1, height: 1, background: '#E7DAC3' }} />
      <span style={{
        fontFamily: '"Emilys Candy", cursive',
        color: '#BD6809',
        fontSize: '1.1rem',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: '#E7DAC3' }} />
    </motion.div>
  );
}
