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
    // content agent block types — fall back to TextBlock for display
    prompt: TextBlock,
    choice: TextBlock,
    branching_path: TextBlock,
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
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 64 64" className="w-full h-full animate-bounce">
              {/* Bee icon */}
              <ellipse cx="32" cy="36" rx="14" ry="18" fill="#FFD700" />
              <rect x="18" y="28" width="28" height="3" fill="#000" opacity="0.8" />
              <rect x="18" y="36" width="28" height="3" fill="#000" opacity="0.8" />
              <rect x="18" y="44" width="28" height="3" fill="#000" opacity="0.8" />
              <circle cx="32" cy="20" r="8" fill="#FFD700" />
              <circle cx="28" cy="19" r="2" fill="#000" />
              <circle cx="36" cy="19" r="2" fill="#000" />
              <ellipse cx="22" cy="26" rx="8" ry="12" fill="#fff" opacity="0.6" />
              <ellipse cx="42" cy="26" rx="8" ry="12" fill="#fff" opacity="0.6" />
            </svg>
          </div>
          <p className="text-amber-800 text-lg font-medium">
            Chat with Adeline to start your lesson!
          </p>
          <p className="text-amber-600 text-sm mt-2">
            Click the bee bubble in the bottom right corner
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="field-notes-wrapper min-h-screen">
      <div className="paper-texture"></div>
      <div className="field-notes-content max-w-4xl mx-auto px-4 py-8">
        {/* Scripture Banner */}
        {lessonMetadata?.scripture_foundation && (
          <div className="scripture-banner mb-8">
            <div className="banner-decoration-left">
              <svg viewBox="0 0 24 24" width="50" height="50">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
              </svg>
            </div>
            <div className="scripture-text">
              <span className="reference">{lessonMetadata.scripture_foundation.primary_passage}</span>
              <span className="divider">•</span>
              <span>{lessonMetadata.scripture_foundation.connection}</span>
            </div>
            <div className="banner-decoration-right">
              <svg viewBox="0 0 24 24" width="50" height="50">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        )}

        {/* Lesson Header */}
        {lessonMetadata?.title && (
          <div className="lesson-header mb-6">
            <div className="decorative-line-left"></div>
            <h1 className="lesson-title text-3xl font-bold text-amber-900">{lessonMetadata.title}</h1>
            <div className="decorative-line-right"></div>
          </div>
        )}

        {/* Subject Badge */}
        {lessonMetadata?.subject_track && (
          <div className="subject-badge mb-6">
            {lessonMetadata.subject_track.replace(/-/g, ' ')}
          </div>
        )}

        {/* Learning Objectives */}
        {lessonMetadata?.learning_objectives && (
          <div className="objectives-box mb-8">
            <h3 className="font-semibold text-lg mb-3">Today's Investigation:</h3>
            <ul className="space-y-2">
              {lessonMetadata.learning_objectives.map((obj: string, i: number) => (
                <li key={i} className="text-amber-900">{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Render all blocks */}
        <div className="lesson-blocks space-y-6">
          {blocks.map(renderBlock)}
        </div>

        {/* Streaming indicator */}
        {blocks.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-amber-600 text-sm">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span>Adeline is preparing more content...</span>
            </div>
          </div>
        )}

        {/* Credits Footer */}
        {lessonMetadata?.credits && lessonMetadata.credits.length > 0 && (
          <div className="lesson-footer mt-12">
            <div className="credits-earned">
              <h4 className="font-semibold text-lg mb-3">Credits Earned:</h4>
              {lessonMetadata.credits.map((credit: any, i: number) => (
                <div key={i} className="credit-item flex justify-between">
                  <span className="credit-subject">{credit.subject}</span>
                  <span className="credit-hours">{credit.hours} hours</span>
                </div>
              ))}
            </div>
            
            <div className="footer-decorations mt-6 text-center">
              <svg className="wheat-icon inline-block w-8 h-8 text-amber-600" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2L8 6l4 4 4-4-4-4zm0 8l-4 4 4 4 4-4-4-4z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
