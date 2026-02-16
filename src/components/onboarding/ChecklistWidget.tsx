'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

type ChecklistItem = {
  id: string;
  label: string;
  autoComplete?: boolean;
  intent?: string;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'meet', label: 'Meet Adeline', autoComplete: true },
  { id: 'life_log', label: 'Log your first activity', intent: 'LIFE_LOG' },
  { id: 'investigate', label: 'Explore an investigation', intent: 'INVESTIGATE' },
  { id: 'brainstorm', label: 'Start a project', intent: 'BRAINSTORM' },
  { id: 'reflect', label: 'Reflect on your learning', intent: 'REFLECT' },
];

type Props = {
  completedIntents?: string[];
};

export function ChecklistWidget({ completedIntents = [] }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set(['meet']));
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const newCompleted = new Set(completed);
    CHECKLIST_ITEMS.forEach((item) => {
      if (item.intent && completedIntents.includes(item.intent)) {
        newCompleted.add(item.id);
      }
    });
    if (newCompleted.size !== completed.size) {
      setCompleted(newCompleted);
    }
  }, [completedIntents, completed]);

  const progress = (completed.size / CHECKLIST_ITEMS.length) * 100;
  const allComplete = completed.size === CHECKLIST_ITEMS.length;

  useEffect(() => {
    if (allComplete && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [allComplete, showCelebration]);

  return (
    <>
      {showCelebration && <Confetti numberOfPieces={200} recycle={false} />}

      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        style={{
          position: 'fixed',
          right: 24,
          top: 100,
          width: expanded ? 320 : 80,
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          padding: 16,
          zIndex: 1000,
          transition: 'width 0.3s ease',
        }}
      >
        {expanded ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{
                fontFamily: '"Emilys Candy", cursive',
                color: '#2F4731',
                fontSize: '1.2rem',
                margin: 0,
              }}>
                Getting Started
              </h3>
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#4B3424',
                }}
              >
                −
              </button>
            </div>

            <div style={{
              height: 6,
              background: '#E7DAC3',
              borderRadius: 999,
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', background: '#BD6809' }}
              />
            </div>

            {CHECKLIST_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  opacity: completed.has(item.id) ? 0.6 : 1,
                  scale: completed.has(item.id) ? 0.98 : 1,
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid #E7DAC3',
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '2px solid #BD6809',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: completed.has(item.id) ? '#BD6809' : 'transparent',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {completed.has(item.id) && '✓'}
                </div>
                <span style={{
                  fontFamily: 'Kalam, "Comic Sans MS", system-ui',
                  color: '#121B13',
                  textDecoration: completed.has(item.id) ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </motion.div>
            ))}
          </>
        ) : (
          <div
            onClick={() => setExpanded(true)}
            style={{ cursor: 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#BD6809' }}>
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </motion.div>

      {allComplete && showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#FFFEF7',
            borderRadius: 24,
            padding: 40,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
            zIndex: 10000,
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 16 }}>🎉</div>
          <h2 style={{
            fontFamily: '"Emilys Candy", cursive',
            color: '#2F4731',
            fontSize: '2rem',
            marginBottom: 12,
          }}>
            You're Ready!
          </h2>
          <p style={{
            fontFamily: 'Kalam, "Comic Sans MS", system-ui',
            color: '#4B3424',
            fontSize: '1.1rem',
          }}>
            Now the real adventure begins.
          </p>
        </motion.div>
      )}
    </>
  );
}
