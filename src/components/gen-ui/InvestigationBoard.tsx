'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChainLinks, MoneyTrail } from '../illustrations';

export type SourceType = 'PRIMARY' | 'CURATED' | 'SECONDARY' | 'MAINSTREAM';

export type InvestigationBoardProps = {
  topic: string;
  sources: Array<{ title: string; snippet: string; type: SourceType }>;
};

const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const PARADISE = '#9A3F4A';
const MAINSTREAM = '#7C7C7C';
const FUSCHIA = '#C9186F';
const CREAM = '#FFFDF7';

function typeColor(type: SourceType) {
  switch (type) {
    case 'PRIMARY':
      return PALM;
    case 'CURATED':
      return PAPAYA;
    case 'SECONDARY':
      return PARADISE;
    default:
      return MAINSTREAM;
  }
}

export function InvestigationBoard({ topic, sources }: InvestigationBoardProps) {
  const Icon = sources.length % 2 === 0 ? ChainLinks : MoneyTrail;
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: CREAM,
        border: `1px solid ${FUSCHIA}33`,
        borderLeft: `4px solid ${FUSCHIA}`,
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 12, color: FUSCHIA }}>
        <Icon size={24} color={FUSCHIA} />
      </div>
      <div style={{ color: FUSCHIA, fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Investigation</div>
      <div style={{ color: '#121B13', fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }}>{topic}</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {sources.map((src, idx) => (
          <motion.div
            key={`${src.title}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            style={{
              border: `1px solid ${typeColor(src.type)}40`,
              borderRadius: 12,
              padding: '10px 12px',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: '#121B13', fontWeight: 700 }}>{src.title}</div>
              <span
                style={{
                  background: `${typeColor(src.type)}12`,
                  color: typeColor(src.type),
                  padding: '3px 8px',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {src.type}
              </span>
            </div>
            <div style={{ color: '#4B3424', lineHeight: 1.4, fontSize: '0.95rem' }}>{src.snippet}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
