'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import {
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
  Timeline,
} from './index';

type GenUIPayload = {
  component: string;
  props: Record<string, any>;
};

const componentMap: Record<string, React.ComponentType<any>> = {
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
  Timeline,
};

const INTENT_BORDER_COLORS: Record<string, string> = {
  TranscriptCard: '#BD6809',
  InvestigationBoard: '#3D1419',
  ProjectImpactCard: '#2F4731',
  MissionBriefing: '#9A3F4A',
  Timeline: '#6366F1',
};

function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('GenUIRenderer ErrorBoundary caught an error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function GenUIRenderer({ payload }: { payload: GenUIPayload | null }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    if (payload?.component === 'TranscriptCard') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [payload?.component]);

  if (!payload) return null;

  // Validate payload structure
  if (!payload || typeof payload !== 'object' || !payload.component) {
    console.warn('Invalid GenUI payload:', payload);
    return null;
  }

  const Component = componentMap[payload.component];
  if (!Component) {
    console.warn(`Unknown GenUI component type: ${payload.component}`);
    return (
      <div style={{
        padding: '16px',
        border: '1px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0',
        color: '#d63031',
        fontSize: '14px'
      }}>
        Unknown component type: {payload.component}
      </div>
    );
  }

  const borderColor = INTENT_BORDER_COLORS[payload.component] || '#BD6809';

  return (
    <ErrorBoundary
      fallback={
        <div style={{
          padding: '16px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#d63031',
          fontSize: '14px'
        }}>
          Failed to render {payload.component}. The component might be malformed.
        </div>
      }
    >
      <>
        {showConfetti && (
          <Confetti
            numberOfPieces={50}
            recycle={false}
            colors={['#BD6809', '#FFD700', '#9A3F4A', '#2F4731']}
          />
        )}
        <motion.div
          data-genui-type={payload.component}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
          }}
        >
          <Component {...payload.props} />
        </motion.div>
      </>
    </ErrorBoundary>
  );
}
