'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { StreamingLessonRenderer } from '@/components/lessons/StreamingLessonRenderer';

interface LessonSuggestion {
  id: string;
  title: string;
  subject: string;
  description: string;
  emoji: string;
}

export default function JourneyPage() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isStreamingLesson, setIsStreamingLesson] = useState(false);
  
  const [lessonSuggestions] = useState<LessonSuggestion[]>([
    { id: '1', title: 'Butterflies of North America', subject: 'Science', description: 'Investigate butterfly life cycles and adaptations', emoji: '🦋' },
    { id: '2', title: 'The American Revolution', subject: 'History', description: 'Primary sources from the founding era', emoji: '🏛️' },
    { id: '3', title: 'Water Cycle Investigation', subject: 'Science', description: 'Hands-on experiments with evaporation and condensation', emoji: '💧' },
    { id: '4', title: 'Scripture Study: Psalms', subject: 'Bible', description: 'Hebrew poetry and original meanings', emoji: '📖' },
  ]);

  const handleStartLesson = async (suggestion: LessonSuggestion) => {
    setIsStreamingLesson(true);
    
    try {
      // Call the lesson streaming API
      const response = await fetch('/api/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: suggestion.title,
          lessonId: `lesson-${Date.now()}`
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'start') {
                  setActiveLessonId(data.threadId);
                } else if (data.type === 'lesson_block') {
                  // StreamingLessonRenderer will handle the blocks via window hooks
                  if (window.__addLessonBlock) {
                    window.__addLessonBlock(data.block);
                  }
                } else if (data.type === 'lesson_metadata') {
                  if (window.__setLessonMetadata) {
                    window.__setLessonMetadata(data.data);
                  }
                } else if (data.type === 'done') {
                  setIsStreamingLesson(false);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error starting lesson:', error);
      setIsStreamingLesson(false);
    }
  };

  const handleBackToSuggestions = () => {
    setActiveLessonId(null);
    setIsStreamingLesson(false);
  };

  // If a lesson is active, show the StreamingLessonRenderer
  if (activeLessonId) {
    return (
      <div className="min-h-screen bg-[#FFFEF7]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={handleBackToSuggestions}
            className="flex items-center gap-2 text-[#BD6809] hover:text-[#2F4731] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Learning Plan</span>
          </button>
          
          <StreamingLessonRenderer 
            userId={activeLessonId} 
            onBlockResponse={(blockId, response) => {
              console.log('Block response:', blockId, response);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white border-b-2 border-[#E7DAC3] p-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            My Learning Plan
          </h1>
          <p className="text-[#2F4731]/60 mt-2">
            Choose a lesson to start, or ask Adeline in the chat bubble!
          </p>
        </div>
      </header>

      {/* Lesson Suggestions */}
      <main className="max-w-4xl mx-auto px-6">
        {isStreamingLesson && (
          <div className="flex items-center justify-center py-12 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#BD6809]" />
              <p className="text-[#2F4731]/60 italic">Adeline is preparing your lesson...</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {lessonSuggestions.map(suggestion => (
            <button
              key={suggestion.id}
              onClick={() => handleStartLesson(suggestion)}
              disabled={isStreamingLesson}
              className="text-left p-6 rounded-2xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:shadow-lg transition-all bg-white group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{suggestion.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#2F4731] mb-1 group-hover:text-[#BD6809] transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-[#2F4731]/60 mb-2">{suggestion.description}</p>
                  <span className="inline-block px-3 py-1 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full">
                    {suggestion.subject}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
