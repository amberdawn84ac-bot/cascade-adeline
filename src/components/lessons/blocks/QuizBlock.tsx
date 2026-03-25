import React, { useState } from 'react';

interface QuizBlockProps {
  blockData: {
    block_id: string;
    question: string;
    quiz_type?: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching';
    options?: string[];
    answer: string;
    explanation?: string;
    passing_score?: number;
    branching?: any;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function QuizBlock({ blockData, onResponse, studentResponse }: QuizBlockProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(studentResponse?.answer || '');
  const [showResult, setShowResult] = useState(studentResponse?.showResult || false);
  const [submitted, setSubmitted] = useState(studentResponse?.submitted || false);

  const handleSubmit = () => {
    if (!selectedAnswer.trim()) return;
    
    const isCorrect = selectedAnswer === blockData.answer;
    const score = isCorrect ? 100 : 0;
    
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
        <p>{blockData.question}</p>
      </div>

      {!showResult ? (
        <div className="quiz-options">
          {blockData.quiz_type === 'multiple-choice' && blockData.options?.map((option, index) => (
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

          {blockData.quiz_type === 'true-false' && (
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

          {blockData.quiz_type === 'short-answer' && (
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

          {blockData.explanation && (
            <div className="quiz-explanation">
              <h5>Explanation:</h5>
              <p>{blockData.explanation}</p>
            </div>
          )}

          <div className="answer-comparison">
            <div className="your-answer">
              <strong>Your answer:</strong> {selectedAnswer || 'Not answered'}
            </div>
            <div className="correct-answer">
              <strong>Correct answer:</strong> {blockData.answer}
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
