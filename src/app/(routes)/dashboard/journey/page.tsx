'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { StreamingLessonRenderer } from '@/components/lessons/StreamingLessonRenderer';
import { useLessonStream } from '@/hooks/useLessonStream';
import { StudentStatusBar } from '@/components/StudentStatusBar';
import { AdelineChatPanel } from '@/components/AdelineChatPanel';

interface LessonSuggestion {
  id: string;
  title: string;
  subject: string;
  description: string;
  emoji: string;
}

const LESSON_SUGGESTIONS: LessonSuggestion[] = [
  { id: '1', title: 'Butterflies of North America', subject: 'Science', description: 'Investigate butterfly life cycles and adaptations', emoji: '🦋' },
  { id: '2', title: 'The American Revolution', subject: 'History', description: 'Primary sources from the founding era', emoji: '🏛️' },
  { id: '3', title: 'Water Cycle Investigation', subject: 'Science', description: 'Hands-on experiments with evaporation and condensation', emoji: '💧' },
  { id: '4', title: 'Scripture Study: Psalms', subject: 'Bible', description: 'Hebrew poetry and original meanings', emoji: '📖' },
];

export default function JourneyPage() {
  // activeLessonId: null = idle, 'pending' = renderer mounting, string = lesson saved
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const { isStreaming, error, startLesson } = useLessonStream();

  // Accepts either a string topic (from chat panel) or LessonSuggestion (from cards)
  const handleLessonRequest = useCallback((topicOrSuggestion: string | LessonSuggestion) => {
    const topic = typeof topicOrSuggestion === 'string'
      ? topicOrSuggestion
      : topicOrSuggestion.title;
    console.log('[Journey] handleLessonRequest called with topic:', topic);
    setPendingTopic(topic);
    setActiveLessonId('pending'); // mounts renderer → sets window.__addLessonBlock
    console.log('[Journey] Set activeLessonId to "pending" to mount renderer');
  }, []);

  // Hybrid path: mounts StreamingLessonRenderer without triggering SSE.
  // 'chat-driven' is truthy (renderer mounts) but !== 'pending' (SSE useEffect skips).
  const handleLessonMount = useCallback(() => {
    console.log('[Journey] handleLessonMount called - setting activeLessonId to "chat-driven"');
    setActiveLessonId('chat-driven');
  }, []);

  // After renderer mounts (activeLessonId === 'pending'), start the SSE stream
  useEffect(() => {
    if (activeLessonId !== 'pending' || !pendingTopic) {
      console.log('[Journey] SSE useEffect skipped - activeLessonId:', activeLessonId, 'pendingTopic:', pendingTopic);
      return;
    }
    console.log('[Journey] SSE useEffect triggered - starting lesson stream for:', pendingTopic);
    const topic = pendingTopic;
    setPendingTopic(null);
    startLesson(topic).then(savedId => {
      console.log('[Journey] Lesson stream completed, savedId:', savedId);
      if (savedId) setActiveLessonId(savedId);
    });
  }, [activeLessonId, pendingTopic, startLesson]);

  const handleBackToSuggestions = () => {
    setActiveLessonId(null);
    setPendingTopic(null);
  };

  return (
    /*
     * Full-viewport two-column layout.
     * -m-6 / -m-8 cancels the p-6/p-8 padding from (routes)/layout.tsx so the
     * columns stretch edge-to-edge and the right panel fills the full height.
     */
    <div className="flex h-screen -m-6 md:-m-8 overflow-hidden bg-[#FFFEF7]">

      {/* ── Left column: lesson content ── */}
      <div className="flex-1 overflow-y-auto min-w-0">

        {/* Page header */}
        <header className="bg-white border-b-2 border-[#E7DAC3] px-6 py-5 sticky top-0 z-10">
          <h1
            className="text-2xl font-bold text-[#2F4731]"
            style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
          >
            My Learning Plan
          </h1>
          <p className="text-[#2F4731]/60 mt-0.5 text-sm">
            {activeLessonId
              ? 'Lesson in progress — ask Adeline questions in the panel →'
              : 'Choose a topic below or ask Adeline in the panel →'}
          </p>
        </header>

        {/* Status bar */}
        <div className="px-6 pt-5">
          <StudentStatusBar />
        </div>

        {/* ── Idle: suggestion cards ── */}
        {!activeLessonId && (
          <main className="px-6 pb-8 pt-5">
            {isStreaming && (
              <div className="flex items-center gap-3 py-10 justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#BD6809]" />
                <p className="text-[#2F4731]/60 italic">Adeline is preparing your lesson…</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">Something went wrong: {error}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {LESSON_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => handleLessonRequest(suggestion)}
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
        )}

        {/*
         * StreamingLessonRenderer is ALWAYS mounted so window.__addLessonBlock is
         * registered the moment the Journey page loads — no race condition when
         * the first lesson_metadata annotation triggers onLessonMount() and blocks
         * start teleporting before the renderer would otherwise have had time to mount.
         * The container is visually hidden (but DOM-present) when no lesson is active.
         */}
        <div className={activeLessonId ? 'px-6 pb-8 pt-4' : 'hidden'}>
          {activeLessonId && (
            <>
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
            </>
          )}
        </div>

        {/* Always-mounted renderer (hidden when idle) to prevent race condition */}
        <div className={activeLessonId ? 'px-6 pb-8' : 'hidden'}>
          <StreamingLessonRenderer
            userId=""
            onBlockResponse={(blockId, response) => {
              console.log('[Journey] Block response:', blockId, response);
            }}
          />
        </div>
      </div>

      {/* ── Right column: Adeline chat panel ── */}
      <div className="w-[380px] shrink-0 hidden md:flex flex-col border-l-2 border-[#E7DAC3]">
        <AdelineChatPanel onLessonRequest={handleLessonRequest} onLessonMount={handleLessonMount} />
      </div>
    </div>
  );
}
