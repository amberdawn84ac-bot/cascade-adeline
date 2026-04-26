'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { allEvents, Category, HistoricalEvent } from '@/data/history-data';
import { StudentStatusBar } from '@/components/StudentStatusBar';
import { BookOpen, Search, Filter, ChevronDown, ChevronUp, Eye, Shield, Award, ScrollText, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const [filterCategory, setFilterCategory] = useState<Category>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizMode, setQuizMode] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [studentGrade, setStudentGrade] = useState<string>('3');
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<Record<string, number>>({});

  const categories: Category[] = [
    'ALL',
    'GOVERNMENT_OP',
    'WAR',
    'MEDICAL_COVERUP',
    'BIBLICAL_COVERUP',
    'BIBLICAL',
    'US_HISTORY',
    'OKLAHOMA_HISTORY',
    'NATIVE_AMERICAN',
    'HERO'
  ];

  // Fetch student's grade level for automatic adaptation
  useEffect(() => {
    const fetchStudentGrade = async () => {
      try {
        const res = await fetch('/api/student/profile');
        if (res.ok) {
          const data = await res.json();
          // Extract grade number from gradeLabel (e.g., "Grade 5" -> "5")
          const gradeMatch = data.gradeLabel?.match(/Grade (\d+)/);
          if (gradeMatch) {
            setStudentGrade(gradeMatch[1]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch student grade:', error);
      }
    };
    fetchStudentGrade();
  }, []);

  // Adapt content based on grade level
  const adaptContentForGrade = (content: string, grade: string): string => {
    const gradeNum = parseInt(grade) || 3;
    
    if (gradeNum <= 2) {
      // Elementary: Simplify language, shorter sentences
      return content
        .replace(/orchestrated/g, 'planned')
        .replace(/subsequently/g, 'then')
        .replace(/consequently/g, 'so')
        .replace(/approximately/g, 'about')
        .split('.').slice(0, 3).join('.') + '.';
    } else if (gradeNum <= 5) {
      // Middle: Keep most content, simplify complex terms
      return content
        .replace(/orchestrated/g, 'organized')
        .replace(/subsequently/g, 'afterward');
    }
    // High school and above: Keep original content
    return content;
  };

  // Save activity completion for credit tracking
  const saveActivity = async (event: HistoricalEvent, quizCorrect?: number, quizTotal?: number) => {
    if (completedEvents.has(event.id) || isSaving.has(event.id)) return;

    setIsSaving(prev => new Set(prev).add(event.id));

    try {
      const timeSpent = startTime[event.id] ? (Date.now() - startTime[event.id]) / 1000 : 0;
      
      const response = await fetch('/api/history/activity/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          category: event.category,
          quizCorrect,
          quizTotal,
          timeSpent,
          type: event.type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompletedEvents(prev => new Set(prev).add(event.id));
        console.log('Activity saved:', data);
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
    } finally {
      setIsSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.id);
        return newSet;
      });
    }
  };

  // Track when student starts reading an event
  const handleCardExpand = (eventId: string) => {
    if (!startTime[eventId]) {
      setStartTime(prev => ({ ...prev, [eventId]: Date.now() }));
    }
  };

  // Track when student completes reading (by collapsing or after time threshold)
  const handleCardCollapse = (eventId: string, event: HistoricalEvent) => {
    const timeSpent = startTime[eventId] ? (Date.now() - startTime[eventId]) / 1000 : 0;
    // Auto-save if spent more than 30 seconds reading
    if (timeSpent > 30 && !completedEvents.has(eventId)) {
      saveActivity(event);
    }
  };

  const sortedEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => {
      const getDateVal = (d: string) => {
        if (d.startsWith('0030')) return 30;
        if (d.startsWith('0325')) return 325;
        if (d.startsWith('0405')) return 405;
        return new Date(d).getTime();
      };
      return getDateVal(a.date) - getDateVal(b.date);
    });
  }, []);

  const filteredEvents = useMemo(() => {
    let events = sortedEvents;

    if (filterCategory !== 'ALL') {
      events = events.filter(e => e.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(query) ||
        (e.narrative && e.narrative.toLowerCase().includes(query)) ||
        (e.reality && e.reality.toLowerCase().includes(query)) ||
        (e.story && e.story.toLowerCase().includes(query)) ||
        (e.followTheMoney && e.followTheMoney.toLowerCase().includes(query)) ||
        e.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return events;
  }, [sortedEvents, filterCategory, searchQuery]);

  const handleQuizAnswer = (eventId: string, isReality: boolean, event: HistoricalEvent) => {
    if (quizAnswered.has(eventId)) return;

    const newAnswered = new Set(quizAnswered);
    newAnswered.add(eventId);
    setQuizAnswered(newAnswered);

    const correct = isReality ? 1 : 0;
    setQuizScore(prev => prev + correct);

    // Save activity with quiz results
    saveActivity(event, correct, 1);
  };

  const getCategoryIcon = (category: Category) => {
    const icons: Record<Category, any> = {
      ALL: BookOpen,
      GOVERNMENT_OP: Shield,
      WAR: ScrollText,
      MEDICAL_COVERUP: Shield,
      BIBLICAL_COVERUP: BookOpen,
      BIBLICAL: BookOpen,
      US_HISTORY: ScrollText,
      OKLAHOMA_HISTORY: ScrollText,
      NATIVE_AMERICAN: Award,
      HERO: Award
    };
    return icons[category] || BookOpen;
  };

  const getCategoryColor = (category: Category): string => {
    const colors: Record<string, string> = {
      GOVERNMENT_OP: 'border-rose-300 bg-rose-50',
      WAR: 'border-orange-300 bg-orange-50',
      MEDICAL_COVERUP: 'border-purple-300 bg-purple-50',
      BIBLICAL_COVERUP: 'border-yellow-300 bg-yellow-50',
      BIBLICAL: 'border-indigo-300 bg-indigo-50',
      US_HISTORY: 'border-red-300 bg-red-50',
      OKLAHOMA_HISTORY: 'border-pink-300 bg-pink-50',
      NATIVE_AMERICAN: 'border-amber-300 bg-amber-50',
      HERO: 'border-emerald-300 bg-emerald-50'
    };
    return colors[category] || 'border-slate-300 bg-slate-50';
  };

  const getCategoryBadgeColor = (category: Category): string => {
    const colors: Record<string, string> = {
      GOVERNMENT_OP: 'bg-rose-100 text-rose-800',
      WAR: 'bg-orange-100 text-orange-800',
      MEDICAL_COVERUP: 'bg-purple-100 text-purple-800',
      BIBLICAL_COVERUP: 'bg-yellow-100 text-yellow-800',
      BIBLICAL: 'bg-indigo-100 text-indigo-800',
      US_HISTORY: 'bg-red-100 text-red-800',
      OKLAHOMA_HISTORY: 'bg-pink-100 text-pink-800',
      NATIVE_AMERICAN: 'bg-amber-100 text-amber-800',
      HERO: 'bg-emerald-100 text-emerald-800'
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2]">
      {/* Header */}
      <div className="p-6 border-b border-[#E7DAC3] bg-[#FFFEF7]">
        <h1 className="text-3xl font-bold text-[#2F4731] flex items-center gap-3 font-emilys-candy">
          <ScrollText className="w-8 h-8" /> Truth-Based History
        </h1>
        <p className="text-[#2F4731]/70 text-sm mt-1 italic">
          Uncover what really happened through primary sources and evidence.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <StudentStatusBar />

          {/* Controls */}
          <div className="bg-white rounded-xl border-2 border-[#E7DAC3] p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F4731]/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E7DAC3] focus:border-[#BD6809] focus:outline-none text-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="relative w-full lg:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as Category)}
                  className="w-full px-4 py-2 rounded-lg border border-[#E7DAC3] focus:border-[#BD6809] focus:outline-none text-sm appearance-none bg-white cursor-pointer"
                  aria-label="Filter by category"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All Categories' : cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2F4731]/40 w-4 h-4 pointer-events-none" />
              </div>

              {/* Quiz Mode Toggle */}
              <button
                onClick={() => {
                  setQuizMode(!quizMode);
                  setQuizScore(0);
                  setQuizAnswered(new Set());
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  quizMode
                    ? "bg-[#BD6809] text-white"
                    : "bg-[#E7DAC3] text-[#2F4731] hover:bg-[#D4C4A8]"
                )}
              >
                {quizMode ? `Quiz: ${quizScore}/${quizAnswered.size}` : 'Quiz Mode'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#2F4731]/60">
              Showing {filteredEvents.length} events
            </p>
            <p className="text-xs text-[#2F4731]/40">
              Content adapted for Grade {studentGrade}
            </p>
          </div>

          {/* Timeline */}
          {filteredEvents.length > 0 ? (
            <div className="relative space-y-6 pb-12">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#E7DAC3]" />

              {filteredEvents.map((event, index) => {
                const isAnswered = quizAnswered.has(event.id);
                const isExpanded = expandedCard === event.id;
                const Icon = getCategoryIcon(event.category);

                return (
                  <div key={event.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10",
                      event.type === 'hero' ? 'bg-emerald-500' :
                      event.type === 'biblical' ? 'bg-indigo-500' :
                      'bg-[#BD6809]'
                    )} />

                    {/* Event Card */}
                    <div className={cn(
                      "rounded-xl border-2 overflow-hidden transition-all shadow-sm hover:shadow-md",
                      getCategoryColor(event.category)
                    )}>
                      {/* Card Header */}
                      <div
                        onClick={() => {
                          if (isExpanded) {
                            handleCardCollapse(event.id, event);
                          } else {
                            handleCardExpand(event.id);
                          }
                          setExpandedCard(isExpanded ? null : event.id);
                        }}
                        className="p-4 cursor-pointer flex items-start gap-3"
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          getCategoryBadgeColor(event.category)
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-[#2F4731] text-lg leading-tight">
                                {event.title}
                              </h3>
                              <p className="text-xs text-[#2F4731]/60 mt-1 font-mono">
                                {event.date}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {completedEvents.has(event.id) && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              )}
                              {isSaving.has(event.id) && (
                                <Clock className="w-5 h-5 text-[#BD6809] animate-spin flex-shrink-0" />
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-[#2F4731]/40 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-[#2F4731]/40 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {event.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-[#2F4731]/70"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-black/10 p-4 space-y-4">
                          {event.type === 'coverup' && (
                            <>
                              {quizMode ? (
                                <div className="space-y-3">
                                  <p className="text-sm font-medium text-[#2F4731]/80">
                                    What's the truth behind this event?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleQuizAnswer(event.id, false, event)}
                                      disabled={isAnswered}
                                      className={cn(
                                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        isAnswered
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-white border-2 border-[#E7DAC3] hover:border-[#BD6809] text-[#2F4731]"
                                      )}
                                    >
                                      Narrative
                                    </button>
                                    <button
                                      onClick={() => handleQuizAnswer(event.id, true, event)}
                                      disabled={isAnswered}
                                      className={cn(
                                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        isAnswered
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-[#BD6809] text-white hover:bg-[#A55808]"
                                      )}
                                    >
                                      Reality
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs font-bold text-[#2F4731]/60 uppercase tracking-wider mb-1">
                                      Official Narrative
                                    </p>
                                    <p className="text-sm text-[#2F4731]/80 italic">
                                      {adaptContentForGrade(event.narrative || '', studentGrade)}
                                    </p>
                                  </div>
                                  <div className="bg-[#BD6809]/10 rounded-lg p-3 border border-[#BD6809]/20">
                                    <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wider mb-1 flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      The Reality
                                    </p>
                                    <p className="text-sm text-[#2F4731] font-medium">
                                      {adaptContentForGrade(event.reality || '', studentGrade)}
                                    </p>
                                  </div>
                                  {event.followTheMoney && (
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                                        💰 Follow the Money
                                      </p>
                                      <p className="text-sm text-emerald-800">
                                        {adaptContentForGrade(event.followTheMoney, studentGrade)}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}

                          {event.type === 'hero' && (
                            <>
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                                      🏆 The Story
                                </p>
                                <p className="text-sm text-emerald-800">
                                  {adaptContentForGrade(event.story || '', studentGrade)}
                                </p>
                              </div>
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs font-bold text-[#2F4731]/60 uppercase tracking-wider mb-1">
                                      Impact
                                </p>
                                <p className="text-sm text-[#2F4731]/80">
                                  {adaptContentForGrade(event.impact || '', studentGrade)}
                                </p>
                              </div>
                              {event.whyNotCelebrated && (
                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                                      Why Not Celebrated?
                                  </p>
                                  <p className="text-sm text-amber-800">
                                    {adaptContentForGrade(event.whyNotCelebrated, studentGrade)}
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          {event.type === 'biblical' && (
                            <>
                              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                      📜 Scripture
                                </p>
                                <p className="text-sm text-indigo-800 font-medium">
                                  {event.scripture}
                                </p>
                              </div>
                              {event.hebrewGreek && (
                                <div className="bg-white/60 rounded-lg p-3">
                                  <p className="text-xs font-bold text-[#2F4731]/60 uppercase tracking-wider mb-1">
                                      Hebrew/Greek
                                  </p>
                                  <p className="text-sm text-[#2F4731]/80 font-mono">
                                    {event.hebrewGreek}
                                  </p>
                                </div>
                              )}
                              {event.literalTranslation && (
                                <div className="bg-white/60 rounded-lg p-3">
                                  <p className="text-xs font-bold text-[#2F4731]/60 uppercase tracking-wider mb-1">
                                      Literal Translation
                                  </p>
                                  <p className="text-sm text-[#2F4731]/80">
                                    {event.literalTranslation}
                                  </p>
                                </div>
                              )}
                              {event.contextualMeaning && (
                                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                      Contextual Meaning
                                  </p>
                                  <p className="text-sm text-indigo-800">
                                    {adaptContentForGrade(event.contextualMeaning, studentGrade)}
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          {event.sources && event.sources.length > 0 && (
                            <div className="pt-2 border-t border-black/10">
                              <p className="text-xs font-bold text-[#2F4731]/60 uppercase tracking-wider mb-2">
                                Sources
                              </p>
                              <div className="space-y-1">
                                {event.sources.map((source, i) => (
                                  <div key={i} className="text-xs">
                                    <span className="inline-block px-2 py-0.5 rounded bg-[#2F4731]/10 text-[#2F4731] font-medium mr-2">
                                      {source.type}
                                    </span>
                                    {source.url ? (
                                      <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#BD6809] hover:underline"
                                      >
                                        {source.title}
                                      </a>
                                    ) : (
                                      <span className="text-[#2F4731]/80">{source.title}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <ScrollText className="w-16 h-16 mx-auto text-[#E7DAC3] mb-4" />
              <p className="text-[#2F4731]/60 text-lg mb-2">No events found</p>
              <p className="text-[#2F4731]/40 text-sm">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('ALL');
                }}
                className="mt-4 px-4 py-2 bg-[#E7DAC3] text-[#2F4731] rounded-lg text-sm font-medium hover:bg-[#D4C4A8] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
