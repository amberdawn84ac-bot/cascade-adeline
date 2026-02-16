'use client';

import { motion } from 'framer-motion';
import { WateringCan, Compass, Lightbulb, OpenBook } from '@/components/illustrations';

type ErrorType = 'RATE_LIMIT' | 'NETWORK' | 'TIMEOUT' | 'CONTENT_BLOCKED' | 'UNKNOWN';

type ErrorConfig = {
  title: string;
  message: string;
  illustration: React.ReactNode;
  actions: Array<{ label: string; primary?: boolean; action?: string }>;
};

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  RATE_LIMIT: {
    title: "Whoa there, eager learner!",
    message: "You're asking questions faster than I can answer. Let's take a breath—I'll be ready in a moment. ⏰",
    illustration: <WateringCan size={80} color="#BD6809" />,
    actions: [{ label: "Wait for me", primary: true }],
  },
  NETWORK: {
    title: "Hmm, seems like we lost connection",
    message: "Check your internet and we'll pick right back up! 📡",
    illustration: <Compass size={80} color="#BD6809" />,
    actions: [
      { label: "Try Again", primary: true, action: 'retry' },
      { label: "Start Fresh", action: 'clear' },
    ],
  },
  TIMEOUT: {
    title: "That question made me think too hard!",
    message: "Let's try rephrasing it, or I can help break it into smaller pieces. 🤔",
    illustration: <Lightbulb size={80} color="#BD6809" />,
    actions: [
      { label: "Rephrase", primary: true, action: 'retry' },
      { label: "Get Help", action: 'suggest' },
    ],
  },
  CONTENT_BLOCKED: {
    title: "Let's keep our conversation focused on learning!",
    message: "I appreciate your curiosity, but ask me about anything from baking bread to building rockets. 🚀",
    illustration: <OpenBook size={80} color="#2F4731" />,
    actions: [{ label: "Got it!", primary: true }],
  },
  UNKNOWN: {
    title: "Oh dear! Something went sideways.",
    message: "Don't worry—your work is safe. Let's try that again.",
    illustration: <WateringCan size={80} color="#BD6809" />,
    actions: [
      { label: "Try Again", primary: true, action: 'retry' },
    ],
  },
};

function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  if (message.includes('rate limit') || message.includes('429')) return 'RATE_LIMIT';
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) return 'NETWORK';
  if (message.includes('timeout') || message.includes('aborted')) return 'TIMEOUT';
  if (message.includes('blocked') || message.includes('moderat')) return 'CONTENT_BLOCKED';
  return 'UNKNOWN';
}

type Props = {
  error: Error;
  onRetry?: () => void;
  onClear?: () => void;
};

export function ErrorDisplay({ error, onRetry, onClear }: Props) {
  const errorType = detectErrorType(error);
  const config = ERROR_CONFIGS[errorType];

  const handleAction = (action?: string) => {
    switch (action) {
      case 'retry':
        onRetry?.();
        break;
      case 'clear':
        onClear?.();
        break;
      default:
        onRetry?.();
    }
  };

  return (
    <motion.div
      data-testid="error-display"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 24,
        background: '#FFF3CD',
        border: '2px solid #BD6809',
        borderRadius: 16,
        textAlign: 'center',
        margin: '16px 0',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        {config.illustration}
      </div>

      <h3 style={{
        fontFamily: '"Emilys Candy", cursive',
        color: '#2F4731',
        fontSize: '1.5rem',
        marginBottom: 12,
      }}>
        {config.title}
      </h3>

      <p style={{
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        color: '#4B3424',
        fontSize: '1.1rem',
        margin: '12px 0 24px',
      }}>
        {config.message}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {config.actions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleAction(action.action)}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: action.primary ? 'none' : '2px solid #2F4731',
              background: action.primary ? '#BD6809' : '#FFFFFF',
              color: action.primary ? '#FFF' : '#2F4731',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Kalam, "Comic Sans MS", system-ui',
              fontSize: 16,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
