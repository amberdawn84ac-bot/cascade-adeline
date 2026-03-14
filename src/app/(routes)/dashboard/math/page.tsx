'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronRight, Loader2, X, AlertTriangle, MessageSquare, Send, TrendingUp, MapPin, RefreshCw } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────
interface MathCourse {
  id: string;
  title: string;
  subject: string;
  description: string;
  status: 'active' | 'planned' | 'completed';
  progress?: number | null;
  dueDate?: string | null;
}

interface Lesson {
  lessonTitle: string;
  lessonType: string;
  timeEstimate: string;
  lessonContent: string;
  keyFacts: string[];
  imageSearchTerms: string[];
  activity: {
    title: string;
    fullInstructions: string;
    supplies: string[];
  };
  completionCriteria: string;
}

function isMathSubject(subject: string): boolean {
  const s = subject.toLowerCase();
  return (
    s.includes('math') ||
    s.includes('algebra') ||
    s.includes('geometry') ||
    s.includes('calculus') ||
    s.includes('statistics') ||
    s.includes('arithmetic') ||
    s.includes('trigonometry') ||
    s.includes('pre-calc') ||
    s.includes('precalc') ||
    s.includes('number') ||
    s.includes('measurement') ||
    s.includes('data') ||
    s.includes('probability')
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function MathPage() {
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [activeCourses, setActiveCourses] = useState<MathCourse[]>([]);
  const [upNextCourses, setUpNextCourses] = useState<MathCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson modal state
  const [lessonCourse, setLessonCourse] = useState<MathCourse | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [showLessonChat, setShowLessonChat] = useState(false);
  const lessonChatEndRef = useRef<HTMLDivElement>(null);

  const {
    messages: lessonMessages,
    input: lessonInput,
    handleInputChange: handleLessonInputChange,
    handleSubmit: handleLessonSubmit,
    isLoading: isLessonChatLoading,
    setMessages: setLessonMessages,
  } = useChat({
    api: '/api/journey/lesson-chat',
    body: {
      lessonTitle: lesson?.lessonTitle,
      lessonContent: lesson?.lessonContent,
      subject: lessonCourse?.subject,
    },
    onFinish: () => {
      lessonChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, planRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/journey/plan'),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setGradeLevel(me.gradeLevel ?? null);
        setInterests(me.interests ?? []);
      }

      if (planRes.ok) {
        const plan = await planRes.json();
        const active: MathCourse[] = (plan.activeExpeditions ?? [])
          .filter((c: any) => isMathSubject(c.subject) || isMathSubject(c.title))
          .map((c: any) => ({ ...c, status: 'active' as const }));
        const upcoming: MathCourse[] = (plan.trailAhead ?? [])
          .filter((c: any) => isMathSubject(c.subject) || isMathSubject(c.title))
          .map((c: any) => ({ ...c, status: 'planned' as const }));
        setActiveCourses(active);
        setUpNextCourses(upcoming);
      } else {
        const body = await planRes.json().catch(() => ({}));
        setError((body as any).details || (body as any).error || `Error ${planRes.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const openLesson = async (course: MathCourse) => {
    setLessonCourse(course);
    setLesson(null);
    setLessonError(null);
    setLessonLoading(true);
    setShowLessonChat(false);
    setLessonMessages([]);
    try {
      const res = await fetch('/api/journey/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: course.subject, title: course.title, description: course.description }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).details || (body as any).error || 'Failed to generate lesson');
      }
      setLesson(await res.json());
    } catch (err) {
      setLessonError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLessonLoading(false);
    }
  };

  const closeLesson = () => {
    setLessonCourse(null);
    setLesson(null);
    setLessonError(null);
    setShowLessonChat(false);
    setLessonMessages([]);
  };

  const noMathCourses = !loading && !error && activeCourses.length === 0 && upNextCourses.length === 0;

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Math Lessons
              </h1>
              <p className="text-[#2F4731]/70 text-base mt-1">
                Your personalized math lessons from your learning plan — click any course to get today's lesson.
              </p>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {interests.slice(0, 4).map(i => (
                    <span key={i} className="text-xs bg-[#2F4731] text-[#FFFEF7] px-2 py-0.5 rounded-full">{i}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {gradeLevel && (
                <div className="bg-[#2F4731] text-[#FFFEF7] rounded-2xl px-5 py-3 text-center">
                  <p className="text-xs opacity-60 uppercase tracking-widest">Grade</p>
                  <p className="text-3xl font-black">{gradeLevel}</p>
                </div>
              )}
              <button
                onClick={() => loadData()}
                className="p-3 bg-white border-2 border-[#BD6809]/20 hover:border-[#BD6809] rounded-2xl text-[#2F4731]/60 hover:text-[#BD6809] transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#BD6809]" />
            <p className="text-[#2F4731]/60 italic">Loading your math lessons…</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-red-900 font-bold">Couldn't load your learning plan.</p>
            <p className="text-red-700 text-sm font-mono bg-red-100 p-2 rounded">{error}</p>
            <p className="text-red-700 text-sm">
              Make sure you've set up your{' '}
              <Link href="/dashboard/journey" className="underline font-bold">learning plan</Link>{' '}
              first.
            </p>
            <button
              onClick={() => loadData()}
              className="bg-[#2F4731] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#BD6809] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── No math courses found ── */}
        {noMathCourses && (
          <div className="rounded-3xl border-2 border-dashed border-[#BD6809]/30 bg-amber-50 p-10 text-center space-y-4">
            <span className="text-5xl block">📐</span>
            <h2 className="text-xl font-bold text-[#2F4731]">No math courses in your plan yet.</h2>
            <p className="text-[#2F4731]/70 text-sm max-w-md mx-auto">
              Your learning plan doesn't have any math courses mapped yet. Head to your Journey to add them, or refresh to check again.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/dashboard/journey"
                className="bg-[#2F4731] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#BD6809] transition-colors text-sm"
              >
                Go to My Journey
              </Link>
              <button
                onClick={() => loadData()}
                className="border-2 border-[#2F4731] text-[#2F4731] px-6 py-2.5 rounded-xl font-bold hover:bg-[#E7DAC3] transition-colors text-sm"
              >
                Refresh Plan
              </button>
            </div>
          </div>
        )}

        {/* ── Active / In Progress ── */}
        {!loading && !error && activeCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-[#BD6809]" />
              <h2 className="text-2xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                In Progress
              </h2>
            </div>
            <p className="text-[#2F4731]/60 text-sm mb-5 pl-9">Click a course to get today's lesson.</p>
            <div className="grid md:grid-cols-2 gap-5">
              {activeCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => openLesson(course)}
                  className="text-left group relative rounded-3xl border-2 border-[#BD6809] bg-white hover:bg-amber-50 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#BD6809] to-[#e8820a] w-full" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-4">
                        <h3 className="text-lg font-bold text-[#2F4731] leading-snug mb-1" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                          {course.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full">
                            {course.subject}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                            IN PROGRESS
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#BD6809] flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                    </div>
                    <p className="text-sm text-[#2F4731]/70 mb-4 leading-relaxed">{course.description}</p>
                    {course.progress != null && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#2F4731]/50">Progress</span>
                          <span className="text-xs font-bold text-[#BD6809]">{course.progress}%</span>
                        </div>
                        <div className="bg-[#E7DAC3] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#BD6809] h-full rounded-full" style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-end">
                      <span className="text-xs font-bold text-[#BD6809] bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Today's Lesson
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Up Next ── */}
        {!loading && !error && upNextCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Up Next in Math
              </h2>
            </div>
            <p className="text-[#2F4731]/60 text-sm mb-5 pl-9">Upcoming math courses from your learning plan. Click to preview a lesson.</p>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-[#E7DAC3] to-transparent" />
              <div className="space-y-4">
                {upNextCourses.map((course, index) => (
                  <div key={course.id} className="relative pl-16">
                    <div className="absolute left-4 top-6 w-5 h-5 rounded-full border-2 border-indigo-400 bg-[#FFFEF7] flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    <div className="absolute left-1 top-4 text-[10px] font-bold text-indigo-300">{index + 1}</div>
                    <div className="rounded-2xl border-2 border-[#E7DAC3] bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#2F4731] mb-1" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                            {course.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs text-[#2F4731]/50 border border-[#E7DAC3] px-2 py-0.5 rounded-full">
                              {course.subject}
                            </span>
                            <span className="text-xs text-[#2F4731]/50 border border-[#E7DAC3] px-2 py-0.5 rounded-full">
                              1 credit
                            </span>
                          </div>
                          <p className="text-sm text-[#2F4731]/60 leading-relaxed">{course.description}</p>
                        </div>
                        <button
                          onClick={() => openLesson(course)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#2F4731] text-white text-xs font-bold rounded-xl hover:bg-[#BD6809] transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Preview Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Lesson Modal ── */}
      {lessonCourse && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEF7] rounded-3xl border-2 border-[#2F4731] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-[#2F4731] p-6 flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-[#BD6809] text-xs font-bold uppercase tracking-widest mb-1">Today's Lesson</p>
                <h3 className="text-2xl font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                  {lessonCourse.title}
                </h3>
                <p className="text-white/60 text-sm mt-1">{lessonCourse.subject}</p>
              </div>
              <button onClick={closeLesson} className="text-white/60 hover:text-white ml-4 flex-shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {lessonLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#BD6809]" />
                  <p className="text-[#2F4731]/60 italic">Adeline is designing your lesson…</p>
                </div>
              )}

              {lessonError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-red-700 text-sm font-mono">{lessonError}</p>
                  <button onClick={() => openLesson(lessonCourse)} className="text-sm font-bold text-red-700 underline">Retry</button>
                </div>
              )}

              {lesson && (
                <>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full capitalize">
                      📚 {lesson.lessonType}
                    </span>
                    <span className="px-3 py-1 bg-[#BD6809]/10 text-[#BD6809] text-xs font-bold rounded-full">
                      ⏱ {lesson.timeEstimate}
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <h4 className="font-bold text-[#2F4731] mb-3 text-sm uppercase tracking-wide">📖 The Lesson</h4>
                    <div className="text-[#2F4731] leading-relaxed text-sm space-y-3">
                      {lesson.lessonContent.split('\n').filter(Boolean).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>

                  {lesson.keyFacts?.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                      <h4 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wide">🧠 Remember These</h4>
                      <ul className="space-y-2">
                        {lesson.keyFacts.map((fact, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
                            <span className="font-black text-indigo-500 flex-shrink-0">{i + 1}.</span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.imageSearchTerms?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#2F4731] mb-2 text-sm uppercase tracking-wide">🖼️ See It</h4>
                      <div className="flex flex-wrap gap-2">
                        {lesson.imageSearchTerms.map((term, i) => (
                          <a
                            key={i}
                            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(term)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#BD6809] text-[#BD6809] text-xs font-bold rounded-xl hover:bg-amber-50 transition-colors"
                          >
                            🔍 {term}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-[#2F4731] rounded-2xl overflow-hidden">
                    <div className="bg-[#2F4731] px-4 py-3">
                      <h4 className="font-bold text-white text-sm uppercase tracking-wide">🛠️ Your Activity: {lesson.activity.title}</h4>
                    </div>
                    <div className="p-4 space-y-4 bg-white">
                      {lesson.activity.supplies?.length > 0 && (
                        <div>
                          <p className="font-bold text-[#2F4731] text-xs uppercase tracking-wide mb-2">Supplies</p>
                          <ul className="flex flex-wrap gap-2">
                            {lesson.activity.supplies.map((s, i) => (
                              <li key={i} className="px-2 py-1 bg-[#E7DAC3] text-[#2F4731] text-xs font-medium rounded-lg">{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#2F4731] text-xs uppercase tracking-wide mb-2">Instructions</p>
                        <div className="text-[#2F4731] text-sm leading-relaxed space-y-2">
                          {lesson.activity.fullInstructions.split('\n').filter(Boolean).map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1 text-sm uppercase tracking-wide">✅ You're Done When…</h4>
                    <p className="text-emerald-700 text-sm leading-relaxed">{lesson.completionCriteria}</p>
                  </div>

                  {!showLessonChat ? (
                    <button
                      onClick={() => { setShowLessonChat(true); setTimeout(() => lessonChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#2F4731] hover:bg-[#BD6809] text-white font-bold rounded-2xl transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Ask Adeline for Help
                    </button>
                  ) : (
                    <div className="border-2 border-[#2F4731] rounded-2xl overflow-hidden">
                      <div className="bg-[#2F4731] px-4 py-2">
                        <p className="text-white text-xs font-bold uppercase tracking-wide">Ask Adeline</p>
                      </div>
                      <div className="bg-white p-3 space-y-3 max-h-64 overflow-y-auto">
                        {lessonMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === 'user' ? 'bg-[#2F4731] text-white' : 'bg-[#E7DAC3] text-[#2F4731]'}`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {isLessonChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-[#E7DAC3] px-3 py-2 rounded-xl">
                              <Loader2 className="w-4 h-4 animate-spin text-[#2F4731]" />
                            </div>
                          </div>
                        )}
                        <div ref={lessonChatEndRef} />
                      </div>
                      <form onSubmit={handleLessonSubmit} className="flex gap-2 p-3 border-t border-[#E7DAC3]">
                        <input
                          value={lessonInput}
                          onChange={handleLessonInputChange}
                          placeholder="Ask a question about this lesson…"
                          className="flex-1 text-sm border border-[#E7DAC3] rounded-xl px-3 py-2 focus:outline-none focus:border-[#2F4731]"
                        />
                        <button type="submit" disabled={isLessonChatLoading || !lessonInput.trim()}
                          className="p-2 bg-[#2F4731] text-white rounded-xl hover:bg-[#BD6809] transition-colors disabled:opacity-40">
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

