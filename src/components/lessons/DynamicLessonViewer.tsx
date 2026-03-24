'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, BookOpen, BrainCircuit, ChevronRight } from 'lucide-react';
import type { ContentBlock } from '@/lib/services/LessonFormatterService';

interface DynamicLessonViewerProps {
  contentBlocks: ContentBlock[];
  onComplete?: (results: QuizResults) => void;
  className?: string;
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  quizAnswers: Array<{ question: string; correct: boolean; userAnswer?: string }>;
}

/**
 * DynamicLessonViewer - Renders structured content blocks as interactive UI components
 * 
 * This component takes the content_blocks JSON array from the LessonFormatterService
 * and maps over it to render distinct UI components based on the type property.
 */
export function DynamicLessonViewer({ 
  contentBlocks, 
  onComplete, 
  className = '' 
}: DynamicLessonViewerProps) {
  const [quizAnswers, setQuizAnswers] = useState<Map<number, string>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

  // Filter blocks by type
  const titleBlocks = contentBlocks.filter(block => block.type === 'title');
  const primaryTextBlocks = contentBlocks.filter(block => block.type === 'primary_text');
  const quizBlocks = contentBlocks.filter(block => block.type === 'quiz');

  const handleQuizAnswer = (quizIndex: number, answer: string) => {
    setQuizAnswers(prev => new Map(prev.set(quizIndex, answer)));
  };

  const submitQuiz = () => {
    const results: QuizResults = {
      totalQuestions: quizBlocks.length,
      correctAnswers: 0,
      quizAnswers: []
    };

    quizBlocks.forEach((quiz, index) => {
      const userAnswer = quizAnswers.get(index);
      const isCorrect = quiz.answer && userAnswer === quiz.answer;
      
      if (isCorrect) {
        results.correctAnswers++;
      }

      results.quizAnswers.push({
        question: quiz.question || '',
        correct: isCorrect,
        userAnswer
      });
    });

    setQuizResults(results);
    setShowResults(true);
    onComplete?.(results);
  };

  const resetQuiz = () => {
    setQuizAnswers(new Map());
    setShowResults(false);
    setQuizResults(null);
  };

  if (contentBlocks.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        <div className="text-center py-4">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-pulse" />
        <p className="text-gray-600">No content available for this lesson.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Title Blocks */}
      <AnimatePresence>
        {titleBlocks.map((block, index) => (
          <motion.div
            key={`title-${index}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4" 
                style={{ fontFamily: 'Swanky and Moo Moo, cursive' }}>
              {block.content}
            </h1>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Primary Text Blocks */}
      <div className="space-y-6">
        {primaryTextBlocks.map((block, index) => (
          <motion.div
            key={`text-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-r-lg shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="prose prose-amber max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {block.content}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quiz Blocks */}
      {quizBlocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white border-2 border-amber-200 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-2 mb-6">
            <BrainCircuit className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-amber-900">Check Your Understanding</h2>
          </div>

          {!showResults ? (
            <div className="space-y-6">
              {quizBlocks.map((quiz, quizIndex) => (
                <div key={`quiz-${quizIndex}`} className="space-y-3">
                  <h3 className="font-semibold text-gray-800">{quiz.question}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quiz.options?.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleQuizAnswer(quizIndex, option)}
                        className={`p-3 text-left border-2 rounded-lg transition-all ${
                          quizAnswers.get(quizIndex) === option
                            ? 'border-amber-500 bg-amber-50 text-amber-900'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            quizAnswers.get(quizIndex) === option
                              ? 'border-amber-500 bg-amber-500'
                              : 'border-gray-300'
                          }`}>
                            {quizAnswers.get(quizIndex) === option && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <span className="text-sm">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {quizBlocks.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={submitQuiz}
                    disabled={quizAnswers.size !== quizBlocks.length}
                    className="w-full md:w-auto px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Submit Answers</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Quiz Results
                </h3>
                <div className="text-2xl font-bold text-amber-600">
                  {quizResults?.correctAnswers} / {quizResults?.totalQuestions}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {quizResults && Math.round((quizResults.correctAnswers / quizResults.totalQuestions) * 100)}% Correct
                </p>
              </div>

              <div className="space-y-3">
                {quizResults?.quizAnswers.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {result.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{result.question}</p>
                      <p className="text-xs text-gray-600">
                        Your answer: {result.userAnswer || 'Not answered'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={resetQuiz}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Quiz block renderer component (can be used standalone)
export function QuizBlock({ 
  quiz, 
  onAnswer, 
  showResult = false,
  selectedAnswer 
}: {
  quiz: ContentBlock;
  onAnswer?: (answer: string) => void;
  showResult?: boolean;
  selectedAnswer?: string;
}) {
  if (quiz.type !== 'quiz') return null;

  const isCorrect = selectedAnswer === quiz.answer;

  return (
    <div className="bg-white border-2 border-amber-200 rounded-xl p-6 shadow-lg">
      <h3 className="font-semibold text-gray-800 mb-4">{quiz.question}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quiz.options?.map((option, index) => (
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
