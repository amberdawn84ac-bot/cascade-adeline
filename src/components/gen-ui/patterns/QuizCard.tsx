'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

export interface QuizCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function QuizCard({ question, options, correctIndex, explanation }: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
    setShowResult(true);
  };

  const isCorrect = selectedIndex === correctIndex;

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
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, lineHeight: 1.4 }}>
        {question}
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: showResult ? 12 : 0 }}>
        {options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectOption = idx === correctIndex;
          const showCorrect = showResult && isCorrectOption;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              style={{
                background: showCorrect ? '#D4EDDA' : showIncorrect ? '#F8D7DA' : '#FFFFFF',
                border: `2px solid ${showCorrect ? '#28A745' : showIncorrect ? '#DC3545' : '#E7DAC3'}`,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: showResult ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.2s',
                opacity: showResult && !isSelected && !isCorrectOption ? 0.5 : 1,
              }}
            >
              {showCorrect && <CheckCircle size={20} color="#28A745" />}
              {showIncorrect && <XCircle size={20} color="#DC3545" />}
              <span style={{ color: '#2F4731', fontWeight: isSelected ? 700 : 500, fontSize: '0.95rem' }}>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {showResult && explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            background: isCorrect ? '#D4EDDA' : '#FFF3CD',
            border: `1px solid ${isCorrect ? '#28A745' : PAPAYA}`,
            borderRadius: 10,
            padding: '10px 12px',
            marginTop: 12,
          }}
        >
          <div style={{ color: PALM, fontSize: '0.9rem', lineHeight: 1.4 }}>
            <strong>{isCorrect ? '✓ Correct!' : '✗ Not quite.'}</strong> {explanation}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
