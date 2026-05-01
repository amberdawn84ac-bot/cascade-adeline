'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

export interface MnemonicCardProps {
  concept: string;
  items: string[];
  mnemonic: string;
  mnemonicType: 'acronym' | 'phrase' | 'story' | 'visual';
  breakdown?: Array<{ letter: string; item: string }>;
  tip?: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const DEEP_PURPLE = '#6A4C93';

export function MnemonicCard({
  concept,
  items,
  mnemonic,
  mnemonicType,
  breakdown,
  tip,
}: MnemonicCardProps) {
  const [showItems, setShowItems] = useState(false);

  const typeLabel: Record<string, string> = {
    acronym: '🔤 Acronym',
    phrase: '💬 Phrase',
    story: '📖 Story',
    visual: '🎨 Visual',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${DEEP_PURPLE}40`,
        borderRadius: 16,
        padding: '20px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Brain size={20} color={DEEP_PURPLE} />
        <div style={{ color: DEEP_PURPLE, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
          Memory Aid · {typeLabel[mnemonicType]}
        </div>
      </div>
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>
        {concept}
      </div>

      {/* Mnemonic display */}
      <div style={{
        background: `${DEEP_PURPLE}10`,
        border: `2px solid ${DEEP_PURPLE}40`,
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ color: DEEP_PURPLE, fontWeight: 700, fontSize: '1.4rem', letterSpacing: 2 }}>
          {mnemonic}
        </div>
      </div>

      {/* Breakdown (acronym letters) */}
      {breakdown && breakdown.length > 0 && (
        <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
          {breakdown.map(({ letter, item }, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#FFFFFF',
                border: '1px solid #E7DAC3',
                borderRadius: 10,
                padding: '8px 12px',
              }}
            >
              <div style={{
                background: DEEP_PURPLE,
                color: '#fff',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                flexShrink: 0,
              }}>
                {letter}
              </div>
              <div style={{ color: PALM, fontWeight: 600, fontSize: '0.9rem' }}>{item}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Collapsible item list */}
      <button
        onClick={() => setShowItems(!showItems)}
        aria-label={showItems ? 'Hide full list' : 'Show full list'}
        style={{
          background: 'none',
          border: `1px solid ${PAPAYA}60`,
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          color: PAPAYA,
          fontWeight: 600,
          fontSize: '0.82rem',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: showItems ? 10 : 0,
        }}
      >
        {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showItems ? 'Hide' : 'Show'} the full list ({items.length} items)
      </button>

      {showItems && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            background: '#F0E8D8',
            border: '1px solid #E7DAC3',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 12,
          }}
        >
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {items.map((item, idx) => (
              <li key={idx} style={{ color: PALM, fontSize: '0.88rem', marginBottom: 4 }}>{item}</li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Tip */}
      {tip && (
        <div style={{
          marginTop: 10,
          background: `${PAPAYA}15`,
          border: `1px solid ${PAPAYA}40`,
          borderRadius: 10,
          padding: '8px 12px',
          color: '#4B3424',
          fontSize: '0.84rem',
          fontStyle: 'italic',
        }}>
          💡 {tip}
        </div>
      )}
    </motion.div>
  );
}
