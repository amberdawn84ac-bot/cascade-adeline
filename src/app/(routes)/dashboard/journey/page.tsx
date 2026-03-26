'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { StreamingLessonRenderer } from '@/components/lessons/StreamingLessonRenderer';
import { useLessonStream } from '@/hooks/useLessonStream';
import { StudentStatusBar } from '@/components/StudentStatusBar';

interface LessonSuggestion {
  id: string;
  title: string;
  subject: string;
  description: string;
  emoji: string;
}

export default function JourneyPage() {
  // activeLessonId: null = idle, 'pending' = renderer mounting, string = lesson saved
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  // pendingTopic is set by button click; useEffect starts the stream after renderer mounts
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const { isStreaming, error, startLesson } = useLessonStream();

  const [lessonSuggestions] = useState<LessonSuggestion[]>([
    { id: '1', title: 'Butterflies of North America', subject: 'Science', description: 'Investigate butterfly life cycles and adaptations', emoji: '🦋' },
    { id: '2', title: 'The American Revolution', subject: 'History', description: 'Primary sources from the founding era', emoji: '🏛️' },
    { id: '3', title: 'Water Cycle Investigation', subject: 'Science', description: 'Hands-on experiments with evaporation and condensation', emoji: '💧' },
    { id: '4', title: 'Scripture Study: Psalms', subject: 'Bible', description: 'Hebrew poetry and original meanings', emoji: '📖' },
  ]);

  // Step 1: button click → set 'pending' to mount the renderer immediately
  const handleStartLesson = useCallback((suggestion: LessonSuggestion) => {
    console.log('[Journey] handleStartLesson clicked:', suggestion.title);
    setPendingTopic(suggestion.title);
    setActiveLessonId('pending'); // renders <StreamingLessonRenderer> → sets window.__addLessonBlock
  }, []);

  // Step 2: after renderer is mounted (activeLessonId === 'pending'), start the stream
  useEffect(() => {
    if (activeLessonId !== 'pending' || !pendingTopic) return;

    console.log('[Journey] Renderer mounted, starting lesson stream for:', pendingTopic);
    const topic = pendingTopic;
    setPendingTopic(null); // clear so effect doesn't re-fire

    startLesson(topic).then(savedId => {
      console.log('[Journey] Lesson stream complete, savedId:', savedId);
      if (savedId) setActiveLessonId(savedId);
    });
  }, [activeLessonId, pendingTopic, startLesson]);

  const handleBackToSuggestions = () => {
    console.log('[Journey] Returning to lesson suggestions');
    setActiveLessonId(null);
    setPendingTopic(null);
  };

  // Shared page chrome rendered in both idle and active-lesson states
  const pageChrome = (
    <>
      {/* Page header */}
      <header className="bg-white border-b-2 border-[#E7DAC3] p-6">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl font-bold text-[#2F4731]"
            style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
          >
            My Learning Plan
          </h1>
          <p className="text-[#2F4731]/60 mt-1 text-sm">
            Choose a lesson to start, or ask Adeline in the chat bubble!
          </p>
        </div>
      </header>

      {/* Status bar — always visible */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <StudentStatusBar />
      </div>
    </>
  );

  // Show lesson renderer when a lesson is active (pending → streaming → saved)
  if (activeLessonId) {
    return (
      <div className="min-h-screen bg-[#FFFEF7]">
        {pageChrome}
        <div className="max-w-4xl mx-auto px-6 pb-6">
          <button
            onClick={handleBackToSuggestions}
            className="flex items-center gap-2 text-[#BD6809] hover:text-[#2F4731] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to lesson list</span>
          </button>

          {isStreaming && (
            <div className="flex items-center gap-3 py-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#BD6809]" />
              <p className="text-[#2F4731]/60 italic text-sm">Adeline is preparing your lesson…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">Something went wrong: {error}</p>
            </div>
          )}

          <StreamingLessonRenderer
            userId=""
            onBlockResponse={(blockId, response) => {
              console.log('[Journey] Block response:', blockId, response);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {pageChrome}

      {/* Lesson Suggestions */}
      <main className="max-w-4xl mx-auto px-6 pb-8">
        {isStreaming && (
          <div className="flex items-center justify-center py-12 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#BD6809]" />
              <p className="text-[#2F4731]/60 italic">Adeline is preparing your lesson…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">Something went wrong: {error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {lessonSuggestions.map(suggestion => (
            <button
              key={suggestion.id}
              onClick={() => handleStartLesson(suggestion)}
              disabled={isStreaming}
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
