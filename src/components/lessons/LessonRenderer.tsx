/**
 * Lesson Renderer Component
 * 
 * Renders structured lessons with field notes aesthetic,
 * progress tracking, and adaptive content.
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { LessonData, LessonBlock, StudentLessonProgress } from '@/types/lesson';

interface LessonRendererProps {
  lesson: LessonData;
  blocks: LessonBlock[];
  userId: string;
  onComplete?: (credits: any[]) => void;
}

export default function LessonRenderer({ 
  lesson, 
  blocks, 
  userId, 
  onComplete 
}: LessonRendererProps) {
  const [progress, setProgress] = useState<Record<string, StudentLessonProgress>>({});
  const [loading, setLoading] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());

  // Load existing progress
  useEffect(() => {
    loadProgress();
  }, [lesson.lessonId]);

  const loadProgress = async () => {
    try {
      const res = await fetch(`/api/lessons/progress?lessonId=${lesson.lessonId}`);
      if (res.ok) {
        const data = await res.json();
        const progressMap: Record<string, StudentLessonProgress> = {};
        const completed = new Set<string>();
        
        data.progress.forEach((p: StudentLessonProgress) => {
          progressMap[p.blockId] = p;
          if (p.completed) completed.add(p.blockId);
        });
        
        setProgress(progressMap);
        setCompletedBlocks(completed);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const updateProgress = async (blockId: string, updates: Partial<StudentLessonProgress>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.lessonId,
          blockId,
          ...updates
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProgress(prev => ({
          ...prev,
          [blockId]: data.progress
        }));

        if (data.progress.completed) {
          setCompletedBlocks(prev => new Set([...prev, blockId]));
        }

        // Check if lesson is complete
        if (data.lessonCompleted && data.creditsAwarded) {
          onComplete?.(data.creditsAwarded);
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBlock = (block: LessonBlock, index: number) => {
    const isCompleted = completedBlocks.has(block.id);
    const blockProgress = progress[block.id];

    return (
      <div key={block.id} className="mb-8">
        <div className={`field-notes-card ${isCompleted ? 'completed' : ''}`}>
          <div className="field-notes-header">
            <h3 className="field-notes-title">
              {block.title || `Block ${index + 1}`}
            </h3>
            {isCompleted && (
              <span className="field-notes-badge completed">✓ Completed</span>
            )}
          </div>
          
          <div className="field-notes-content">
            {renderBlockContent(block, blockProgress)}
          </div>
        </div>
      </div>
    );
  };

  const renderBlockContent = (block: LessonBlock, blockProgress?: StudentLessonProgress) => {
    switch (block.type) {
      case 'text':
        return <TextBlock block={block} progress={blockProgress} onUpdate={updateProgress} />;
      case 'scripture':
        return <ScriptureBlock block={block} progress={blockProgress} onUpdate={updateProgress} />;
      case 'primary_source':
        return <PrimarySourceBlock block={block} progress={blockProgress} onUpdate={updateProgress} />;
      case 'investigation':
        return <InvestigationBlock block={block} progress={blockProgress} onUpdate={updateProgress} />;
      case 'quiz':
        return <QuizBlock block={block} progress={blockProgress} onUpdate={updateProgress} />;
      case 'hands_on':
        return <HandsOnBlock block={block} progress={blockProgress} onUpdate={updateProgress} />;
      default:
        return <div className="text-gray-600">Unknown block type: {block.type}</div>;
    }
  };

  const progressPercentage = blocks.length > 0 ? (completedBlocks.size / blocks.length) * 100 : 0;

  return (
    <div className="lesson-renderer">
      {/* Field Notes Header */}
      <div className="field-notes-journal">
        <div className="field-notes-journal-header">
          <h1 className="field-notes-journal-title">{lesson.title}</h1>
          <div className="field-notes-meta">
            <span className="field-notes-subject">{lesson.subject}</span>
            <span className="field-notes-grade">Grade {lesson.gradeLevel}</span>
            <span className="field-notes-duration">{lesson.estimatedDuration} min</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="field-notes-progress">
          <div className="progress-header">
            <span>Lesson Progress</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="progress-details">
            {completedBlocks.size} of {blocks.length} blocks completed
          </div>
        </div>

        {/* Standards */}
        {lesson.standardsCodes.length > 0 && (
          <div className="field-notes-standards">
            <h4>Standards Covered:</h4>
            <div className="standards-list">
              {lesson.standardsCodes.map(code => (
                <span key={code} className="standard-tag">{code}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Blocks */}
      <div className="lesson-blocks">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Saving progress...</div>
        </div>
      )}
    </div>
  );
}

// Text Block Component
function TextBlock({ 
  block, 
  progress, 
  onUpdate 
}: { 
  block: LessonBlock; 
  progress?: StudentLessonProgress; 
  onUpdate: (blockId: string, updates: any) => void;
}) {
  const [isRead, setIsRead] = useState(progress?.completed || false);

  const handleMarkRead = () => {
    setIsRead(true);
    onUpdate(block.id, {
      completed: true,
      timeSpent: 120, // 2 minutes estimated
      response: { markedAsRead: true }
    });
  };

  return (
    <div className="text-block">
      <div className="prose prose-sm max-w-none field-notes-text">
        {typeof block.content === 'string' ? (
          <p>{block.content}</p>
        ) : (
          <div>{JSON.stringify(block.content)}</div>
        )}
      </div>
      
      {!isRead && (
        <button 
          onClick={handleMarkRead}
          className="field-notes-button primary"
        >
          Mark as Read
        </button>
      )}
      
      {isRead && (
        <div className="field-notes-feedback">
          <span className="checkmark">✓</span> Read and understood
        </div>
      )}
    </div>
  );
}

// Scripture Block Component
function ScriptureBlock({ 
  block, 
  progress, 
  onUpdate 
}: { 
  block: LessonBlock; 
  progress?: StudentLessonProgress; 
  onUpdate: (blockId: string, updates: any) => void;
}) {
  const [reflection, setReflection] = useState((progress?.response as any)?.reflection || '');
  const [isCompleted, setIsCompleted] = useState(progress?.completed || false);

  const interactive = block.interactive || {};
  const reference = interactive.reference || 'Unknown Reference';
  const passage = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);

  const handleSubmit = () => {
    if (reflection.trim?.()) {
      setIsCompleted(true);
      onUpdate(block.id, {
        completed: true,
        timeSpent: 300, // 5 minutes for reflection
        response: { reflection } as any
      });
    }
  };

  return (
    <div className="scripture-block">
      <div className="scripture-header">
        <h4 className="scripture-reference">{reference}</h4>
        {interactive.translation && (
          <span className="scripture-translation">{interactive.translation}</span>
        )}
      </div>
      
      <div className="scripture-passage field-notes-scripture">
        {passage}
      </div>
      
      {interactive.wordStudies && (
        <div className="word-studies">
          <h5>Word Studies:</h5>
          {Object.entries(interactive.wordStudies).map(([word, study]) => (
            <div key={word} className="word-study">
              <strong>{word}:</strong> {study?.meaning}
            </div>
          ))}
        </div>
      )}
      
      <div className="scripture-reflection">
        <h5>Reflection:</h5>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How does this passage speak to you?"
          className="field-notes-textarea"
          rows={3}
        />
      </div>
      
      {!isCompleted && (
        <button 
          onClick={handleSubmit}
          disabled={!reflection.trim()}
          className="field-notes-button primary"
        >
          Submit Reflection
        </button>
      )}
      
      {isCompleted && (
        <div className="field-notes-feedback">
          <span className="checkmark">✓</span> Reflection completed
        </div>
      )}
    </div>
  );
}

// Primary Source Block Component
function PrimarySourceBlock({ 
  block, 
  progress, 
  onUpdate 
}: { 
  block: LessonBlock; 
  progress?: StudentLessonProgress; 
  onUpdate: (blockId: string, updates: any) => void;
}) {
  const [analysis, setAnalysis] = useState((progress?.response as any)?.analysis || '');
  const [isCompleted, setIsCompleted] = useState(progress?.completed || false);

  const metadata = block.metadata || {};
  const interactive = block.interactive || {};

  const handleSubmit = () => {
    if (analysis.trim?.()) {
      setIsCompleted(true);
      onUpdate(block.id, {
        completed: true,
        timeSpent: 600, // 10 minutes for analysis
        response: { analysis } as any
      });
    }
  };

  return (
    <div className="primary-source-block">
      <div className="source-header">
        <h4>{(metadata as any)?.title || 'Primary Source'}</h4>
        {metadata.creator && <p className="source-creator">By {metadata.creator}</p>}
        {metadata.date && <p className="source-date">{metadata.date}</p>}
        {metadata.collection && <p className="source-collection">{metadata.collection}</p>}
      </div>
      
      <div className="source-content field-notes-document">
        {typeof block.content === 'string' ? block.content : JSON.stringify(block.content)}
      </div>
      
      {interactive.investigationPrompts && (
        <div className="investigation-prompts">
          <h5>Questions for Investigation:</h5>
          <ul className="prompts-list">
            {interactive.investigationPrompts.map((prompt, i) => (
              <li key={i}>{prompt}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="source-analysis">
        <h5>Your Analysis:</h5>
        <textarea
          value={analysis}
          onChange={(e) => setAnalysis(e.target.value)}
          placeholder="What do you observe in this document? What questions does it raise?"
          className="field-notes-textarea"
          rows={4}
        />
      </div>
      
      {!isCompleted && (
        <button 
          onClick={handleSubmit}
          disabled={!analysis.trim()}
          className="field-notes-button primary"
        >
          Submit Analysis
        </button>
      )}
      
      {isCompleted && (
        <div className="field-notes-feedback">
          <span className="checkmark">✓</span> Analysis completed
        </div>
      )}
    </div>
  );
}

// Investigation Block Component
function InvestigationBlock({ 
  block, 
  progress, 
  onUpdate 
}: { 
  block: LessonBlock; 
  progress?: StudentLessonProgress; 
  onUpdate: (blockId: string, updates: any) => void;
}) {
  const [responses, setResponses] = useState<Record<number, string>>(
    progress?.response?.responses || {}
  );
  const [isCompleted, setIsCompleted] = useState(progress?.completed || false);

  const interactive = block.interactive || {};
  const guidingQuestions = interactive.guidingQuestions || [];

  const handleResponseChange = (questionIndex: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = () => {
    const hasResponses = Object.values(responses).some(r => r.trim().length > 0);
    if (hasResponses) {
      setIsCompleted(true);
      onUpdate(block.id, {
        completed: true,
        timeSpent: 900, // 15 minutes for investigation
        response: { responses } as any
      });
    }
  };

  return (
    <div className="investigation-block">
      <div className="investigation-header">
        <h4>Investigation</h4>
        {interactive.investigationType && (
          <span className="investigation-type">{interactive.investigationType}</span>
        )}
      </div>
      
      {interactive.whoBenefits && (
        <div className="who-benefits">
          <h5>Key Question: Who Benefits?</h5>
          <p>{interactive.whoBenefits}</p>
        </div>
      )}
      
      <div className="guiding-questions">
        <h5>Guiding Questions:</h5>
        {guidingQuestions.map((question, index) => (
          <div key={index} className="question-item">
            <p className="question-text">{question}</p>
            <textarea
              value={responses[index] || ''}
              onChange={(e) => handleResponseChange(index, e.target.value)}
              placeholder="Share your thoughts..."
              className="field-notes-textarea"
              rows={2}
            />
          </div>
        ))}
      </div>
      
      {!isCompleted && (
        <button 
          onClick={handleSubmit}
          className="field-notes-button primary"
        >
          Submit Investigation
        </button>
      )}
      
      {isCompleted && (
        <div className="field-notes-feedback">
          <span className="checkmark">✓</span> Investigation completed
        </div>
      )}
    </div>
  );
}

// Quiz Block Component
function QuizBlock({ 
  block, 
  progress, 
  onUpdate 
}: { 
  block: LessonBlock; 
  progress?: StudentLessonProgress; 
  onUpdate: (blockId: string, updates: any) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    (progress?.response as any)?.selectedAnswer || null
  );
  const [showResult, setShowResult] = useState(progress?.completed || false);
  const [isCorrect, setIsCorrect] = useState(false);

  const interactive = block.interactive || {};
  const options = interactive.options || [];
  const correctIndex = interactive.correctIndex;
  const explanation = interactive.explanation;

  const handleSubmit = () => {
    if (selectedAnswer !== null && correctIndex !== undefined) {
      const correct = selectedAnswer === correctIndex;
      setIsCorrect(correct);
      setShowResult(true);
      
      onUpdate(block.id, {
        completed: true,
        timeSpent: 120, // 2 minutes
        score: correct ? 100 : 0,
        response: { selectedAnswer } as any
      });
    }
  };

  return (
    <div className="quiz-block">
      <div className="quiz-question">
        <h4>Quiz Question</h4>
        <p>{typeof block.content === 'string' ? block.content : JSON.stringify(block.content)}</p>
      </div>
      
      <div className="quiz-options">
        {options.map((option, index) => (
          <label key={index} className="quiz-option">
            <input
              type="radio"
              name={`quiz-${block.id}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => setSelectedAnswer(index)}
              disabled={showResult}
            />
            <span className={`option-text ${showResult && index === correctIndex ? 'correct' : ''}`}>
              {option}
            </span>
            {showResult && index === correctIndex && (
              <span className="correct-indicator">✓</span>
            )}
          </label>
        ))}
      </div>
      
      {!showResult && (
        <button 
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="field-notes-button primary"
        >
          Submit Answer
        </button>
      )}
      
      {showResult && (
        <div className="quiz-result">
          <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite right'}
          </div>
          {explanation && (
            <div className="quiz-explanation">
              <strong>Explanation:</strong> {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hands-On Block Component
function HandsOnBlock({ 
  block, 
  progress, 
  onUpdate 
}: { 
  block: LessonBlock; 
  progress?: StudentLessonProgress; 
  onUpdate: (blockId: string, updates: any) => void;
}) {
  const [notes, setNotes] = useState((progress?.response as any)?.notes || '');
  const [isCompleted, setIsCompleted] = useState(progress?.completed || false);

  const handleSubmit = () => {
    if (notes.trim?.()) {
      setIsCompleted(true);
      onUpdate(block.id, {
        completed: true,
        timeSpent: 1800, // 30 minutes for hands-on activity
        response: { notes } as any
      });
    }
  };

  return (
    <div className="hands-on-block">
      <div className="activity-header">
        <h4>Hands-On Activity</h4>
        {block.metadata?.estimatedTime && (
          <span className="estimated-time">~{block.metadata.estimatedTime} minutes</span>
        )}
      </div>
      
      <div className="activity-instructions">
        {typeof block.content === 'string' ? (
          <div className="prose prose-sm max-w-none">
            {block.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : (
          <div>{JSON.stringify(block.content)}</div>
        )}
      </div>
      
      <div className="activity-notes">
        <h5>Your Notes & Observations:</h5>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you observe? What happened? What did you learn?"
          className="field-notes-textarea"
          rows={5}
        />
      </div>
      
      {!isCompleted && (
        <button 
          onClick={handleSubmit}
          disabled={!notes.trim()}
          className="field-notes-button primary"
        >
          Complete Activity
        </button>
      )}
      
      {isCompleted && (
        <div className="field-notes-feedback">
          <span className="checkmark">✓</span> Activity completed
        </div>
      )}
    </div>
  );
}
