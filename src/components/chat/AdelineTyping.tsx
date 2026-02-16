'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WheatStalk } from '@/components/illustrations';

const THINKING_MESSAGES = [
  "Hmm, let me think about that...",
  "Connecting the dots...",
  "Checking my library...",
  "Following the learning trail...",
  "One moment, gathering wisdom...",
];

const INTENT_MESSAGES: Record<string, string> = {
  LIFE_LOG: "Mapping your activity to learning standards...",
  INVESTIGATE: "Following the money... 🔍",
  BRAINSTORM: "Dreaming up possibilities...",
  REFLECT: "Preparing thoughtful questions...",
};

type Props = {
  intent?: string;
};

export function AdelineTyping({ intent }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 3000);

    const timeInterval = setInterval(() => {
      setLoadingTime((t) => t + 1);
    }, 1000);

    const progressTimer = setTimeout(() => setShowProgress(true), 3000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      clearTimeout(progressTimer);
    };
  }, []);

  const message = intent ? INTENT_MESSAGES[intent] : THINKING_MESSAGES[messageIndex];

  return (
    <div data-testid="adeline-typing" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <WheatStalk size={32} color="#BD6809" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: '#FFFEF7',
          border: '1px solid #E7DAC3',
          borderRadius: '0 14px 14px 14px',
          padding: '12px 16px',
          maxWidth: 320,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ x: [-100, 400] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 100,
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div style={{
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
          color: '#121B13',
          marginBottom: 8,
          position: 'relative',
        }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#BD6809',
              }}
            />
          ))}
        </div>

        {showProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: 12, fontSize: 12, color: '#4B3424' }}
          >
            {loadingTime < 5 && "Understanding your question..."}
            {loadingTime >= 5 && loadingTime < 8 && "Searching my knowledge..."}
            {loadingTime >= 8 && "Crafting a thoughtful response..."}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
