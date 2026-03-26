'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2, X, RefreshCw } from 'lucide-react';
import TextBlock from '@/components/lessons/blocks/TextBlock';
import ScriptureBlock from '@/components/lessons/blocks/ScriptureBlock';
import PrimarySourceBlock from '@/components/lessons/blocks/PrimarySourceBlock';
import InvestigationBlock from '@/components/lessons/blocks/InvestigationBlock';
import QuizBlock from '@/components/lessons/blocks/QuizBlock';
import HandsOnBlock from '@/components/lessons/blocks/HandsOnBlock';
import PhotoBlock from '@/components/lessons/blocks/PhotoBlock';
import VideoBlock from '@/components/lessons/blocks/VideoBlock';
import FlashcardBlock from '@/components/lessons/blocks/FlashcardBlock';
import InfographicBlock from '@/components/lessons/blocks/InfographicBlock';
import GameBlock from '@/components/lessons/blocks/GameBlock';
import WorksheetBlock from '@/components/lessons/blocks/WorksheetBlock';
import ChoiceBlock from '@/components/lessons/blocks/ChoiceBlock';
import PromptBlock from '@/components/lessons/blocks/PromptBlock';

// Wide blocks that benefit from the expand overlay in narrow panels
const WIDE_BLOCK_TYPES = new Set([
  'infographic', 'investigation', 'primary_source', 'worksheet', 'game',
]);

const BLOCK_COMPONENTS: Record<string, React.ComponentType<any>> = {
  text: TextBlock,
  scripture: ScriptureBlock,
  primary_source: PrimarySourceBlock,
  investigation: InvestigationBlock,
  quiz: QuizBlock,
  'hands-on': HandsOnBlock,
  hands_on: HandsOnBlock,
  photo: PhotoBlock,
  video: VideoBlock,
  flashcards: FlashcardBlock,
  flashcard: FlashcardBlock,
  infographic: InfographicBlock,
  game: GameBlock,
  worksheet: WorksheetBlock,
  prompt: PromptBlock,
  choice: ChoiceBlock,
  branching_path: ChoiceBlock,
  // Fallback aliases for richer block types the orchestrator may emit
  interactive_concept: TextBlock,
  vocab_tooltip: TextBlock,
  source_gap: TextBlock,
};

interface LessonBlockProps {
  block: Record<string, unknown>;
  lessonId?: string;
}

export function LessonBlock({ block, lessonId }: LessonBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [teleported, setTeleported] = useState(false);
  const [diving, setDiving] = useState(false);

  // Teleport block to the left-pane StreamingLessonRenderer if the window bridge is registered.
  // Falls back to full inline rendering when the left pane isn't mounted (e.g. outside Journey page).
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__addLessonBlock) {
      (window as any).__addLessonBlock(block);
      setTeleported(true);
    }
  }, [block]);

  // Normalize block_type → type (lessonOrchestrator emits block_type, block components expect type)
  const normalized = { ...block, type: (block.type as string) || (block.block_type as string) };
  const blockType = normalized.type as string;
  const BlockComponent = BLOCK_COMPONENTS[blockType];

  if (!BlockComponent) return null;

  const handleResponse = async (response: unknown) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/lessons/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: block.block_id, response, lessonId }),
      });
      if (!res.ok) throw new Error(`Branch API returned ${res.status}`);
    } catch (err) {
      console.error('[LessonBlock] Branch API error:', err);
      setSaveError('Your answer could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  // Deep Dive: ask the branch API to generate follow-up blocks and push them to the left pane
  const handleDeepDive = async () => {
    setDiving(true);
    try {
      const res = await fetch('/api/lessons/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: block.block_id, response: { action: 'deep_dive' }, lessonId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.newBlocks)) {
          data.newBlocks.forEach((b: unknown) => (window as any).__addLessonBlock?.(b));
        }
      }
    } catch (err) {
      console.error('[LessonBlock] Deep Dive error:', err);
    } finally {
      setDiving(false);
    }
  };

  // When teleported to the left pane, show a subtle in-chat notification instead of the full block
  if (teleported) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#2F4731]/5 border border-[#2F4731]/20 text-xs text-[#2F4731] my-1">
        <span className="italic">
          <span>📋 </span>
          Adeline added a <strong>{blockType}</strong> block to your learning board →
        </span>
        <button
          onClick={handleDeepDive}
          disabled={diving}
          className="shrink-0 px-2 py-1 rounded-md bg-[#BD6809] text-white text-xs font-semibold hover:bg-[#2F4731] disabled:opacity-50 transition-colors"
        >
          {diving ? '…' : 'Dive Deeper'}
        </button>
      </div>
    );
  }

  const isWide = WIDE_BLOCK_TYPES.has(blockType);

  const content = (
    <div className="relative max-w-full overflow-x-auto">
      {/* Expand button for wide blocks */}
      {isWide && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Expand to full screen"
          className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/80 hover:bg-white border border-[#E7DAC3] text-[#2F4731] transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      )}
      <BlockComponent blockData={normalized} onResponse={handleResponse} lessonId={lessonId} />
      {saving && (
        <div className="flex items-center gap-1 mt-1 text-xs text-[#BD6809]">
          <RefreshCw className="w-3 h-3 animate-spin" /> Saving…
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          <span>{saveError}</span>
          <button
            onClick={() => { setSaveError(null); }}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Inline block (always rendered) */}
      <div className="my-2 w-full animate-[fadeSlideIn_0.4s_ease-out]">
        {content}
      </div>

      {/* Full-screen overlay for wide blocks */}
      {expanded && (
        <div
          className="fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl overflow-auto p-6"
          style={{ border: '2px solid #2F4731' }}
        >
          <button
            onClick={() => setExpanded(false)}
            aria-label="Close full screen"
            className="absolute top-3 right-3 p-1 rounded-full bg-[#2F4731] text-white hover:bg-[#BD6809] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <BlockComponent blockData={normalized} onResponse={handleResponse} lessonId={lessonId} />
        </div>
      )}
    </>
  );
}
