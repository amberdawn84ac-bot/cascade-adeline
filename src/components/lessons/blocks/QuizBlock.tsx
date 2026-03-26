import React, { useState } from 'react';
import { submitQuizAnswer, handleLessonBranching } from '@/app/actions/submitQuizAnswer';

interface QuizBlockProps {
  blockData: {
    block_id: string;
    question: string;
    questions?: Array<{
      id: string;
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
    }>;
    quiz_type?: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching';
    options?: string[];
    answer: string;
    explanation?: string;
    passing_score?: number;
    branching?: any;
    conceptId?: string;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
  lessonId?: string;
}

export default function QuizBlock({ blockData, onResponse, studentResponse, lessonId }: QuizBlockProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(studentResponse?.answer || '');
  const [showResult, setShowResult] = useState(studentResponse?.showResult || false);
  const [submitted, setSubmitted] = useState(studentResponse?.submitted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());

  // Normalise: agent emits blocks with content (question text) and interactive (options/answer)
  const normalised = (() => {
    const b = blockData as any;
    if (b.questions?.length) return b; // legacy multi-question format
    // Single-question from assessmentAgent: content = question, interactive = options
    return {
      ...b,
      question: b.question || b.content || '',
      options: b.options || b.interactive?.options,
      answer: b.answer || b.interactive?.answer,
      explanation: b.explanation || b.interactive?.explanation,
      quiz_type: b.quiz_type || (b.interactive?.options?.length ? 'multiple-choice' : undefined),
      questions: [],
    };
  })();

  const questions = normalised.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmit = async () => {
    if (!selectedAnswer.trim() && !currentQuestion) return;
    
    setIsSubmitting(true);
    
    try {
      // For multi-question quiz
      if (questions.length > 0 && currentQuestion) {
        const selectedIndex = currentQuestion.options.findIndex((opt: string) => opt === selectedAnswer);
        const isCorrect = selectedIndex === currentQuestion.correct_answer;
        
        // Save answer to state
        const newAnswers = { ...answers, [currentQuestion.id]: selectedIndex };
        setAnswers(newAnswers);

        // Submit to server
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const result = await submitQuizAnswer({
          lessonId: lessonId || 'unknown',
          blockId: blockData.block_id,
          questionId: currentQuestion.id,
          selectedAnswer: selectedIndex,
          correctAnswer: currentQuestion.correct_answer,
          conceptId: blockData.conceptId,
          timeSpent
        });

        if (result.success) {
          // Move to next question or show results
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer('');
          } else {
            // All questions answered - calculate final score
            const totalQuestions = questions.length;
            const correctCount = Object.values(newAnswers).filter((ans, idx) => 
              ans === questions[idx].correct_answer
            ).length;
            const finalScore = (correctCount / totalQuestions) * 100;
            
            setSubmitted(true);
            setShowResult(true);

            // Handle branching if applicable
            if (blockData.branching && lessonId) {
              const branchResult = await handleLessonBranching(lessonId, blockData.block_id, finalScore);
              
              if (branchResult.success && onResponse) {
                onResponse({
                  blockId: blockData.block_id,
                  score: finalScore,
                  correct: finalScore >= (blockData.passing_score || 70),
                  submitted: true,
                  showResult: true,
                  newBlocks: branchResult.newBlocks,
                  branch: branchResult.branch
                });
              }
            } else if (onResponse) {
              onResponse({
                blockId: blockData.block_id,
                score: finalScore,
                correct: finalScore >= (blockData.passing_score || 70),
                submitted: true,
                showResult: true
              });
            }
          }
        }
      } else {
        // Single question quiz (agent format: content + interactive)
        const isCorrect = selectedAnswer === normalised.answer;
        const score = isCorrect ? 100 : 0;

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const result = await submitQuizAnswer({
          lessonId: lessonId || 'unknown',
          blockId: blockData.block_id,
          questionId: 'single',
          selectedAnswer: normalised.options?.indexOf(selectedAnswer) ?? 0,
          correctAnswer: normalised.options?.indexOf(normalised.answer) ?? 0,
          conceptId: blockData.conceptId,
          timeSpent
        });

        if (result.success) {
          setSubmitted(true);
          setShowResult(true);

          if (onResponse) {
            onResponse({
              blockId: blockData.block_id,
              answer: selectedAnswer,
              score,
              correct: isCorrect,
              submitted: true,
              showResult: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer('');
    setShowResult(false);
    setSubmitted(false);
  };

  return (
    <div className="quiz-block">
      <div className="quiz-header">
        <svg viewBox="0 0 24 24" width="24" height="24" className="quiz-icon">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
        </svg>
        <h4>Check Your Understanding</h4>
      </div>

      <div className="quiz-question">
        <p>{normalised.question}</p>
      </div>

      {!showResult ? (
        <div className="quiz-options">
          {normalised.quiz_type === 'multiple-choice' && normalised.options?.map((option: string, index: number) => (
            <label key={index} className="quiz-option">
              <input
                type="radio"
                name={blockData.block_id}
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => setSelectedAnswer(e.target.value)}
              />
              <span>{option}</span>
            </label>
          ))}

          {normalised.quiz_type === 'true-false' && (
            <div className="quiz-options">
              <label className="quiz-option">
                <input
                  type="radio"
                  name={blockData.block_id}
                  value="True"
                  checked={selectedAnswer === 'True'}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                />
                <span>True</span>
              </label>
              <label className="quiz-option">
                <input
                  type="radio"
                  name={blockData.block_id}
                  value="False"
                  checked={selectedAnswer === 'False'}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                />
                <span>False</span>
              </label>
            </div>
          )}

          {normalised.quiz_type === 'short-answer' && (
            <textarea
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={3}
              className="short-answer-input"
            />
          )}
        </div>
      ) : (
        <div className="quiz-result">
          <div className={`result-indicator ${studentResponse?.correct ? 'correct' : 'incorrect'}`}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              {studentResponse?.correct ? (
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              ) : (
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19z" fill="currentColor"/>
              )}
            </svg>
            <span>{studentResponse?.correct ? 'Correct!' : 'Incorrect'}</span>
          </div>

          {normalised.explanation && (
            <div className="quiz-explanation">
              <h5>Explanation:</h5>
              <p>{normalised.explanation}</p>
            </div>
          )}

          <div className="answer-comparison">
            <div className="your-answer">
              <strong>Your answer:</strong> {selectedAnswer || 'Not answered'}
            </div>
            <div className="correct-answer">
              <strong>Correct answer:</strong> {normalised.answer}
            </div>
          </div>
        </div>
      )}

      <div className="quiz-actions">
        {!showResult ? (
          <button 
            onClick={handleSubmit}
            disabled={!selectedAnswer.trim()}
            className="submit-quiz-btn"
          >
            Submit Answer
          </button>
        ) : (
          <button onClick={handleRetry} className="retry-quiz-btn">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
