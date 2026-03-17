'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronRight, Loader2, X, AlertTriangle, MessageSquare, Send, TrendingUp, MapPin, RefreshCw, Clock, Target } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { MathWorkspace } from '@/components/lessons/MathWorkspace';
import { ELADetective } from '@/components/lessons/ELADetective';
import { ScienceLab } from '@/components/lessons/ScienceLab';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  subject: string;
  description: string;
  status: 'active' | 'planned';
  progress?: number | null;
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

interface SubjectLessonsPanelProps {
  subject: string;
  keywords: string[];
  accentColor?: string;
}

function matchesSubject(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

export function SubjectLessonsPanel({ subject, keywords, accentColor = '#BD6809' }: SubjectLessonsPanelProps) {
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [upNextCourses, setUpNextCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lessonCourse, setLessonCourse] = useState<Course | null>(null);
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
    onFinish: () => lessonChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
  });

  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/journey/plan');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as any).details || (body as any).error || `Error ${res.status}`);
        return;
      }
      const plan = await res.json();
      setActiveCourses(
        (plan.activeExpeditions ?? [])
          .filter((c: any) => matchesSubject(c.subject, keywords) || matchesSubject(c.title, keywords))
          .map((c: any) => ({ ...c, status: 'active' as const }))
      );
      setUpNextCourses(
        (plan.trailAhead ?? [])
          .filter((c: any) => matchesSubject(c.subject, keywords) || matchesSubject(c.title, keywords))
          .map((c: any) => ({ ...c, status: 'planned' as const }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const openLesson = async (course: Course) => {
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

  const noCoursesFound = !loading && !error && activeCourses.length === 0 && upNextCourses.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
        <p className="text-[#2F4731]/60 italic text-sm">Loading your {subject.toLowerCase()} lessons…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-red-900 font-bold text-sm">Couldn't load your learning plan.</p>
        <p className="text-red-700 text-xs font-mono bg-red-100 p-2 rounded">{error}</p>
        <div className="flex justify-center gap-3">
          <button onClick={loadPlan} className="bg-[#2F4731] text-white px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-[#BD6809] transition-colors">
            Try Again
          </button>
          <Link href="/dashboard/journey" className="border-2 border-[#2F4731] text-[#2F4731] px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-[#E7DAC3] transition-colors">
            Set Up Journey
          </Link>
        </div>
      </div>
    );
  }

  if (noCoursesFound) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-[#BD6809]/30 bg-amber-50 p-8 text-center space-y-3">
        <p className="text-[#2F4731]/60 text-sm">
          No {subject.toLowerCase()} courses found in your learning plan yet.{' '}
          <Link href="/dashboard/journey" className="underline font-bold text-[#BD6809]">
            Visit your Journey
          </Link>{' '}
          to add them.
        </p>
        <button onClick={loadPlan} className="flex items-center gap-1.5 mx-auto text-xs text-[#2F4731]/50 hover:text-[#2F4731] transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh plan
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* ── Active / In Progress ── */}
        {activeCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
              <h2 className="text-xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                In Progress
              </h2>
              <button onClick={loadPlan} className="ml-auto text-[#2F4731]/30 hover:text-[#2F4731]/60 transition-colors" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[#2F4731]/50 text-xs mb-4 pl-8">Click to get today's lesson.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {activeCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => openLesson(course)}
                  className="text-left group rounded-2xl border-2 bg-white hover:bg-amber-50 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  style={{ borderColor: accentColor }}
                >
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${accentColor}, #e8820a)` }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-3">
                        <h3 className="font-bold text-[#2F4731] leading-snug text-base" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                          {course.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="px-2 py-0.5 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full">{course.subject}</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">IN PROGRESS</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#BD6809] flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                    </div>
                    <p className="text-xs text-[#2F4731]/60 mb-3 leading-relaxed">{course.description}</p>
                    {course.progress != null && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-[#2F4731]/40">Progress</span>
                          <span className="text-xs font-bold" style={{ color: accentColor }}>{course.progress}%</span>
                        </div>
                        <div className="bg-[#E7DAC3] rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${course.progress}%`, backgroundColor: accentColor }} />
                        </div>
                      </div>
                    )}
                    <span className="text-xs font-bold flex items-center gap-1 justify-end" style={{ color: accentColor }}>
                      <BookOpen className="w-3 h-3" /> Today's Lesson
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Up Next ── */}
        {upNextCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Up Next in {subject}
              </h2>
            </div>
            <p className="text-[#2F4731]/50 text-xs mb-4 pl-8">Upcoming courses from your learning plan. Click to preview a lesson.</p>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-[#E7DAC3] to-transparent" />
              <div className="space-y-3">
                {upNextCourses.map((course, index) => (
                  <div key={course.id} className="relative pl-14">
                    <div className="absolute left-3.5 top-5 w-4 h-4 rounded-full border-2 border-indigo-400 bg-[#FFFEF7] flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                    <div className="absolute left-0.5 top-3.5 text-[10px] font-bold text-indigo-300">{index + 1}</div>
                    <div className="rounded-2xl border-2 border-[#E7DAC3] bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#2F4731] text-sm mb-1" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                            {course.title}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="text-xs text-[#2F4731]/40 border border-[#E7DAC3] px-2 py-0.5 rounded-full">{course.subject}</span>
                            <span className="text-xs text-[#2F4731]/40 border border-[#E7DAC3] px-2 py-0.5 rounded-full">1 credit</span>
                          </div>
                          <p className="text-xs text-[#2F4731]/55 leading-relaxed">{course.description}</p>
                        </div>
                        <button
                          onClick={() => openLesson(course)}
                          className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-colors whitespace-nowrap flex-shrink-0"
                          style={{ backgroundColor: '#2F4731' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = accentColor)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2F4731')}
                        >
                          <BookOpen className="w-3 h-3" /> Preview Lesson
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
            <div className="bg-[#2F4731] p-5 flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Today's Lesson</p>
                <h3 className="text-xl font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                  {lessonCourse.title}
                </h3>
                <p className="text-white/60 text-xs mt-1">{lessonCourse.subject}</p>
              </div>
              <button onClick={closeLesson} className="text-white/60 hover:text-white ml-4 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {lessonLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: accentColor }} />
                  <p className="text-[#2F4731]/60 italic text-sm">Adeline is designing your lesson…</p>
                </div>
              )}

              {lessonError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center space-y-3">
                  <AlertTriangle className="w-7 h-7 text-red-500 mx-auto" />
                  <p className="text-red-700 text-sm font-mono">{lessonError}</p>
                  <button onClick={() => openLesson(lessonCourse)} className="text-sm font-bold text-red-700 underline">Retry</button>
                </div>
              )}

              {lesson && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full capitalize">📚 {lesson.lessonType}</span>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                      ⏱ {lesson.timeEstimate}
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <h4 className="font-bold text-[#2F4731] mb-2 text-xs uppercase tracking-wide">📖 The Lesson</h4>
                    <div className="text-[#2F4731] leading-relaxed text-sm space-y-2">
                      {lesson.lessonContent.split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                  </div>

                  {lesson.keyFacts?.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                      <h4 className="font-bold text-indigo-900 mb-2 text-xs uppercase tracking-wide">🧠 Remember These</h4>
                      <ul className="space-y-1.5">
                        {lesson.keyFacts.map((fact, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
                            <span className="font-black text-indigo-500 flex-shrink-0">{i + 1}.</span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Components - NO EXTERNAL LINKS */}
                  {subject.toLowerCase().includes('math') && lesson.lessonType === 'Problem Solving' && (
                    <MathWorkspace
                      problem="Calculate the area using the formula: length × width"
                      variables={[
                        { name: 'length', label: 'Length', min: 1, max: 20, defaultValue: 10, unit: ' ft' },
                        { name: 'width', label: 'Width', min: 1, max: 20, defaultValue: 5, unit: ' ft' },
                      ]}
                      formula="length * width"
                      expectedAnswer={50}
                      tolerance={1}
                    />
                  )}

                  {subject.toLowerCase().includes('ela') && lesson.lessonType === 'Reading Comprehension' && (
                    <ELADetective
                      passage={lesson.lessonContent}
                      task="main-idea"
                      correctAnswers={['0']}
                      instructions="Click on the sentence that best expresses the main idea of this passage."
                    />
                  )}

                  {subject.toLowerCase().includes('science') && (
                    <ScienceLab
                      concept="Soil pH"
                      description="Experiment with soil pH by adding lime (raises pH) or sulfur (lowers pH). Most plants prefer slightly acidic to neutral soil (pH 6-7)."
                      variables={[
                        { name: 'lime', label: 'Add Lime', icon: 'plus', effect: 0.5 },
                        { name: 'sulfur', label: 'Add Sulfur', icon: 'minus', effect: -0.5 },
                      ]}
                      visualType="ph-scale"
                      initialValue={7}
                      minValue={0}
                      maxValue={14}
                      optimalRange={[6, 7]}
                      labels={{ 0: 'Very Acidic', 7: 'Neutral', 14: 'Very Basic' }}
                    />
                  )}

                  <div className="border-2 border-[#2F4731] rounded-2xl overflow-hidden">
                    <div className="bg-[#2F4731] px-4 py-2.5">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wide">🛠️ Activity: {lesson.activity.title}</h4>
                    </div>
                    <div className="p-4 space-y-3 bg-white">
                      {lesson.activity.supplies?.length > 0 && (
                        <div>
                          <p className="font-bold text-[#2F4731] text-xs uppercase tracking-wide mb-1.5">Supplies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {lesson.activity.supplies.map((s, i) => (
                              <span key={i} className="px-2 py-1 bg-[#E7DAC3] text-[#2F4731] text-xs font-medium rounded-lg">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#2F4731] text-xs uppercase tracking-wide mb-1.5">Instructions</p>
                        <div className="text-[#2F4731] text-sm leading-relaxed space-y-1.5">
                          {lesson.activity.fullInstructions.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1 text-xs uppercase tracking-wide">✅ You're Done When…</h4>
                    <p className="text-emerald-700 text-sm leading-relaxed">{lesson.completionCriteria}</p>
                  </div>

                  {!showLessonChat ? (
                    <button
                      onClick={() => { setShowLessonChat(true); setTimeout(() => lessonChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2F4731] hover:bg-[#BD6809] text-white font-bold rounded-2xl transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4" /> Ask Adeline for Help
                    </button>
                  ) : (
                    <div className="border-2 border-[#2F4731] rounded-2xl overflow-hidden">
                      <div className="bg-[#2F4731] px-4 py-2">
                        <p className="text-white text-xs font-bold uppercase tracking-wide">Ask Adeline</p>
                      </div>
                      <div className="bg-white p-3 space-y-2 max-h-56 overflow-y-auto">
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
    </>
  );
}
