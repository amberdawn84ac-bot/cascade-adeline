'use client';

import { useState, useEffect } from 'react';
import { Mountain, TrendingUp, MapPin, MessageSquare, X, Loader2, Calendar, Award, AlertTriangle, BookOpen, Copy, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChat } from '@ai-sdk/react';

interface Credit {
  id: string;
  title: string;
  subject: string;
  creditsNeeded: number;
  description: string;
  status: 'active' | 'planned' | 'completed';
  dueDate?: string;
  progress?: number;
}

interface LessonStep {
  step: number;
  title: string;
  instruction: string;
}

interface Lesson {
  lessonTitle: string;
  lessonType: string;
  timeEstimate: string;
  overview: string;
  steps: LessonStep[];
  materials: string[];
  completionCriteria: string;
  chatPrompt: string;
}

interface JourneyPlan {
  graduationDate: string;
  totalCreditsNeeded: number;
  creditsEarned: number;
  activeExpeditions: Credit[];
  trailAhead: Credit[];
  lastActivity?: {
    activityName: string;
    date: string;
    daysSince: number;
  };
  adelineMessage: string;
}

export default function JourneyPage() {
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [showChangeRoute, setShowChangeRoute] = useState(false);
  const [lessonCredit, setLessonCredit] = useState<Credit | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: '/api/journey/change-route',
    body: { creditId: selectedCredit?.id },
    onFinish: async () => {
      // Reload the plan after route change
      await loadPlan();
      setShowChangeRoute(false);
      setSelectedCredit(null);
    }
  });

  const loadPlan = async (refresh = false) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const url = refresh ? '/api/journey/plan?refresh=true' : '/api/journey/plan';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      } else {
        const body = await response.json().catch(() => ({}));
        setLoadError((body as any).details || (body as any).error || `Server error ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load journey plan:', error);
      setLoadError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleChangeRoute = (credit: Credit) => {
    setSelectedCredit(credit);
    setShowChangeRoute(true);
  };

  const openLesson = async (credit: Credit) => {
    setLessonCredit(credit);
    setLesson(null);
    setLessonError(null);
    setLessonLoading(true);
    try {
      const res = await fetch('/api/journey/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: credit.subject, title: credit.title, description: credit.description }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).details || (body as any).error || 'Failed to generate lesson');
      }
      setLesson(await res.json());
    } catch (err: unknown) {
      setLessonError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLessonLoading(false);
    }
  };

  const copyPrompt = () => {
    if (!lesson) return;
    navigator.clipboard.writeText(lesson.chatPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center p-6">
        <Card className="border-2 border-red-200 bg-red-50 max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
            <p className="text-red-900 font-bold">Failed to load your journey plan.</p>
            {loadError && <p className="text-red-700 text-sm font-mono bg-red-100 p-2 rounded">{loadError}</p>}
            <button
              onClick={() => loadPlan(true)}
              className="bg-[#2F4731] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#BD6809] transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = Math.round((plan.creditsEarned / plan.totalCreditsNeeded) * 100);
  const creditsRemaining = plan.totalCreditsNeeded - plan.creditsEarned;
  const gradMonth = new Date(plan.graduationDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Topographic contour lines for the mountain SVG
  const topoLayers = [95, 80, 65, 50, 35, 20];

  return (
    <div className="min-h-screen bg-[#FFFEF7]">

      {/* ═══════════════════════════════════════════════════
          ZONE 1 — THE SUMMIT (Hero)
      ═══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1e3020] via-[#2F4731] to-[#3d5c42] text-white">
        {/* Topographic SVG background */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
          {topoLayers.map((y, i) => (
            <path
              key={i}
              d={`M 0 ${y + 120} Q 100 ${y + 80} 200 ${y + 100} Q 300 ${y + 60} 400 ${y + 40} Q 500 ${y + 20} 600 ${y + 55} Q 700 ${y + 80} 800 ${y + 70} L 800 300 L 0 300 Z`}
              fill="none"
              stroke="#BD6809"
              strokeWidth="1.5"
            />
          ))}
          {/* Summit peak */}
          <path d="M 350 20 L 400 5 L 450 20" stroke="#BD6809" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="400" cy="5" r="4" fill="#BD6809"/>
          {/* Trail marker icon */}
          <circle cx="400" cy="5" r="10" fill="none" stroke="#BD6809" strokeWidth="1.5" opacity="0.6"/>
        </svg>

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: title + progress */}
            <div>
              <p className="text-[#BD6809] font-bold uppercase tracking-widest text-xs mb-2" style={{ fontFamily: 'Kalam, cursive' }}>
                Graduation Ascent
              </p>
              <h1 className="text-5xl font-bold leading-tight mb-4" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                The Summit
              </h1>
              <p className="text-white/70 mb-6" style={{ fontFamily: 'Kalam, cursive' }}>
                Every credit is a step up the mountain. The view from the top is worth every hard day.
              </p>

              {/* Big progress ring replacement: horizontal stacked bar */}
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-6xl font-black text-white">{progressPercent}<span className="text-3xl text-[#BD6809]">%</span></span>
                  <div className="text-right">
                    <p className="text-white/60 text-sm" style={{ fontFamily: 'Kalam, cursive' }}>to the summit</p>
                    <p className="text-[#BD6809] font-bold">{creditsRemaining} credits left</p>
                  </div>
                </div>
                <div className="h-5 bg-white/10 rounded-full overflow-hidden border border-white/20 relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#BD6809] to-[#e8820a] rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${Math.max(progressPercent, 2)}%` }}
                  >
                    <div className="absolute right-0 top-0 h-full w-2 bg-white/40 rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white/50" style={{ fontFamily: 'Kalam, cursive' }}>
                  <span>Base Camp</span>
                  <span>{plan.creditsEarned} / {plan.totalCreditsNeeded} credits</span>
                  <span>⛰️ Summit</span>
                </div>
              </div>
            </div>

            {/* Right: graduation target card */}
            <div className="flex justify-center md:justify-end">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 text-center max-w-xs w-full">
                <Award className="w-14 h-14 text-[#BD6809] mx-auto mb-3" />
                <p className="text-white/60 uppercase tracking-widest text-xs mb-1" style={{ fontFamily: 'Kalam, cursive' }}>Target Summit</p>
                <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>{gradMonth}</h2>
                <p className="text-white/50 text-sm" style={{ fontFamily: 'Kalam, cursive' }}>Graduation Defense</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/60 text-xs" style={{ fontFamily: 'Kalam, cursive' }}>
                    Not a test — a public demonstration of everything you've built.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ═══════════════════════════════════════════════════
            ZONE 2 — ADELINE'S COMMAND POST
        ═══════════════════════════════════════════════════ */}
        <div className="relative">
          {/* Compass SVG watermark */}
          <svg className="absolute right-4 top-4 w-16 h-16 opacity-5" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#2F4731" strokeWidth="2" fill="none"/>
            <polygon points="50,10 53,50 50,45 47,50" fill="#BD6809"/>
            <polygon points="50,90 53,50 50,55 47,50" fill="#2F4731"/>
            <polygon points="10,50 50,47 45,50 50,53" fill="#2F4731"/>
            <polygon points="90,50 50,47 55,50 50,53" fill="#BD6809"/>
          </svg>

          <div className={`relative rounded-3xl border-2 p-6 ${
            plan.lastActivity && plan.lastActivity.daysSince > 6
              ? 'border-red-400 bg-gradient-to-r from-red-50 to-orange-50'
              : plan.lastActivity && plan.lastActivity.daysSince > 3
              ? 'border-[#BD6809] bg-gradient-to-r from-amber-50 to-yellow-50'
              : 'border-[#2F4731] bg-gradient-to-r from-[#2F4731]/5 to-emerald-50'
          }`}>
            <div className="flex items-start gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl ${
                plan.lastActivity && plan.lastActivity.daysSince > 6 ? 'bg-red-600' :
                plan.lastActivity && plan.lastActivity.daysSince > 3 ? 'bg-[#BD6809]' : 'bg-[#2F4731]'
              }`} style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                A
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                    Adeline's Command Post
                  </h3>
                  {plan.lastActivity && plan.lastActivity.daysSince > 6 && (
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      🚨 {plan.lastActivity.daysSince} DAYS IDLE — MOVE.
                    </span>
                  )}
                  {plan.lastActivity && plan.lastActivity.daysSince > 3 && plan.lastActivity.daysSince <= 6 && (
                    <span className="px-3 py-1 bg-[#BD6809] text-white text-xs font-bold rounded-full">
                      ⚠️ {plan.lastActivity.daysSince} days since last activity
                    </span>
                  )}
                  {(!plan.lastActivity || plan.lastActivity.daysSince <= 3) && (
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                      ✅ On Track
                    </span>
                  )}
                </div>
                <p className="text-[#2F4731] leading-relaxed text-base" style={{ fontFamily: 'Kalam, cursive', fontSize: '1.05rem' }}>
                  {plan.adelineMessage}
                </p>
                {plan.lastActivity && (
                  <p className="text-xs text-[#2F4731]/50 mt-3 flex items-center gap-1" style={{ fontFamily: 'Kalam, cursive' }}>
                    <Calendar className="w-3 h-3" />
                    Last logged: <strong>{plan.lastActivity.activityName}</strong> — {plan.lastActivity.daysSince === 0 ? 'today' : `${plan.lastActivity.daysSince} days ago`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ZONE 3 — ACTIVE EXPEDITIONS
        ═══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-[#BD6809]" />
              <h2 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Active Expeditions
              </h2>
            </div>
            <span className="text-sm text-[#2F4731]/50 border border-[#E7DAC3] px-3 py-1 rounded-full" style={{ fontFamily: 'Kalam, cursive' }}>
              {Math.min(plan.activeExpeditions.length, 4)} active
            </span>
          </div>
          <p className="text-[#2F4731]/60 mb-5 pl-10" style={{ fontFamily: 'Kalam, cursive' }}>
            Courses you're working on right now. Click any card to get today's lesson.
          </p>

          {plan.activeExpeditions.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50 p-10 text-center">
              <span className="text-5xl block mb-3">⛺</span>
              <p className="text-amber-900 font-bold text-lg" style={{ fontFamily: 'Kalam, cursive' }}>
                Base camp is empty. The summit doesn't wait.
              </p>
              <p className="text-amber-700 text-sm mt-1" style={{ fontFamily: 'Kalam, cursive' }}>
                Click a course on the trail below to start your first expedition.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {plan.activeExpeditions.slice(0, 4).map((credit) => (
                <button
                  key={credit.id}
                  onClick={() => openLesson(credit)}
                  className="text-left group relative rounded-3xl border-2 border-[#BD6809] bg-white hover:bg-amber-50 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-[#BD6809] to-[#e8820a] w-full" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-4">
                        <h3 className="text-lg font-bold text-[#2F4731] leading-snug mb-1" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                          {credit.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full">
                            {credit.subject}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                            IN PROGRESS
                          </span>
                          {credit.subject.toLowerCase().includes('clep') && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">CLEP Prep</span>
                          )}
                          {credit.subject.toLowerCase().includes('dual') && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">Dual Enrollment</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#BD6809] flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                    </div>

                    <p className="text-sm text-[#2F4731]/70 mb-4 leading-relaxed" style={{ fontFamily: 'Kalam, cursive' }}>
                      {credit.description}
                    </p>

                    {credit.progress != null && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#2F4731]/50" style={{ fontFamily: 'Kalam, cursive' }}>Progress</span>
                          <span className="text-xs font-bold text-[#BD6809]">{credit.progress}%</span>
                        </div>
                        <div className="bg-[#E7DAC3] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#BD6809] h-full rounded-full" style={{ width: `${credit.progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {credit.dueDate ? (
                        <span className="text-xs text-[#2F4731]/50 flex items-center gap-1" style={{ fontFamily: 'Kalam, cursive' }}>
                          <Calendar className="w-3 h-3" /> Target: {new Date(credit.dueDate).toLocaleDateString()}
                        </span>
                      ) : <span />}
                      <span className="text-xs font-bold text-[#BD6809] bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Today's Lesson
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            ZONE 4 — THE TRAIL AHEAD (Vertical Timeline)
        ═══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-7 h-7 text-indigo-600" />
            <h2 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              The Trail Ahead
            </h2>
          </div>
          <p className="text-[#2F4731]/60 mb-8 pl-10" style={{ fontFamily: 'Kalam, cursive' }}>
            Your next {plan.trailAhead.length} courses, mapped to your interests. Don't like the route? Change it.
          </p>

          <div className="relative">
            {/* Vertical trail line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-[#E7DAC3] to-transparent" />

            <div className="space-y-4">
              {plan.trailAhead.map((credit, index) => (
                <div key={credit.id} className="relative pl-16">
                  {/* Trail marker dot */}
                  <div className="absolute left-4 top-6 w-5 h-5 rounded-full border-2 border-indigo-400 bg-[#FFFEF7] flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  {/* Step number */}
                  <div className="absolute left-1 top-4 text-[10px] font-bold text-indigo-300" style={{ fontFamily: 'Kalam, cursive' }}>
                    {index + 1}
                  </div>

                  <div className="rounded-2xl border-2 border-[#E7DAC3] bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                            {credit.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="text-xs text-[#2F4731]/50 border border-[#E7DAC3] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Kalam, cursive' }}>
                            {credit.subject}
                          </span>
                          <span className="text-xs text-[#2F4731]/50 border border-[#E7DAC3] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Kalam, cursive' }}>
                            1 credit
                          </span>
                          {credit.title.toLowerCase().includes('clep') && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">CLEP</span>
                          )}
                          {credit.title.toLowerCase().includes('ap ') && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">AP</span>
                          )}
                          {credit.title.toLowerCase().includes('dual') && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Dual Enrollment</span>
                          )}
                        </div>
                        <p className="text-sm text-[#2F4731]/60 leading-relaxed" style={{ fontFamily: 'Kalam, cursive' }}>
                          {credit.description}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => openLesson(credit)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#2F4731] text-white text-xs font-bold rounded-xl hover:bg-[#BD6809] transition-colors whitespace-nowrap"
                          style={{ fontFamily: 'Kalam, cursive' }}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Today's Lesson
                        </button>
                        <button
                          onClick={() => handleChangeRoute(credit)}
                          className="flex items-center gap-1.5 px-3 py-2 border-2 border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors whitespace-nowrap"
                          style={{ fontFamily: 'Kalam, cursive' }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Change Route
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summit marker at bottom of trail */}
              <div className="relative pl-16">
                <div className="absolute left-3 top-3 w-7 h-7 rounded-full bg-[#BD6809] flex items-center justify-center z-10">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-2xl border-2 border-[#BD6809] bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <p className="font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                    ⛰️ Graduation Defense — {gradMonth}
                  </p>
                  <p className="text-xs text-[#2F4731]/60 mt-1" style={{ fontFamily: 'Kalam, cursive' }}>
                    {creditsRemaining} more credits to go. You've got this.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          LESSON MODAL
      ═══════════════════════════════════════════════════ */}
      {lessonCredit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEF7] rounded-3xl border-2 border-[#2F4731] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-[#2F4731] p-6 flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-[#BD6809] text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'Kalam, cursive' }}>
                  Today's Lesson
                </p>
                <h3 className="text-2xl font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                  {lessonCredit.title}
                </h3>
                <p className="text-white/60 text-sm mt-1" style={{ fontFamily: 'Kalam, cursive' }}>{lessonCredit.subject}</p>
              </div>
              <button onClick={() => { setLessonCredit(null); setLesson(null); }} className="text-white/60 hover:text-white ml-4 flex-shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {lessonLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#BD6809]" />
                  <p className="text-[#2F4731]/60 italic" style={{ fontFamily: 'Kalam, cursive' }}>Adeline is designing your lesson...</p>
                </div>
              )}

              {lessonError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-red-700 text-sm font-mono">{lessonError}</p>
                  <button onClick={() => openLesson(lessonCredit)} className="text-sm font-bold text-red-700 underline">Retry</button>
                </div>
              )}

              {lesson && (
                <>
                  {/* Meta row */}
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full capitalize" style={{ fontFamily: 'Kalam, cursive' }}>
                      📚 {lesson.lessonType}
                    </span>
                    <span className="px-3 py-1 bg-[#BD6809]/10 text-[#BD6809] text-xs font-bold rounded-full" style={{ fontFamily: 'Kalam, cursive' }}>
                      ⏱ {lesson.timeEstimate}
                    </span>
                  </div>

                  {/* Overview */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <h4 className="font-bold text-[#2F4731] mb-2 text-sm uppercase tracking-wide" style={{ fontFamily: 'Kalam, cursive' }}>Overview</h4>
                    <p className="text-[#2F4731] leading-relaxed" style={{ fontFamily: 'Kalam, cursive' }}>{lesson.overview}</p>
                  </div>

                  {/* Materials */}
                  {lesson.materials.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#2F4731] mb-3 text-sm uppercase tracking-wide" style={{ fontFamily: 'Kalam, cursive' }}>
                        🎒 Materials & Resources
                      </h4>
                      <ul className="space-y-1.5">
                        {lesson.materials.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#2F4731]/80" style={{ fontFamily: 'Kalam, cursive' }}>
                            <span className="text-[#BD6809] mt-0.5 flex-shrink-0">◆</span> {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Steps */}
                  <div>
                    <h4 className="font-bold text-[#2F4731] mb-3 text-sm uppercase tracking-wide" style={{ fontFamily: 'Kalam, cursive' }}>
                      🗺️ Today's Steps
                    </h4>
                    <div className="space-y-3">
                      {lesson.steps.map((s) => (
                        <div key={s.step} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#2F4731] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {s.step}
                          </div>
                          <div className="flex-1 bg-white border border-[#E7DAC3] rounded-xl p-3">
                            <p className="font-bold text-[#2F4731] text-sm mb-1" style={{ fontFamily: 'Kalam, cursive' }}>{s.title}</p>
                            <p className="text-[#2F4731]/70 text-sm leading-relaxed" style={{ fontFamily: 'Kalam, cursive' }}>{s.instruction}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Completion criteria */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <h4 className="font-bold text-emerald-800 mb-1 text-sm uppercase tracking-wide" style={{ fontFamily: 'Kalam, cursive' }}>
                      ✅ You're Done When...
                    </h4>
                    <p className="text-emerald-700 text-sm leading-relaxed" style={{ fontFamily: 'Kalam, cursive' }}>{lesson.completionCriteria}</p>
                  </div>

                  {/* Chat prompt copy */}
                  <div className="bg-[#2F4731]/5 border border-[#2F4731]/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-[#2F4731] text-sm" style={{ fontFamily: 'Kalam, cursive' }}>💬 Ask Adeline for Help</h4>
                      <button
                        onClick={copyPrompt}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F4731] text-white text-xs font-bold rounded-xl hover:bg-[#BD6809] transition-colors"
                        style={{ fontFamily: 'Kalam, cursive' }}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                    <p className="text-[#2F4731]/60 text-xs italic leading-relaxed" style={{ fontFamily: 'Kalam, cursive' }}>
                      "{lesson.chatPrompt}"
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          CHANGE ROUTE MODAL
      ═══════════════════════════════════════════════════ */}
      {showChangeRoute && selectedCredit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEF7] rounded-3xl border-2 border-indigo-400 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-indigo-700 p-6 flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'Kalam, cursive' }}>Change Your Route</p>
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                  {selectedCredit.title}
                </h3>
                <p className="text-indigo-200 text-sm mt-1" style={{ fontFamily: 'Kalam, cursive' }}>
                  Tell Adeline how you'd like to earn this credit instead
                </p>
              </div>
              <button onClick={() => { setShowChangeRoute(false); setSelectedCredit(null); }} className="text-white/60 hover:text-white ml-4 flex-shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-sm text-indigo-900" style={{ fontFamily: 'Kalam, cursive' }}>
                  <strong>Adeline:</strong> This is mapped as <strong>{selectedCredit.title}</strong> ({selectedCredit.subject}). 
                  Want to swap it for a CLEP test? An AP class? A homesteading project? Tell me and I'll reroute you.
                </p>
              </div>

              {messages.map((message, i) => (
                <div key={i} className={`p-4 rounded-xl ${message.role === 'user' ? 'bg-blue-50 border border-blue-200 ml-8' : 'bg-green-50 border border-green-200 mr-8'}`}>
                  <p className="text-xs font-bold mb-1 text-[#2F4731]" style={{ fontFamily: 'Kalam, cursive' }}>
                    {message.role === 'user' ? 'You' : 'Adeline'}
                  </p>
                  <p className="text-sm text-[#2F4731]" style={{ fontFamily: 'Kalam, cursive' }}>{message.content}</p>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-[#2F4731]/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm italic" style={{ fontFamily: 'Kalam, cursive' }}>Adeline is charting a new route...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-5 border-t border-[#E7DAC3] bg-white/50 flex-shrink-0">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="e.g. I want to do a CLEP test instead..."
                  className="flex-1 px-4 py-3 border-2 border-[#E7DAC3] rounded-xl focus:border-indigo-400 focus:outline-none text-sm"
                  style={{ fontFamily: 'Kalam, cursive' }}
                  disabled={isChatLoading}
                />
                <Button type="submit" disabled={isChatLoading || !input.trim()} className="bg-indigo-700 hover:bg-indigo-800 rounded-xl">
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
