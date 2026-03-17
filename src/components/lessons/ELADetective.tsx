'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, Lightbulb, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ELADetectiveProps {
  passage: string;
  task: 'main-idea' | 'supporting-evidence' | 'vocabulary';
  correctAnswers: string[]; // Array of correct sentence indices or words
  instructions: string;
  onComplete?: () => void;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';
const EMERALD = '#2F7A54';

export function ELADetective({
  passage,
  task,
  correctAnswers,
  instructions,
  onComplete,
}: ELADetectiveProps) {
  const sentences = passage.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  const [selectedSentences, setSelectedSentences] = useState<Set<number>>(new Set());
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleSentenceClick = (index: number) => {
    if (result === 'correct') return;

    setSelectedSentences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
    setResult(null);
  };

  const handleCheckAnswer = () => {
    setIsChecking(true);
    setAttempts(prev => prev + 1);

    setTimeout(() => {
      const selectedIndices = Array.from(selectedSentences).map(String);
      const isCorrect = 
        selectedIndices.length === correctAnswers.length &&
        selectedIndices.every(idx => correctAnswers.includes(idx));

      setResult(isCorrect ? 'correct' : 'incorrect');
      setIsChecking(false);

      if (isCorrect && onComplete) {
        setTimeout(() => onComplete(), 1000);
      }
    }, 500);
  };

  const handleReset = () => {
    setSelectedSentences(new Set());
    setResult(null);
  };

  const getTaskIcon = () => {
    switch (task) {
      case 'main-idea':
        return <Target style={{ width: 20, height: 20, color: PAPAYA }} />;
      case 'supporting-evidence':
        return <Lightbulb style={{ width: 20, height: 20, color: PAPAYA }} />;
      case 'vocabulary':
        return <BookOpen style={{ width: 20, height: 20, color: PAPAYA }} />;
    }
  };

  const getTaskTitle = () => {
    switch (task) {
      case 'main-idea':
        return 'Find the Main Idea';
      case 'supporting-evidence':
        return 'Identify Supporting Evidence';
      case 'vocabulary':
        return 'Vocabulary Detective';
    }
  };

  return (
    <div style={{
      background: CREAM,
      border: `2px solid ${PALM}40`,
      borderRadius: 16,
      padding: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: `2px solid ${PALM}20`,
      }}>
        {getTaskIcon()}
        <h3 style={{
          color: PALM,
          fontWeight: 700,
          fontSize: '1.1rem',
          margin: 0,
        }}>
          {getTaskTitle()}
        </h3>
      </div>

      {/* Instructions */}
      <div style={{
        background: `${PAPAYA}10`,
        border: `2px solid ${PAPAYA}40`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <p style={{
          color: PALM,
          fontSize: '0.95rem',
          lineHeight: 1.6,
          margin: 0,
          fontWeight: 500,
        }}>
          {instructions}
        </p>
      </div>

      {/* Interactive Passage */}
      <div style={{
        background: '#FFFFFF',
        border: `2px solid ${PALM}20`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sentences.map((sentence, index) => {
            const isSelected = selectedSentences.has(index);
            const isCorrect = result === 'correct' && isSelected;
            const isIncorrect = result === 'incorrect' && isSelected && !correctAnswers.includes(String(index));
            const shouldBeSelected = result === 'incorrect' && correctAnswers.includes(String(index));

            return (
              <motion.div
                key={index}
                onClick={() => handleSentenceClick(index)}
                whileHover={{ scale: result === 'correct' ? 1 : 1.02 }}
                whileTap={{ scale: result === 'correct' ? 1 : 0.98 }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  cursor: result === 'correct' ? 'default' : 'pointer',
                  background: isCorrect
                    ? `${EMERALD}20`
                    : isIncorrect
                    ? '#FEE2E2'
                    : shouldBeSelected
                    ? `${EMERALD}10`
                    : isSelected
                    ? `${PAPAYA}20`
                    : 'transparent',
                  border: `2px solid ${
                    isCorrect
                      ? EMERALD
                      : isIncorrect
                      ? '#DC2626'
                      : shouldBeSelected
                      ? EMERALD
                      : isSelected
                      ? PAPAYA
                      : 'transparent'
                  }`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    color: `${PALM}60`,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    minWidth: 20,
                  }}>
                    {index + 1}.
                  </span>
                  <p style={{
                    color: PALM,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    margin: 0,
                    flex: 1,
                  }}>
                    {sentence}
                  </p>
                  {isSelected && !result && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: PAPAYA,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle style={{ width: 12, height: 12, color: '#FFFFFF' }} />
                    </motion.div>
                  )}
                  {isCorrect && (
                    <CheckCircle style={{ width: 20, height: 20, color: EMERALD }} />
                  )}
                  {isIncorrect && (
                    <XCircle style={{ width: 20, height: 20, color: '#DC2626' }} />
                  )}
                  {shouldBeSelected && (
                    <div style={{
                      padding: '2px 8px',
                      background: EMERALD,
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: 4,
                    }}>
                      CORRECT
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selection Counter */}
      <div style={{
        marginBottom: 16,
        textAlign: 'center',
        color: `${PALM}60`,
        fontSize: '0.85rem',
        fontWeight: 600,
      }}>
        {selectedSentences.size} sentence{selectedSentences.size !== 1 ? 's' : ''} selected
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleCheckAnswer}
          disabled={selectedSentences.size === 0 || isChecking || result === 'correct'}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: result === 'correct' ? EMERALD : PAPAYA,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.95rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: selectedSentences.size === 0 || isChecking || result === 'correct' ? 'not-allowed' : 'pointer',
            opacity: selectedSentences.size === 0 || isChecking || result === 'correct' ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {result === 'correct' ? (
            <>
              <CheckCircle style={{ width: 16, height: 16 }} />
              Correct!
            </>
          ) : (
            'Check Answer'
          )}
        </button>

        {attempts > 0 && result !== 'correct' && (
          <button
            onClick={handleReset}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              color: PALM,
              border: `2px solid ${PALM}40`,
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginTop: 16,
              padding: 12,
              background: result === 'correct' ? `${EMERALD}20` : '#FEF3E7',
              border: `2px solid ${result === 'correct' ? EMERALD : PAPAYA}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {result === 'correct' ? (
              <>
                <CheckCircle style={{ width: 20, height: 20, color: EMERALD }} />
                <span style={{ color: EMERALD, fontWeight: 600, fontSize: '0.9rem' }}>
                  Excellent detective work! You've identified the key sentences.
                </span>
              </>
            ) : (
              <>
                <Lightbulb style={{ width: 20, height: 20, color: PAPAYA }} />
                <span style={{ color: PALM, fontWeight: 600, fontSize: '0.9rem' }}>
                  Not quite. Look at the highlighted sentences above - those are the correct ones. Try again!
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attempt Counter */}
      {attempts > 0 && (
        <div style={{
          marginTop: 12,
          textAlign: 'center',
          color: `${PALM}60`,
          fontSize: '0.8rem',
        }}>
          Attempts: {attempts}
        </div>
      )}
    </div>
  );
}
