'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ThumbsUp, TrendingUp } from 'lucide-react';
import { useGenUITelemetry } from '@/hooks/useGenUITelemetry';
import { useGenUIRemediation } from '@/contexts/GenUIRemediationContext';

export interface CalibratedQuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  glow: string;
  grow: string;
  onAnswer?: (isCorrect: boolean, confidence: 'guessing' | 'somewhat' | 'sure') => void;
  // Pedagogical state props
  componentId?: string;
  difficultyLevel?: 'intro' | 'standard' | 'challenge';
  isScaffolded?: boolean;
  maxAttempts?: number;
}

type Stage = 'answer' | 'confidence' | 'result';

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

const CONFIDENCE_LEVELS = [
  { key: 'guessing' as const, label: 'Guessing', emoji: '🤷', color: '#DC3545' },
  { key: 'somewhat' as const, label: 'Somewhat sure', emoji: '🤔', color: PAPAYA },
  { key: 'sure' as const, label: 'Very sure', emoji: '💪', color: '#28A745' },
];

export function CalibratedQuiz({
  question,
  options,
  correctIndex,
  glow,
  grow,
  onAnswer,
  componentId = `quiz-${Date.now()}`,
  difficultyLevel = 'standard',
  isScaffolded = false,
  maxAttempts = 3,
}: CalibratedQuizProps) {
  const [stage, setStage] = useState<Stage>('answer');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<'guessing' | 'somewhat' | 'sure' | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Dual dispatch hooks
  const { dispatch: dispatchTelemetry } = useGenUITelemetry(componentId, 'CalibratedQuiz');
  const { requestRemediation } = useGenUIRemediation();

  const isCorrect = selectedIndex === correctIndex;

  const handleSelectAnswer = (idx: number) => {
    if (stage !== 'answer') return;
    setSelectedIndex(idx);
    setStage('confidence');
  };

  const handleSelectConfidence = (level: 'guessing' | 'somewhat' | 'sure') => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    setConfidence(level);
    setStage('result');
    
    const correct = selectedIndex === correctIndex;
    
    // Fire legacy callback
    onAnswer?.(correct, level);
    
    // DUAL DISPATCH:
    // 1. Fire-and-forget telemetry for persistent mastery tracking
    dispatchTelemetry({
      type: correct ? 'complete' : 'attempt',
      correct,
      attemptNumber: newAttemptCount,
      score: correct ? 100 : 0,
      timeMs: Date.now() - startTimeRef.current,
      difficultyLevel,
      isScaffolded,
      metadata: { confidence: level },
    });
    
    // 2. Real-time remediation if student is struggling
    // Trigger if: wrong answer + high confidence (misconception) OR multiple failures
    if (!correct) {
      if (level === 'sure') {
        // Confidently wrong — clear misconception, request immediate help
        requestRemediation({
          type: 'concept_confused',
          componentType: 'CalibratedQuiz',
          componentId,
          misconception: `Student was confident but wrong on: "${question}"`,
        });
      } else if (newAttemptCount >= maxAttempts) {
        // Multiple failures — student is stuck
        requestRemediation({
          type: 'student_stuck',
          componentType: 'CalibratedQuiz',
          componentId,
          failedAttempts: newAttemptCount,
          concept: question,
        });
      }
    }
  };

  const calibrationNote = () => {
    if (!confidence) return null;
    if (isCorrect && confidence === 'sure') return { text: 'Solid mastery — you knew it and got it right!', color: '#28A745' };
    if (isCorrect && confidence === 'guessing') return { text: 'Lucky guess! Review this concept to build real confidence.', color: PAPAYA };
    if (!isCorrect && confidence === 'sure') return { text: 'Confidently wrong — this is a key learning moment! Revise your mental model.', color: '#DC3545' };
    return { text: 'Good self-awareness — keep building on this concept.', color: PAPAYA };
  };

  const note = calibrationNote();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        padding: '18px 20px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      {/* Question */}
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.05rem', marginBottom: 14, lineHeight: 1.4 }}>
        {question}
      </div>

      {/* Stage: Answer */}
      <AnimatePresence mode="wait">
        {stage === 'answer' && (
          <motion.div key="answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  aria-label={`Option: ${option}`}
                  style={{
                    background: '#FFFFFF',
                    border: `2px solid #E7DAC3`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: PALM,
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = PAPAYA; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E7DAC3'; }}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stage: Confidence */}
        {stage === 'confidence' && (
          <motion.div key="confidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{
              background: '#F0E8D8',
              border: `1px solid ${PAPAYA}60`,
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              color: '#4B3424',
              fontSize: '0.88rem',
            }}>
              You chose: <strong style={{ color: PALM }}>{options[selectedIndex!]}</strong>
            </div>
            <div style={{ color: PALM, fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
              How confident were you in that answer?
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {CONFIDENCE_LEVELS.map((level) => (
                <button
                  key={level.key}
                  onClick={() => handleSelectConfidence(level.key)}
                  aria-label={`Confidence: ${level.label}`}
                  style={{
                    background: '#FFFFFF',
                    border: `2px solid ${level.color}40`,
                    borderRadius: 12,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: PALM,
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${level.color}10`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{level.emoji}</span>
                  {level.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stage: Result */}
        {stage === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Answer reveal */}
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {options.map((option, idx) => {
                const isSelected = idx === selectedIndex;
                const isCorrectOption = idx === correctIndex;
                const showCorrect = isCorrectOption;
                const showWrong = isSelected && !isCorrect;

                return (
                  <div
                    key={idx}
                    style={{
                      background: showCorrect ? '#D4EDDA' : showWrong ? '#F8D7DA' : '#FFFFFF',
                      border: `2px solid ${showCorrect ? '#28A745' : showWrong ? '#DC3545' : '#E7DAC3'}`,
                      borderRadius: 12,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: !isSelected && !isCorrectOption ? 0.5 : 1,
                    }}
                  >
                    {showCorrect && <CheckCircle size={18} color="#28A745" />}
                    {showWrong && <XCircle size={18} color="#DC3545" />}
                    <span style={{ color: PALM, fontWeight: isSelected || isCorrectOption ? 700 : 400, fontSize: '0.92rem' }}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calibration note */}
            {note && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: `${note.color}15`,
                  border: `1px solid ${note.color}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 12,
                  fontSize: '0.85rem',
                  color: PALM,
                }}
              >
                {note.text}
              </motion.div>
            )}

            {/* Glow */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: '#D4EDDA',
                border: '1px solid #28A745',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ThumbsUp size={14} color="#28A745" />
                <span style={{ color: '#28A745', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Glow ✨
                </span>
              </div>
              <div style={{ color: PALM, fontSize: '0.9rem', lineHeight: 1.4 }}>{glow}</div>
            </motion.div>

            {/* Grow */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                background: '#FFF3CD',
                border: `1px solid ${PAPAYA}`,
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <TrendingUp size={14} color={PAPAYA} />
                <span style={{ color: PAPAYA, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Grow 🌱
                </span>
              </div>
              <div style={{ color: PALM, fontSize: '0.9rem', lineHeight: 1.4 }}>{grow}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
