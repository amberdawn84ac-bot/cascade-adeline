'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { StreamingLessonRenderer } from '@/components/lessons/StreamingLessonRenderer';
import { useLessonStream } from '@/hooks/useLessonStream';
import { StudentStatusBar } from '@/components/StudentStatusBar';
import { AdelineChatPanel } from '@/components/AdelineChatPanel';

interface ActiveExpedition {
  title: string;
  subject: string;
  creditsNeeded: number;
  description: string;
  progress: number | null;
  dueDate: string | null;
}

interface TrailItem {
  title: string;
  subject: string;
  creditsNeeded: number;
  description: string;
}

interface JourneyPlan {
  activeExpeditions: ActiveExpedition[];
  trailAhead: TrailItem[];
  adelineMessage: string;
  creditsEarned: number;
}

// Static fallback shown if the API fails or returns empty
const FALLBACK_SUGGESTIONS = [
  { id: '1', title: 'Butterflies of North America', subject: 'Science', description: 'Investigate butterfly life cycles and adaptations', emoji: '🦋' },
  { id: '2', title: 'The American Revolution', subject: 'History', description: 'Primary sources from the founding era', emoji: '🏛️' },
  { id: '3', title: 'Water Cycle Investigation', subject: 'Science', description: 'Hands-on experiments with evaporation and condensation', emoji: '💧' },
  { id: '4', title: 'Scripture Study: Psalms', subject: 'Bible', description: 'Hebrew poetry and original meanings', emoji: '📖' },
];

const SUBJECT_EMOJI: Record<string, string> = {
  Science: '🔬', Math: '📐', 'Language Arts': '✍️', ELA: '✍️',
  History: '🏛️', Bible: '📖', 'Social Studies': '🌎', Art: '🎨',
  Music: '🎵', PE: '🏃', Technology: '💻', Homesteading: '🌿',
};

function subjectEmoji(subject: string): string {
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '📚';
}

export default function JourneyPage() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [journeyPlan, setJourneyPlan] = useState<JourneyPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const { isStreaming, error, startLesson } = useLessonStream();

  // Fetch the dynamic learning plan on mount
  useEffect(() => {
    fetch('/api/journey/plan')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && (data.activeExpeditions?.length > 0 || data.trailAhead?.length > 0)) {
          setJourneyPlan(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsPlanLoading(false));
  }, []);

  const handleLessonRequest = useCallback((topicOrTitle: string | { title: string }) => {
    const topic = typeof topicOrTitle === 'string' ? topicOrTitle : topicOrTitle.title;
    setPendingTopic(topic);
    setActiveLessonId('pending');
  }, []);

  const handleLessonMount = useCallback(() => {
    setActiveLessonId('chat-driven');
  }, []);

  useEffect(() => {
    if (activeLessonId !== 'pending' || !pendingTopic) return;
    const topic = pendingTopic;
    setPendingTopic(null);
    startLesson(topic).then(savedId => {
      if (savedId) setActiveLessonId(savedId);
    });
  }, [activeLessonId, pendingTopic, startLesson]);

  const handleBackToSuggestions = () => {
    setActiveLessonId(null);
    setPendingTopic(null);
  };

  const showFallback = !isPlanLoading && !journeyPlan;

  return (
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

            {/* Loading skeleton */}
            {isPlanLoading && (
              <div className="space-y-6">
                <div className="h-16 rounded-xl bg-[#E7DAC3]/40 animate-pulse" />
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-[#E7DAC3]/40 animate-pulse" />
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic plan from API */}
            {!isPlanLoading && journeyPlan && (
              <div className="space-y-6">
                {/* Adeline's personalized message */}
                {journeyPlan.adelineMessage && (
                  <div
                    className="p-4 rounded-xl border-2 border-[#BD6809]/30 bg-[#BD6809]/5"
                    style={{ fontFamily: 'var(--font-kalam), cursive' }}
                  >
                    <p className="text-[#2F4731] text-sm leading-relaxed">
                      {journeyPlan.adelineMessage}
                    </p>
                  </div>
                )}

                {/* Active Expeditions */}
                {journeyPlan.activeExpeditions.length > 0 && (
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-[#2F4731]/40 mb-3">
                      Active Expeditions
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {journeyPlan.activeExpeditions.map((expedition, i) => (
                        <button
                          key={i}
                          onClick={() => handleLessonRequest(expedition.title)}
                          disabled={isStreaming}
                          className="text-left p-6 rounded-2xl border-2 border-[#BD6809]/40 hover:border-[#BD6809] hover:shadow-lg transition-all bg-white group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-4xl">{subjectEmoji(expedition.subject)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-[#2F4731] mb-1 group-hover:text-[#BD6809] transition-colors leading-tight">
                                {expedition.title}
                              </h3>
                              <p className="text-sm text-[#2F4731]/60 mb-2 line-clamp-2">{expedition.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-block px-3 py-1 bg-[#BD6809]/10 text-[#BD6809] text-xs font-bold rounded-full">
                                  {expedition.subject}
                                </span>
                                {expedition.dueDate && (
                                  <span className="inline-flex items-center gap-1 text-xs text-[#2F4731]/50">
                                    <Clock className="w-3 h-3" />
                                    {new Date(expedition.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              {expedition.progress !== null && (
                                <div className="mt-3">
                                  <div className="w-full bg-[#E7DAC3] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#BD6809] rounded-full transition-all"
                                      style={{ width: `${Math.min(100, Math.max(0, expedition.progress))}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-[#2F4731]/40 mt-1">{Math.round(expedition.progress)}% complete</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Trail Ahead */}
                {journeyPlan.trailAhead.length > 0 && (
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-[#2F4731]/40 mb-3">
                      Coming Up
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {journeyPlan.trailAhead.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleLessonRequest(item.title)}
                          disabled={isStreaming}
                          className="text-left p-6 rounded-2xl border-2 border-dashed border-[#E7DAC3] hover:border-[#2F4731]/40 hover:shadow-md transition-all bg-white/60 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-4xl opacity-70">{subjectEmoji(item.subject)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-[#2F4731]/80 mb-1 group-hover:text-[#2F4731] transition-colors leading-tight">
                                {item.title}
                              </h3>
                              <p className="text-sm text-[#2F4731]/50 mb-2 line-clamp-2">{item.description}</p>
                              <span className="inline-block px-3 py-1 bg-[#2F4731]/8 text-[#2F4731]/60 text-xs font-bold rounded-full">
                                {item.subject}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Static fallback when API is unavailable */}
            {showFallback && (
              <div className="grid sm:grid-cols-2 gap-4">
                {FALLBACK_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleLessonRequest(suggestion.title)}
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
            )}
          </main>
        )}

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
