'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, ScrollText, Eye, AlertTriangle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SubjectLessonsPanel } from '@/components/learning/SubjectLessonsPanel';
import { HistoryEvidenceBoard } from '@/components/dashboard/HistoryEvidenceBoard';
import { evidenceBoardSchema, type EvidenceBoard } from '@/lib/schemas/history';

interface TimelineEntry {
  id?: string;
  topic: string;
  standardNarrative: string;
  primaryEvidence: string;
  primarySourceCitation: string;
  localConnection: string;
  detectiveQuestion: string;
  events: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  modernParallel?: string;
  actionPath?: {
    clemencyCampaign?: string;
    policyReform: string;
    advocacyTarget: string;
    draftLetter: string;
  };
}

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [livingTimeline, setLivingTimeline] = useState<TimelineEntry[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [object, setObject] = useState<Partial<EvidenceBoard> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load Living Timeline from database on mount
  useEffect(() => {
    const loadLivingTimeline = async () => {
      setIsLoadingTimeline(true);
      try {
        const response = await fetch('/api/history/timeline/all');
        if (response.ok) {
          const data = await response.json();
          setLivingTimeline(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load Living Timeline:', error);
      } finally {
        setIsLoadingTimeline(false);
      }
    };

    loadLivingTimeline();
  }, []);

  const handleGenerateTimeline = async () => {
    if (!query.trim()) return;
    setCurrentTopic(query);
    setSaveSuccess(false);
    setObject(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/history/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const jsonStr = line.slice(2);
                const parsed = JSON.parse(jsonStr);
                setObject(parsed);
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate timeline'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTimeline = async () => {
    if (!object) return;
    setIsSaving(true);
    try {
      const timelineEntry = {
        topic: object.topic || currentTopic || '',
        standardNarrative: object.standardNarrative || '',
        primaryEvidence: object.primaryEvidence || '',
        primarySourceCitation: object.primarySourceCitation || '',
        localConnection: object.localConnection || '',
        detectiveQuestion: object.detectiveQuestion || '',
        events: object.events || [],
        modernParallel: object.modernParallel,
        actionPath: object.actionPath,
      };
      const res = await fetch('/api/history/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: timelineEntry })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setLivingTimeline(prev => [timelineEntry, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
            <ScrollText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-indigo-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              True History Timeline
            </h1>
            <p className="text-indigo-800/70 text-lg">
              Discover what really happened - beyond the textbook narratives
            </p>
          </div>
        </div>
      </div>

      {/* Today's Lessons from Learning Plan */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-indigo-100">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-800 mb-4">Today's History Lessons</h3>
        <SubjectLessonsPanel
          subject="History"
          keywords={['history', 'social studies', 'government', 'civics', 'geography', 'economics', 'world history', 'american history', 'political', 'sociology', 'anthropology', 'culture']}
          accentColor="#4f46e5"
        />
      </div>

      {/* Timeline Generator */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <Search size={24} className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-indigo-900">Investigate Historical Events</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error.message || 'Failed to generate timeline'}</span>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a historical event or era (e.g., 'Civil War', 'Federal Reserve', 'World War II')"
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleGenerateTimeline}
            disabled={isLoading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Investigating...
              </>
            ) : (
              'Uncover Truth'
            )}
          </Button>
        </div>

        {/* Generated Timeline Display - Evidence Board */}
        {(object || isLoading) && (
          <div className="space-y-6 border-t-2 border-indigo-100 pt-6">
            {/* Evidence Board Component with Streaming Data */}
            {isLoading && !object ? (
              <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-amber-200 rounded w-3/4 mx-auto"></div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-64 bg-blue-100 rounded-xl"></div>
                    <div className="h-64 bg-amber-100 rounded-xl"></div>
                  </div>
                  <div className="h-48 bg-emerald-100 rounded-xl"></div>
                  <div className="h-64 bg-purple-100 rounded-xl"></div>
                </div>
                <p className="text-center text-indigo-600 italic animate-pulse">Adeline is researching {currentTopic}...</p>
              </div>
            ) : object ? (
              <HistoryEvidenceBoard
                topic={object.topic || currentTopic || ''}
                standardNarrative={object.standardNarrative || ''}
                primaryEvidence={object.primaryEvidence || ''}
                primarySourceCitation={object.primarySourceCitation || ''}
                localConnection={object.localConnection || ''}
                detectiveQuestion={object.detectiveQuestion || ''}
                onSubmitAnswer={async (answer) => {
                  console.log('Detective answer submitted:', answer);
                }}
              />
            ) : null}

            {/* Timeline Events */}
            {object?.events && object.events.length > 0 && (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-800 mb-4 text-lg">⏰ Timeline Events</h4>
                <div className="space-y-4">
                  {object.events.map((event: { year: string; title: string; description: string }, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm min-w-fit">
                      {event.year}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-indigo-900 mb-1">{event.title}</h5>
                      <p className="text-indigo-700 text-sm">{event.description}</p>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modern Action Section */}
            {object?.modernParallel && object?.actionPath && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h4 className="font-bold text-red-900 mb-4 text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Modern Parallel: Take Action Today
                </h4>
                <div className="space-y-4">
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Current Injustice:</p>
                    <p className="text-sm text-red-900 leading-relaxed">{object.modernParallel}</p>
                  </div>
                  {object.actionPath.clemencyCampaign && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🕊️ Clemency Campaign:</p>
                      <p className="text-sm text-amber-900">{object.actionPath.clemencyCampaign}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Policy That Perpetuates This Harm:</p>
                    <p className="text-sm text-red-900 font-semibold">{object.actionPath.policyReform}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Who To Petition:</p>
                    <p className="text-sm text-red-900">{object.actionPath.advocacyTarget}</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Draft Advocacy Letter:</p>
                    <pre className="text-xs text-red-900 whitespace-pre-wrap">{object.actionPath.draftLetter}</pre>
                  </div>
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(object.actionPath!.draftLetter);
                      alert('Advocacy letter copied! Send it to fight injustice.');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    📋 Copy Advocacy Letter
                  </Button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-center border-t-2 border-[#E7DAC3] pt-6">
              <Button 
                onClick={handleSaveTimeline} 
                disabled={isSaving || saveSuccess}
                className="bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] font-['Kalam'] text-lg px-8 py-6 rounded-2xl shadow-md transition-colors"
              >
                {isSaving ? "Pressing into Historical Records..." : saveSuccess ? "✨ Saved to Records!" : "🌿 Save to Historical Records"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Living Timeline - Crowdsourced Historical Knowledge */}
      <div className="bg-[#FFFEF7] rounded-[2rem] p-8 border-2 border-indigo-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-indigo-900" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
              📜 Living Timeline
            </h2>
            <p className="text-indigo-700 italic mt-1">
              A chronological record built by truth-seekers worldwide. Every investigation adds to our collective understanding.
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white text-lg px-4 py-2">
            {livingTimeline.length} Events
          </Badge>
        </div>

        {isLoadingTimeline ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-indigo-700">Loading collective timeline...</span>
          </div>
        ) : livingTimeline.length === 0 ? (
          <div className="text-center py-12 text-indigo-600 italic">
            The Living Timeline awaits its first investigation. Be the first to uncover truth!
          </div>
        ) : (
          <div className="space-y-6">
            {livingTimeline.map((entry, index) => (
              <div 
                key={entry.id || index}
                className="bg-white p-6 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-indigo-900 mb-3" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                      {entry.topic}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Standard Narrative</h4>
                        <p className="text-sm text-blue-700 line-clamp-3">{entry.standardNarrative}</p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Primary Evidence</h4>
                        <p className="text-sm text-amber-700 line-clamp-3">{entry.primaryEvidence}</p>
                      </div>
                    </div>

                    {entry.events && entry.events.length > 0 && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase mb-3">Key Events</h4>
                        <div className="space-y-2">
                          {entry.events.slice(0, 3).map((event, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                              <Badge variant="outline" className="border-indigo-300 text-indigo-700 text-xs">
                                {event.year}
                              </Badge>
                              <span className="text-indigo-900 font-semibold">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center justify-between">
                      <span className="text-xs text-indigo-500 italic">Community Investigation</span>
                      <span className="text-xs text-indigo-400">{entry.primarySourceCitation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

