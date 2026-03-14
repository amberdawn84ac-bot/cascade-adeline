'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface FlashcardProps {
  term: string;
  definition: string;
  example?: string;
  category?: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function Flashcard({ term, definition, example, category }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      style={{
        perspective: '1000px',
        cursor: 'pointer',
        minHeight: 200,
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: CREAM,
            border: `2px solid ${PAPAYA}`,
            borderRadius: 16,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          {category && (
            <div style={{
              background: `${PAPAYA}20`,
              color: PAPAYA,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 16,
            }}>
              {category}
            </div>
          )}
          <div style={{ color: PALM, fontWeight: 700, fontSize: '1.5rem', textAlign: 'center' }}>
            {term}
          </div>
          <div style={{ color: '#4B3424', fontSize: '0.85rem', marginTop: 16, opacity: 0.6 }}>
            Click to flip
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: CREAM,
            border: `2px solid ${PALM}`,
            borderRadius: 16,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transform: 'rotateY(180deg)',
            minHeight: 200,
          }}
        >
          <div style={{ color: PALM, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5, marginBottom: example ? 12 : 0 }}>
            {definition}
          </div>
          {example && (
            <div style={{
              background: '#F0E8D8',
              border: `1px solid ${PAPAYA}40`,
              borderRadius: 10,
              padding: '10px 12px',
              marginTop: 12,
            }}>
              <div style={{ color: PAPAYA, fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>
                EXAMPLE
              </div>
              <div style={{ color: '#4B3424', fontSize: '0.9rem', fontStyle: 'italic' }}>
                {example}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
