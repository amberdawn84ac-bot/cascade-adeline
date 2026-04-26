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
import { HebrewStudyCard } from './HebrewStudyCard';
import { SkillUnlockedBadge } from '@/components/ui/gamification/SkillUnlockedBadge';
import { AnalogyCard } from '@/components/ui/learning/AnalogyCard';
import { ShareWidget } from '@/components/ui/collaboration/ShareWidget';
// Pattern library components
import { QuizCard } from './patterns/QuizCard';
import { BarChartCard } from './patterns/BarChartCard';
import { Flashcard } from './patterns/Flashcard';
import { TimelineCard } from './patterns/TimelineCard';
import { StepList } from './patterns/StepList';
import { CompareTable } from './patterns/CompareTable';
import { MathDisplay } from './patterns/MathDisplay';
import { ProgressRing } from './patterns/ProgressRing';
import { TrackBloom } from './patterns/TrackBloom';
// Lesson streaming GenUI components
import { LessonBlock } from './LessonBlock';
import InvestigationBlock from '@/components/lessons/blocks/InvestigationBlock';
import PrimarySourceBlock from '@/components/lessons/blocks/PrimarySourceBlock';
// Visual artifact components
import { InfographicPosterCard } from './visual-artifacts/InfographicPosterCard';
import { AnimalInfographicCard } from './visual-artifacts/AnimalInfographicCard';
import { IllustratedRecipeCard } from './visual-artifacts/IllustratedRecipeCard';
import { VisualDeepDiveCard } from './visual-artifacts/VisualDeepDiveCard';

type GenUIPayload = {
  component: string;
  props: Record<string, any>;
};

// Unified component registry - all GenUI components registered here
const componentMap: Record<string, React.ComponentType<any>> = {
  // Existing GenUI components
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
  Timeline,
  // Components from old component-registry.tsx
  HebrewStudyCard,
  HEBREW_STUDY: HebrewStudyCard,
  SkillUnlockedBadge,
  AnalogyCard,
  ShareWidget,
  // Pattern library components (8 new)
  QuizCard,
  BarChartCard,
  Flashcard,
  TimelineCard,
  StepList,
  CompareTable,
  MathDisplay,
  ProgressRing,
  TrackBloom,
  // Lesson streaming components — LessonBlock is the primary entry point;
  // InvestigationBlock / PrimarySourceBlock registered for direct surface if needed
  LessonBlock,
  InvestigationBlock,
  PrimarySourceBlock,
  // Visual artifact components
  InfographicPosterCard,
  AnimalInfographicCard,
  IllustratedRecipeCard,
  VisualDeepDiveCard,
};

const INTENT_BORDER_COLORS: Record<string, string> = {
  TranscriptCard: '#BD6809',
  InvestigationBoard: '#3D1419',
  ProjectImpactCard: '#2F4731',
  MissionBriefing: '#9A3F4A',
  Timeline: '#6366F1',
  LessonBlock: '#2F4731',              // Palm Frond — lesson content
  InvestigationBlock: '#3D1419',       // Fuschia — Follow the Money
  PrimarySourceBlock: '#9A3F4A',       // Paradise — primary sources
  InfographicPosterCard: '#2F4731',    // Palm Frond — visual learning
  AnimalInfographicCard: '#2F4731',    // Palm Frond — nature/science
  IllustratedRecipeCard: '#9A3F4A',    // Paradise — life skills
  VisualDeepDiveCard: '#2F4731',       // Palm Frond — hybrid lesson
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
  console.log('[GenUIRenderer] 🚀 GenUIRenderer called with payload:', payload);
  
  const [showConfetti, setShowConfetti] = useState(false);

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

  try {
    // Enhanced payload validation with safe parsing
    let parsedPayload = payload;
    
    // If payload is a string, try to parse it as JSON
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch (error) {
        console.error('[GenUIRenderer] Failed to parse payload string:', error);
        return <div className="text-red-500 text-xs border border-red-200 p-2 rounded">Failed to parse UI card data</div>;
      }
    }
    
    // If payload is an array of strings, parse each element safely
    if (Array.isArray(parsedPayload)) {
      try {
        parsedPayload = parsedPayload.map(item => {
          if (typeof item === 'string') {
            return JSON.parse(item);
          }
          return item;
        }).find(item => item && typeof item === 'object' && item.component) || null;
      } catch (error) {
        console.error('[GenUIRenderer] Failed to parse array payload:', error);
        return <div className="text-red-500 text-xs border border-red-200 p-2 rounded">Failed to parse UI card array</div>;
      }
    }

    // Validate parsed payload
    const Component = componentMap[parsedPayload.component];
    console.log('[GenUIRenderer] Component found:', Component, 'for component name:', parsedPayload.component);
    
    if (!Component) {
      console.error('[GenUIRenderer] Unknown component:', parsedPayload.component);
      return (
        <div className="text-red-500 text-xs border border-red-200 p-2 rounded">
          Unknown component: {parsedPayload.component}
        </div>
      );
    }

    const borderColor = INTENT_BORDER_COLORS[parsedPayload.component] || '#BD6809';
    console.log('[GenUIRenderer] Border color:', borderColor);

    return (
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
            {parsedPayload.component}
          </div>
          <Component {...(parsedPayload.props || {})} />
        </motion.div>
      </>
    );
  } catch (error) {
    console.error('[GenUIRenderer] Fatal error during rendering:', error);
    return <div className="text-red-500 text-xs border border-red-200 p-2 rounded">Failed to render UI card</div>;
  }
}

