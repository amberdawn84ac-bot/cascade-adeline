'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIPS = [
  { icon: "💡", text: "Did you know? You can upload photos of your projects for instant credits!" },
  { icon: "🌾", text: "Tip: Ask me 'who profits from...' to investigate any topic." },
  { icon: "📚", text: "Try saying 'I want to reflect on my week' for guided self-assessment." },
  { icon: "🎨", text: "Your learning is automatically tracked—check your transcript anytime!" },
  { icon: "⚡", text: "Pro tip: The more specific your description, the better credits I can award." },
  { icon: "🔍", text: "I can search my library of trusted Christian resources for any topic." },
  { icon: "🌱", text: "Every project should help someone—service learning is built in!" },
  { icon: "📖", text: "Want to explore Greek or Hebrew? Ask about any Bible verse!" },
  { icon: "🏆", text: "Building a portfolio? All your work is saved for compliance reports." },
  { icon: "🤝", text: "Join clubs to connect with other homeschool families!" },
];

type Props = {
  show: boolean;
};

export function WaitingTips({ show }: Props) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const tip = TIPS[tipIndex];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(189,104,9,0.1)',
          border: '1px solid rgba(189,104,9,0.3)',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
          color: '#4B3424',
        }}
      >
        <span style={{ marginRight: 8, fontSize: 16 }}>{tip.icon}</span>
        {tip.text}
      </motion.div>
    </AnimatePresence>
  );
}
