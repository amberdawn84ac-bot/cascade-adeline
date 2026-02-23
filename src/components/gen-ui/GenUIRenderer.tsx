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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('GenUIRenderer ErrorBoundary caught an error:', error);
      setHasError(true);
      setError(error.error || new Error(String(error.message)));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('GenUIRenderer ErrorBoundary caught unhandled rejection:', event);
      setHasError(true);
      setError(new Error(String(event.reason)));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0',
        color: '#d63031',
        fontSize: '14px',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          ⚠️ Component Rendering Error
        </div>
        <div style={{ marginBottom: '8px' }}>
          {error?.message || 'An unknown error occurred while rendering this component.'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          Please try again or contact support if this persists.
        </div>
        {fallback}
      </div>
    );
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

  if (!payload) {
    console.log('[GenUIRenderer] No payload provided, returning null');
    return null;
  }

  // Enhanced payload validation
  if (!payload || typeof payload !== 'object') {
    console.warn('[GenUIRenderer] Invalid payload type:', typeof payload, payload);
    return (
      <div style={{
        padding: '12px',
        border: '1px solid #ffa502',
        borderRadius: '6px',
        backgroundColor: '#fff5e6',
        color: '#d63031',
        fontSize: '13px'
      }}>
        ⚠️ Invalid component data received
      </div>
    );
  }

  if (!payload.component) {
    console.warn('[GenUIRenderer] Payload missing component property:', payload);
    return (
      <div style={{
        padding: '12px',
        border: '1px solid #ffa502',
        borderRadius: '6px',
        backgroundColor: '#fff5e6',
        color: '#d63031',
        fontSize: '13px'
      }}>
        ⚠️ Component type not specified
      </div>
    );
  }

  const Component = componentMap[payload.component];
  if (!Component) {
    console.warn(`[GenUIRenderer] Unknown GenUI component type: ${payload.component}`);
    return (
      <div style={{
        padding: '16px',
        border: '1px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0',
        color: '#d63031',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          🚫 Unknown Component
        </div>
        <div>
          Component type: <code>{payload.component}</code>
        </div>
        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
          Available components: {Object.keys(componentMap).join(', ')}
        </div>
      </div>
    );
  }

  const borderColor = INTENT_BORDER_COLORS[payload.component] || '#BD6809';

  return (
    <ErrorBoundary
      fallback={
        <div style={{
          padding: '12px',
          border: '1px solid #ff6b6b',
          borderRadius: '6px',
          backgroundColor: '#ffe0e0',
          color: '#d63031',
          fontSize: '13px'
        }}>
          ⚠️ Content rendering failed
        </div>
      }
    >
      <>
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={100}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            border: `2px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '16px',
            margin: '16px 0',
            backgroundColor: '#FFFEF7',
            boxShadow: `0 4px 12px ${borderColor}20`,
          }}
        >
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: borderColor,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {payload.component}
          </div>
          <Component {...(payload.props || {})} />
        </motion.div>
      </>
    </ErrorBoundary>
  );
}
