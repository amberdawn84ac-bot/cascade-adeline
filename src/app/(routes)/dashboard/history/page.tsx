'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, ScrollText, Eye, AlertTriangle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TimelineEntry {
  id?: string;
  topic: string;
  sanitizedMyth: string;
  historicalReality: string;
  primarySourcesCiting: string[];
  primarySourceCitation: string;
  directQuote: string;
  events: Array<{
    year: string;
    title: string;
    description: string;
  }>;
}

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const [generatedTimeline, setGeneratedTimeline] = useState<TimelineEntry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [livingTimeline, setLivingTimeline] = useState<TimelineEntry[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);

  // Load Living Timeline from database on mount
  useEffect(() => {
    const loadLivingTimeline = async () => {
      setIsLoadingTimeline(true);
      try {
        const response = await fetch('/api/history/timeline/all');
        if (response.ok) {
          const data = await response.json();
          setLivingTimeline(data);
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
    
    setGeneratedTimeline(null);
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/history/timeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (response.ok) {
        const timeline = await response.json();
        setGeneratedTimeline(timeline);
      } else {
        console.error('Failed to generate timeline');
      }
    } catch (e) {
      console.error('Error generating timeline:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTimeline = async () => {
    if (!generatedTimeline) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/history/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: generatedTimeline })
      });
      if (res.ok) {
        setSaveSuccess(true);
        // Add to Living Timeline immediately
        setLivingTimeline(prev => [generatedTimeline, ...prev]);
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

      {/* Timeline Generator */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <Search size={24} className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-indigo-900">Investigate Historical Events</h2>
        </div>
        
        <div className="flex gap-4 mb-6">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a historical event or era (e.g., 'Civil War', 'Federal Reserve', 'World War II')"
            disabled={isGenerating}
            className="flex-1"
          />
          <Button 
            onClick={handleGenerateTimeline}
            disabled={isGenerating || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Investigating...
              </>
            ) : (
              'Uncover Truth'
            )}
          </Button>
        </div>

        {/* Generated Timeline Display */}
        {generatedTimeline && (
          <div className="space-y-6 border-t-2 border-indigo-100 pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-indigo-900 mb-2">{generatedTimeline.topic}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h4 className="font-bold text-red-800 mb-3 text-lg">📚 Sanitized Myth (Textbook Version)</h4>
                <p className="text-red-700 leading-relaxed">{generatedTimeline.sanitizedMyth}</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <h4 className="font-bold text-green-800 mb-3 text-lg">🔍 Historical Reality (Primary Sources)</h4>
                <p className="text-green-700 leading-relaxed">{generatedTimeline.historicalReality}</p>
              </div>
            </div>

            {/* Primary Source Evidence */}
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-300">
              <h4 className="font-bold text-amber-900 mb-4 text-lg flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                Primary Source Evidence
              </h4>
              <div className="bg-white p-4 rounded-lg border border-amber-200 mb-4">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Document Citation:</p>
                <p className="text-amber-900 font-medium">{generatedTimeline.primarySourceCitation}</p>
              </div>
              <div className="bg-[#FFFEF7] p-5 rounded-lg border-l-4 border-amber-600">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">Direct Quote from Original Document:</p>
                <blockquote className="text-amber-900 leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
                  "{generatedTimeline.directQuote}"
                </blockquote>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
              <h4 className="font-bold text-amber-800 mb-3 text-lg">📄 Additional Primary Sources</h4>
              <ul className="space-y-2">
                {generatedTimeline.primarySourcesCiting.map((source, i) => (
                  <li key={i} className="text-amber-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h4 className="font-bold text-indigo-800 mb-4 text-lg">⏰ Timeline Events</h4>
              <div className="space-y-4">
                {generatedTimeline.events.map((event, i) => (
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
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Sanitized Version</h4>
                        <p className="text-sm text-red-700 line-clamp-3">{entry.sanitizedMyth}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h4 className="text-xs font-bold text-green-800 uppercase mb-2">Historical Reality</h4>
                        <p className="text-sm text-green-700 line-clamp-3">{entry.historicalReality}</p>
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
                      <span className="text-xs text-indigo-400">{entry.primarySourcesCiting?.length || 0} sources cited</span>
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
