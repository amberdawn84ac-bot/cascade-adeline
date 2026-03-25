'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Loader2, LogOut, Settings, Sparkles, MapPin, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DailyBreadWidget } from '@/components/daily-bread/DailyBreadWidget';
import { FloatingBeeBubble } from '@/components/FloatingBeeBubble';
import { DynamicLessonViewer } from '@/components/lessons/DynamicLessonViewer';

interface User {
  firstName: string;
  userId: string;
}

interface LessonSuggestion {
  id: string;
  title: string;
  subject: string;
  description: string;
  emoji: string;
}

interface ActiveLesson {
  title: string;
  subject: string;
  blocks: any[];
  isStreaming: boolean;
}

export default function JourneyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);
  const [lessonSuggestions] = useState<LessonSuggestion[]>([
    { id: '1', title: 'Butterflies of North America', subject: 'Science', description: 'Investigate butterfly life cycles and adaptations', emoji: '🦋' },
    { id: '2', title: 'The American Revolution', subject: 'History', description: 'Primary sources from the founding era', emoji: '🏛️' },
    { id: '3', title: 'Water Cycle Investigation', subject: 'Science', description: 'Hands-on experiments with evaporation and condensation', emoji: '💧' },
    { id: '4', title: 'Scripture Study: Psalms', subject: 'Bible', description: 'Hebrew poetry and original meanings', emoji: '📖' },
  ]);

  // Load user data
  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        setUser({ firstName: data.firstName || 'Student', userId: data.userId });
        setIsLoading(false);
      })
      .catch(() => {
        setUser({ firstName: 'Student', userId: 'unknown' });
        setIsLoading(false);
      });
  }, []);

  // Handle starting a lesson from suggestion button
  const handleStartLesson = async (suggestion: LessonSuggestion) => {
    setActiveLesson({
      title: suggestion.title,
      subject: suggestion.subject,
      blocks: [],
      isStreaming: true
    });

    // Call lesson generation API
    try {
      const response = await fetch('/api/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: suggestion.title,
          lessonId: `lesson-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start lesson');
      }

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
              if (data.type === 'lesson_block') {
                setActiveLesson(prev => prev ? {
                  ...prev,
                  blocks: [...prev.blocks, data.block]
                } : null);
              } else if (data.type === 'done') {
                setActiveLesson(prev => prev ? { ...prev, isStreaming: false } : null);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Lesson stream error:', error);
      setActiveLesson(null);
    }
  };

  // Handle chat lesson request from FloatingBeeBubble
  const handleChatLessonRequest = async (topic: string) => {
    const lessonSuggestion: LessonSuggestion = {
      id: `chat-${Date.now()}`,
      title: topic,
      subject: 'General',
      description: `Lesson on ${topic}`,
      emoji: '✨'
    };
    await handleStartLesson(lessonSuggestion);
  };

  // Handle Daily Bread study
  const handleDailyBreadStudy = (prompt: string) => {
    handleChatLessonRequest(prompt);
  };

  const handleSignOut = () => {
    fetch('/api/auth/signout', { method: 'POST' })
      .then(() => router.push('/'));
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#BD6809] mx-auto mb-4" />
          <p className="text-[#2F4731]/60 italic">Charting your path to the summit...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FFFEF7] flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#FFFEF7] border-r-2 border-[#E7DAC3] flex flex-col" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
        {/* Logo/Icon */}
        <div className="p-6 border-b border-[#E7DAC3]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#BD6809]" />
            <span className="text-xl font-bold text-[#2F4731]">Dear Adeline</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-lg bg-[#BD6809]/10 text-[#BD6809] font-bold flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            My Learning Plan
          </button>
          <button 
            onClick={() => router.push('/dashboard/opportunities')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2F4731]/5 text-[#2F4731] flex items-center gap-3 transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            Opportunities
          </button>
          <button 
            onClick={() => router.push('/dashboard/future-prep')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2F4731]/5 text-[#2F4731] flex items-center gap-3 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            Future Prep
          </button>

          {/* Daily Bread Widget */}
          <div className="pt-4">
            <DailyBreadWidget onStudy={handleDailyBreadStudy} />
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-[#E7DAC3] space-y-2">
          <button 
            onClick={() => router.push('/settings')}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-[#2F4731]/5 text-[#2F4731] flex items-center gap-3 text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b-2 border-[#E7DAC3] p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              {user.firstName}'s Learning Plan
            </h1>
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" className="text-[#BD6809]">
                <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 12 10 Q 16 6 20 10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M 12 16 Q 16 20 20 16" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </header>

        {/* Main Learning Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {!activeLesson ? (
            /* Lesson Suggestions */
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Ready for Today's Lesson?
              </h2>
              <p className="text-[#2F4731]/60 mb-6">
                Choose a lesson to start, or ask Adeline in the chat bubble!
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {lessonSuggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleStartLesson(suggestion)}
                    className="text-left p-6 rounded-2xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:shadow-lg transition-all bg-white group"
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
            </div>
          ) : (
            /* Active Lesson - Streaming Blocks */
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setActiveLesson(null)}
                  className="text-[#BD6809] hover:underline text-sm mb-2"
                >
                  ← Back to Lesson Suggestions
                </button>
                <h2 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                  {activeLesson.title}
                </h2>
                <p className="text-[#2F4731]/60 text-sm mt-1">{activeLesson.subject}</p>
              </div>

              {activeLesson.blocks.length > 0 && (
                <DynamicLessonViewer
                  contentBlocks={activeLesson.blocks}
                  lessonTitle={activeLesson.title}
                  subjectTrack={activeLesson.subject}
                  scriptureFoundation={null}
                  credits={[]}
                  onComplete={(results) => {
                    console.log('Lesson completed:', results);
                  }}
                  sessionState={null}
                  lessonId={activeLesson.title}
                />
              )}

              {activeLesson.isStreaming && (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#BD6809]" />
                  <p className="text-[#2F4731]/60 italic">Streaming lesson blocks...</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Adeline Bubble */}
      <FloatingBeeBubble 
        userId={user.userId}
        onLessonRequest={handleChatLessonRequest}
        onLessonStream={(blocks) => {
          if (activeLesson) {
            setActiveLesson(prev => prev ? {
              ...prev,
              blocks: [...prev.blocks, ...blocks]
            } : null);
          }
        }}
      />
    </div>
  );
}
