'use client';

import React, { useState } from 'react';
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

interface DynamicLessonViewerProps {
  contentBlocks: any[];
  lessonTitle?: string;
  subjectTrack?: string;
  scriptureFoundation?: any;
  credits?: any[];
  onComplete?: (results: any) => void;
  sessionState?: any;
  lessonId?: string;
  className?: string;
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  quizAnswers: Array<{ question: string; correct: boolean; userAnswer?: string }>;
}

/**
 * DynamicLessonViewer - Master renderer for all lesson block types
 * 
 * Renders the full lesson with field notes aesthetic and branching logic
 */
export function DynamicLessonViewer({ 
  contentBlocks, 
  lessonTitle,
  subjectTrack,
  scriptureFoundation,
  credits,
  onComplete,
  sessionState,
  lessonId,
  className = '' 
}: DynamicLessonViewerProps) {
  const [studentResponses, setStudentResponses] = useState<Record<string, any>>({});
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>(
    contentBlocks.map(b => b.block_id)
  );

  // Block type to component mapping
  const blockComponents: Record<string, React.ComponentType<any>> = {
    text: TextBlock,
    scripture: ScriptureBlock,
    primary_source: PrimarySourceBlock,
    investigation: InvestigationBlock,
    quiz: QuizBlock,
    'hands-on': HandsOnBlock,   // hyphen matches LessonBlock type
    hands_on: HandsOnBlock,     // underscore alias for legacy blocks
    photo: PhotoBlock,
    video: VideoBlock,
    flashcards: FlashcardBlock, // plural matches assessmentAgent output
    flashcard: FlashcardBlock,  // singular alias for legacy blocks
    infographic: InfographicBlock,
    game: GameBlock,
    worksheet: WorksheetBlock,
    // New block types from contentAgent — render content via TextBlock until dedicated components exist
    prompt: TextBlock,
    choice: TextBlock,
    interactive_concept: TextBlock,
    branching_path: TextBlock,
    source_gap: TextBlock,
  };

  const handleResponse = (blockId: string, response: any) => {
    setStudentResponses(prev => ({
      ...prev,
      [blockId]: response
    }));

    // Check for branching logic
    const block = contentBlocks.find(b => b.block_id === blockId);
    if (block?.branching) {
      handleBranching(block, response);
    }
  };

  const handleBranching = (block: any, response: any) => {
    // Quiz score branching
    if (response.score !== undefined && block.branching.on_score_above_80) {
      if (response.score > 80) {
        setVisibleBlocks(prev => [
          ...prev,
          ...(block.branching.on_score_above_80.show_blocks || [])
        ]);
      }
    }
    
    if (response.score !== undefined && block.branching.on_score_below_70) {
      if (response.score < 70) {
        setVisibleBlocks(prev => [
          ...prev,
          ...(block.branching.on_score_below_70.show_blocks || [])
        ]);
      }
    }
    
    // Choice-based branching
    if (response.choice && block.branching.branches) {
      const chosenBranch = block.branching.branches[response.choice];
      if (chosenBranch?.insert_blocks) {
        setVisibleBlocks(prev => [...prev, ...chosenBranch.insert_blocks]);
      }
    }
  };

  const renderBlock = (block: any) => {
    const BlockComponent = blockComponents[block.block_type as keyof typeof blockComponents];
    
    if (!BlockComponent) {
      console.warn(`Unknown block type: ${block.block_type}`);
      return null;
    }

    if (!visibleBlocks.includes(block.block_id)) {
      return null;
    }

    // For quiz blocks, promote metadata.conceptId to top-level and pass lessonId
    const blockProps = block.block_type === 'quiz'
      ? { ...block, conceptId: block.conceptId ?? block.metadata?.conceptId }
      : block;

    return (
      <BlockComponent
        key={block.block_id}
        blockData={blockProps}
        lessonId={lessonId}
        onResponse={(response: any) => handleResponse(block.block_id, response)}
        studentResponse={studentResponses[block.block_id]}
      />
    );
  };

  return (
    <div className="field-notes-wrapper">
      <div className="paper-texture"></div>
      <div className="field-notes-content">
        {/* Scripture Banner */}
        {scriptureFoundation && (
          <div className="scripture-banner">
            <div className="banner-decoration-left">
              <svg viewBox="0 0 24 24" width="50" height="50">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
              </svg>
            </div>
            <div className="scripture-text">
              <span className="reference">{scriptureFoundation.primary_passage}</span>
              <span className="divider">•</span>
              <span>{scriptureFoundation.connection}</span>
            </div>
            <div className="banner-decoration-right">
              <svg viewBox="0 0 24 24" width="50" height="50">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        )}

        {/* Lesson Header */}
        {lessonTitle && (
          <div className="lesson-header">
            <div className="decorative-line-left"></div>
            <h1 className="lesson-title">{lessonTitle}</h1>
            <div className="decorative-line-right"></div>
          </div>
        )}

        {/* Subject Badge */}
        {subjectTrack && (
          <div className="subject-badge">
            {subjectTrack.replace(/-/g, ' ')}
          </div>
        )}

        {/* Learning Objectives */}
        {contentBlocks.some(b => b.block_type === 'text') && (
          <div className="objectives-box">
            <h3>Today's Investigation:</h3>
            <ul>
              {contentBlocks
                .filter(b => b.block_type === 'text')
                .slice(0, 3)
                .map((block, i) => (
                  <li key={i}>{block.content.slice(0, 100)}...</li>
                ))}
            </ul>
          </div>
        )}

        {/* Render all blocks */}
        <div className="lesson-blocks">
          {contentBlocks
            .sort((a, b) => a.order - b.order)
            .map(renderBlock)}
        </div>

        {/* Credits Footer */}
        {credits && (
          <div className="lesson-footer">
            <div className="credits-earned">
              <h4>Credits Earned:</h4>
              {credits.map((credit: any, i: number) => (
                <div key={i} className="credit-item">
                  <span className="credit-subject">{credit.subject}</span>
                  <span className="credit-hours">{credit.hours} hours</span>
                </div>
              ))}
            </div>
            
            <div className="footer-decorations">
              <svg className="wheat-icon" viewBox="0 0 24 24">
                <path d="M12 2L8 6l4 4 4-4-4-4zm0 8l-4 4 4 4 4-4-4-4z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Quiz block renderer component (can be used standalone)
export function QuizBlockRenderer({ 
  quiz, 
  onAnswer, 
  showResult = false,
  selectedAnswer 
}: {
  quiz: any;
  onAnswer?: (answer: string) => void;
  showResult?: boolean;
  selectedAnswer?: string;
}) {
  if (quiz.block_type !== 'quiz') return null;

  const isCorrect = selectedAnswer === quiz.answer;

  return (
    <div className="quiz-block">
      <h3 className="font-semibold text-gray-800">{quiz.question}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quiz.options?.map((option: any, index: any) => (
          <button
            key={index}
            onClick={() => onAnswer?.(option)}
            disabled={showResult}
            className={`p-3 text-left border-2 rounded-lg transition-all ${
              showResult
                ? option === quiz.answer
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : selectedAnswer === option
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
                : selectedAnswer === option
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                showResult && option === quiz.answer
                  ? 'border-green-500 bg-green-500'
                  : showResult && selectedAnswer === option && option !== quiz.answer
                  ? 'border-red-500 bg-red-500'
                  : selectedAnswer === option && !showResult
                  ? 'border-amber-500 bg-amber-500'
                  : 'border-gray-300'
              }`}>
                {(selectedAnswer === option || (showResult && option === quiz.answer)) && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <span className="text-sm">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
