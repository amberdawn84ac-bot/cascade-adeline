'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DynamicLessonViewer } from '@/components/lessons/DynamicLessonViewer';
import { BookOpen, BrainCircuit, Loader2, RefreshCw } from 'lucide-react';
import type { ContentBlock } from '@/lib/services/LessonFormatterService';

interface LessonMetadata {
  topic: string;
  gradeLevel?: string;
  subject?: string;
  blockCount: number;
  generatedAt: string;
}

export default function DynamicLessonDemo() {
  const [topic, setTopic] = useState('American Revolution');
  const [gradeLevel, setGradeLevel] = useState('8');
  const [subject, setSubject] = useState('history');
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [metadata, setMetadata] = useState<LessonMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLesson = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setContentBlocks([]);

    try {
      const response = await fetch('/api/lessons/dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          gradeLevel,
          subject,
          includeQuizzes,
          maxBlocks: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate lesson');
      }

      setContentBlocks(data.contentBlocks);
      setMetadata(data.metadata);
      console.log('Generated content blocks:', data.contentBlocks);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Lesson generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (results: any) => {
    console.log('Quiz completed:', results);
    // Here you could save results to the database, show congratulations, etc.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-amber-900 mb-2" 
              style={{ fontFamily: 'Swanky and Moo Moo, cursive' }}>
            Dynamic Lesson Viewer
          </h1>
          <p className="text-lg text-amber-700" style={{ fontFamily: 'Kalam, cursive' }}>
            Truth-First lessons powered by verified primary sources
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Lesson Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter lesson topic"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="K">Kindergarten</option>
                <option value="1">1st Grade</option>
                <option value="2">2nd Grade</option>
                <option value="3">3rd Grade</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
                <option value="9">9th Grade</option>
                <option value="10">10th Grade</option>
                <option value="11">11th Grade</option>
                <option value="12">12th Grade</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="history">History</option>
                <option value="science">Science</option>
                <option value="literature">Literature</option>
                <option value="government">Government</option>
                <option value="economics">Economics</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateLesson}
                disabled={loading || !topic.trim()}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Generate Lesson</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeQuizzes}
                onChange={(e) => setIncludeQuizzes(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">Include quizzes</span>
            </label>
            
            {contentBlocks.length > 0 && (
              <button
                onClick={() => setContentBlocks([])}
                className="text-sm text-amber-600 hover:text-amber-700 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Metadata Display */}
        {metadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900">{metadata.topic}</h3>
                <p className="text-sm text-amber-700">
                  Grade {metadata.gradeLevel} • {metadata.subject} • {metadata.blockCount} content blocks
                </p>
              </div>
              <div className="text-xs text-amber-600">
                Generated: {new Date(metadata.generatedAt).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Dynamic Lesson Content */}
        {contentBlocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DynamicLessonViewer
              contentBlocks={contentBlocks}
              onComplete={handleQuizComplete}
              className="bg-white rounded-xl shadow-lg p-8"
            />
          </motion.div>
        )}

        {/* Welcome State */}
        {!loading && contentBlocks.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 mx-auto text-amber-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ready to generate your first dynamic lesson?
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a topic above and click "Generate Lesson" to create a Truth-First lesson 
              powered by verified primary sources from our Hippocampus knowledge base.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
