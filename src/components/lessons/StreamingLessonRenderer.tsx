'use client';

import React, { useState, useEffect } from 'react';
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

export function StreamingLessonRenderer({ userId, onBlockResponse }: StreamingLessonRendererProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [lessonMetadata, setLessonMetadata] = useState<any>(null);
  const [studentResponses, setStudentResponses] = useState<Record<string, any>>({});
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>([]);
  const [lessonId, setLessonId] = useState<string | null>(null);

  // Block type to component mapping
  const blockComponents: Record<string, React.ComponentType<any>> = {
    text: TextBlock,
    scripture: ScriptureBlock,
    primary_source: PrimarySourceBlock,
    investigation: InvestigationBlock,
    quiz: QuizBlock,
    // hands-on activity (hyphen from activityAgent)
    'hands-on': HandsOnBlock,
    hands_on: HandsOnBlock,
    photo: PhotoBlock,
    video: VideoBlock,
    // flashcards (plural) from assessmentAgent
    flashcards: FlashcardBlock,
    flashcard: FlashcardBlock,
    infographic: InfographicBlock,
    game: GameBlock,
    worksheet: WorksheetBlock,
    // Interactive block types
    prompt: PromptBlock,
    choice: ChoiceBlock,
    branching_path: ChoiceBlock,
    // Remaining content-agent types fall back to TextBlock
    interactive_concept: TextBlock,
    vocab_tooltip: TextBlock,
    source_gap: TextBlock,
  };

  // Add new blocks as they stream in
  const addBlock = (block: any) => {
    setBlocks(prev => {
      // Check if block already exists
      if (prev.some(b => b.block_id === block.block_id)) {
        return prev;
      }
      return [...prev, block].sort((a, b) => a.order - b.order);
    });
    
    // Make block visible immediately
    setVisibleBlocks(prev => {
      if (prev.includes(block.block_id)) return prev;
      return [...prev, block.block_id];
    });
  };

  // Expose addBlock function globally for FloatingBeeBubble
  useEffect(() => {
    (window as any).__addLessonBlock = addBlock;
    (window as any).__setLessonMetadata = (metadata: any) => {
      setLessonMetadata(metadata);
      // Extract lessonId from metadata if available
      if (metadata?.lessonId) {
        setLessonId(metadata.lessonId);
      }
    };
    
    return () => {
      delete (window as any).__addLessonBlock;
      delete (window as any).__setLessonMetadata;
    };
  }, []);

  const handleResponse = async (blockId: string, response: any) => {
    setStudentResponses(prev => ({
      ...prev,
      [blockId]: response
    }));

    // Send response to server for BKT update and branching
    if (onBlockResponse) {
      onBlockResponse(blockId, response);
    }

    // Handle branching from quiz response
    if (response.newBlocks && response.newBlocks.length > 0) {
      // Add new blocks from branching
      console.log('[StreamingLessonRenderer] Adding branched blocks:', response.newBlocks);
      setVisibleBlocks(prev => [...prev, ...response.newBlocks]);
      
      // Optionally fetch full block data if needed
      // For now, assume blocks are already in the lesson or will be streamed
    }

    // Legacy branching API call (keeping for backwards compatibility)
    try {
      const result = await fetch('/api/lessons/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          blockId,
          response,
          currentBlocks: blocks.map(b => b.block_id)
        })
      }).then(r => r.json());

      // Handle branching results
      if (result.showBlocks) {
        setVisibleBlocks(prev => [...prev, ...result.showBlocks]);
      }
      if (result.hideBlocks) {
        setVisibleBlocks(prev => prev.filter(id => !result.hideBlocks.includes(id)));
      }
      if (result.newBlocks) {
        result.newBlocks.forEach((block: any) => addBlock(block));
      }
    } catch (error) {
      // Don't log error if endpoint doesn't exist yet
      if (error instanceof Error && !error.message.includes('404')) {
        console.error('Branching error:', error);
      }
    }
  };

  const renderBlock = (block: any) => {
    // Blocks use `type`, not `block_type`
    const BlockComponent = blockComponents[block.type as string];
    
    if (!BlockComponent) {
      console.warn(`Unknown block type: ${block.block_type}`);
      return null;
    }

    if (!visibleBlocks.includes(block.block_id)) {
      return null;
    }

    // Special handling for QuizBlock to pass lessonId
    const props: any = {
      key: block.block_id,
      blockData: block,
      onResponse: (response: any) => handleResponse(block.block_id, response),
      studentResponse: studentResponses[block.block_id]
    };

    if (block.type === 'quiz' && lessonId) {
      props.lessonId = lessonId;
    }

    return <BlockComponent {...props} />;
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
      {/* Lesson Header */}
      {lessonMetadata?.title && (
        <div className="field-notes-journal-header">
          <h1 className="field-notes-journal-title">{lessonMetadata.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {lessonMetadata.subject_track && (
              <span className="field-notes-badge">
                {lessonMetadata.subject_track.replace(/-/g, ' ')}
              </span>
            )}
            {lessonMetadata.gradeLevel && (
              <span className="field-notes-badge">Grade {lessonMetadata.gradeLevel}</span>
            )}
          </div>
        </div>
      )}

      {/* Learning Objectives */}
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

      {/* Render all blocks */}
      <div className="space-y-4">
        {blocks.map(renderBlock)}
      </div>

      {/* Credits Footer */}
      {lessonMetadata?.credits && lessonMetadata.credits.length > 0 && (
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
