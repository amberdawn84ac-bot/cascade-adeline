'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateAndSaveLesson } from '@/app/actions/lessonActions';

export default function HistoryPage() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    
    try {
      const lessonId = await generateAndSaveLesson(topic.trim(), 'truth-based-history');
      router.push(`/dashboard/lesson/${lessonId}`);
    } catch (error) {
      console.error('Failed to generate lesson:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-4">History Lessons</h1>
        <p className="text-gray-600">
          Explore history through primary sources and uncover the truth behind what really happened.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Start a New Lesson</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to learn about?
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Trail of Tears, American Revolution, Civil Rights Movement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              disabled={isGenerating}
            />
          </div>
          
          <button
            type="submit"
            disabled={!topic.trim() || isGenerating}
            className="w-full md:w-auto px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adeline is researching...</span>
              </>
            ) : (
              <>
                <span>Start Lesson</span>
              </>
            )}
          </button>
        </form>
      </div>

      {isGenerating && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-amber-800">
              Adeline is gathering primary sources and preparing your lesson...
            </p>
            <p className="text-sm text-amber-600">
              This may take a moment as we find authentic historical documents.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Trail of Tears</h3>
          <p className="text-gray-600 text-sm mb-4">
            Understand the forced removal of Native Americans through primary sources.
          </p>
          <button 
            onClick={() => setTopic('Trail of Tears')}
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            Learn More →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">American Revolution</h3>
          <p className="text-gray-600 text-sm mb-4">
            Explore the founding of America through letters and documents from the era.
          </p>
          <button 
            onClick={() => setTopic('American Revolution')}
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            Learn More →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Civil Rights Movement</h3>
          <p className="text-gray-600 text-sm mb-4">
            Examine the struggle for equality through speeches, photographs, and testimonies.
          </p>
          <button 
            onClick={() => setTopic('Civil Rights Movement')}
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}
