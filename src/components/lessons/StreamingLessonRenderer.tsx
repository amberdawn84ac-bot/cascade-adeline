'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TextBlock from './blocks/TextBlock';
import ScriptureBlock from './blocks/ScriptureBlock';
import PrimarySourceBlock from './blocks/PrimarySourceBlock';
import InvestigationBlock from './blocks/InvestigationBlock';
import QuizBlock from './blocks/QuizBlock';
import HandsOnBlock from './blocks/HandsOnBlock';
import PhotoBlock from './blocks/PhotoBlock';
import VideoBlock from './blocks/VideoBlock';
import FlashcardBlock from './blocks/FlashcardBlock';
import InfographicBlock from './blocks/InfographicBlock';
import GameBlock from './blocks/GameBlock';
import WorksheetBlock from './blocks/WorksheetBlock';
import ChoiceBlock from './blocks/ChoiceBlock';
import PromptBlock from './blocks/PromptBlock';

interface StreamingLessonRendererProps {
  userId: string;
  onBlockResponse?: (blockId: string, response: any) => void;
}

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
  interactive_concept: TextBlock,
  vocab_tooltip: TextBlock,
  source_gap: TextBlock,
};

export function StreamingLessonRenderer({ userId, onBlockResponse }: StreamingLessonRendererProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [lessonMetadata, setLessonMetadata] = useState<any>(null);
  const [studentResponses, setStudentResponses] = useState<Record<string, any>>({});
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>([]);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [branchingLabel, setBranchingLabel] = useState<string | null>(null);

  // Queue incoming blocks and reveal them one-at-a-time with a short delay
  const queueRef = useRef<any[]>([]);
  const processingRef = useRef(false);
  const blocksRef = useRef<any[]>([]);

  const revealNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    processingRef.current = true;
    const block = queueRef.current.shift()!;

    setBlocks(prev => {
      if (prev.some(b => b.block_id === block.block_id)) return prev;
      const next = [...prev, block].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      blocksRef.current = next;
      return next;
    });

    // Small delay between blocks so they appear one-by-one
    setTimeout(() => {
      setVisibleBlocks(prev => {
        if (prev.includes(block.block_id)) return prev;
        return [...prev, block.block_id];
      });
      // Reveal the next block after a bit more delay
      setTimeout(revealNext, 350);
    }, 80);
  }, []);

  const addBlock = useCallback((block: any) => {
    queueRef.current.push(block);
    if (!processingRef.current) revealNext();
  }, [revealNext]);

  // Expose addBlock and setLessonMetadata globally for useLessonStream
  useEffect(() => {
    (window as any).__addLessonBlock = addBlock;
    (window as any).__setLessonMetadata = (metadata: any) => {
      setLessonMetadata(metadata);
      if (metadata?.lessonId) setLessonId(metadata.lessonId);
    };
    return () => {
      delete (window as any).__addLessonBlock;
      delete (window as any).__setLessonMetadata;
    };
  }, [addBlock]);

  /** Stream follow-up content for a chosen path and reveal blocks inline. */
  const streamFollowUp = useCallback(async (choiceLabel: string, afterOrder: number) => {
    setBranchingLabel(choiceLabel);

    // Insert a visual divider so follow-up content starts below the choice
    addBlock({
      block_id: `branch-divider-${Date.now()}`,
      type: '_branch_divider',
      content: choiceLabel,
      order: afterOrder + 0.5,
    });

    const topic = lessonMetadata?.title
      ? `Going deeper on "${choiceLabel}" from the lesson about "${lessonMetadata.title}"`
      : `Going deeper on "${choiceLabel}"`;

    try {
      const res = await fetch('/api/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: topic,
          lessonId: `branch-${lessonId ?? Date.now()}-${Date.now()}`,
        }),
      });

      if (!res.ok) return;
      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let order = afterOrder + 1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'lesson_block') {
              const block = { ...data.block, order: order++ };
              if (!block.block_id) {
                block.block_id = `branch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              }
              addBlock(block);
            }
          } catch { /* ignore parse glitches */ }
        }
      }
    } finally {
      setBranchingLabel(null);
    }
  }, [addBlock, lessonId, lessonMetadata]);

  const handleResponse = useCallback(async (blockId: string, response: any) => {
    setStudentResponses(prev => ({ ...prev, [blockId]: response }));
    if (onBlockResponse) onBlockResponse(blockId, response);

    // Choice selected — stream follow-up for the chosen path
    if (response.label !== undefined && response.selected !== undefined) {
      const sourceBlock = blocksRef.current.find(b => b.block_id === blockId);
      const afterOrder = sourceBlock?.order ?? blocksRef.current.length;
      await streamFollowUp(response.label, afterOrder);
      return;
    }

    // Quiz / other responses — save via branch API for BKT update
    try {
      const result = await fetch('/api/lessons/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          blockId,
          response,
          currentBlocks: blocksRef.current.map(b => b.block_id),
          lessonId,
        }),
      }).then(r => r.json());

      if (result.showBlocks?.length) setVisibleBlocks(prev => [...prev, ...result.showBlocks]);
      if (result.hideBlocks?.length) setVisibleBlocks(prev => prev.filter(id => !result.hideBlocks.includes(id)));
      if (result.newBlocks?.length) result.newBlocks.forEach((b: any) => addBlock(b));
    } catch { /* branch API is optional */ }
  }, [userId, lessonId, onBlockResponse, addBlock, streamFollowUp]);

  const renderBlock = (block: any) => {
    if (!visibleBlocks.includes(block.block_id)) return null;

    // Branch divider
    if (block.type === '_branch_divider') {
      return (
        <div
          key={block.block_id}
          className="flex items-center gap-3 my-6 animate-[fadeSlideIn_0.4s_ease-out]"
        >
          <div className="flex-1 h-px bg-[#E7DAC3]" />
          <span className="text-xs font-bold text-[#BD6809] uppercase tracking-widest px-3 py-1 rounded-full bg-[#FAF5E4] border border-[#E7DAC3] shrink-0">
            ↳ {block.content}
          </span>
          <div className="flex-1 h-px bg-[#E7DAC3]" />
        </div>
      );
    }

    const BlockComponent = BLOCK_COMPONENTS[block.type as string];
    if (!BlockComponent) return null;

    const props: any = {
      key: block.block_id,
      blockData: block,
      onResponse: (response: any) => handleResponse(block.block_id, response),
      studentResponse: studentResponses[block.block_id],
    };
    if (block.type === 'quiz' && lessonId) props.lessonId = lessonId;

    return (
      <div
        key={block.block_id}
        className="animate-[fadeSlideIn_0.4s_ease-out]"
      >
        <BlockComponent {...props} />
      </div>
    );
  };

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#FFFEF7]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-[#BD6809]">
            <svg viewBox="0 0 24 24" className="w-full h-full animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-[#2F4731] text-lg font-medium">Adeline is preparing your lesson…</p>
          <div className="flex justify-center gap-1 mt-3">
            <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="field-notes-journal min-h-screen">
      {lessonMetadata?.title && (
        <div className="field-notes-journal-header">
          <h1 className="field-notes-journal-title">{lessonMetadata.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {lessonMetadata.subject_track && (
              <span className="field-notes-badge">{lessonMetadata.subject_track.replace(/-/g, ' ')}</span>
            )}
            {lessonMetadata.gradeLevel && (
              <span className="field-notes-badge">Grade {lessonMetadata.gradeLevel}</span>
            )}
          </div>
        </div>
      )}

      {lessonMetadata?.learning_objectives?.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-[#E7DAC3] bg-[#FAF5E4]">
          <h3 className="font-semibold text-[#2F4731] mb-2 text-sm uppercase tracking-wide">Today's Investigation</h3>
          <ul className="space-y-1">
            {lessonMetadata.learning_objectives.map((obj: string, i: number) => (
              <li key={i} className="text-[#121B13] text-sm flex gap-2">
                <span className="text-[#BD6809]">→</span>{obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {blocks.map(renderBlock)}
      </div>

      {/* Branching loading indicator */}
      {branchingLabel && (
        <div className="flex items-center gap-3 mt-6 p-4 rounded-xl border border-[#E7DAC3] bg-[#FAF5E4]">
          <div className="flex gap-1 shrink-0">
            <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#BD6809] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-[#2F4731]">
            Adeline is exploring <strong>{branchingLabel}</strong>…
          </span>
        </div>
      )}

      {lessonMetadata?.credits?.length > 0 && (
        <div className="mt-12 pt-6 border-t-2 border-[#E7DAC3]">
          <h4 className="font-semibold text-[#2F4731] text-lg mb-3">Credits Earned</h4>
          {lessonMetadata.credits.map((credit: any, i: number) => (
            <div key={i} className="flex justify-between py-2 border-b border-[#E7DAC3]">
              <span className="text-[#121B13]">{credit.subject}</span>
              <span className="text-[#BD6809] font-bold">{credit.hours} hrs</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
