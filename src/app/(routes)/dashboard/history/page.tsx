'use client';

import { useState } from 'react';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Clock, Users, BookOpen, Search, ScrollText, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Timeline } from '@/components/gen-ui/Timeline';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimelineEntry {
  topic: string;
  sanitizedMyth: string;
  historicalReality: string;
  primarySourcesCiting: string[];
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
      if (res.ok) setSaveSuccess(true);
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

            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
              <h4 className="font-bold text-amber-800 mb-3 text-lg">📄 Primary Sources Citing</h4>
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

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/library" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
            <div className="mb-4 p-3 bg-amber-100 rounded-xl w-fit text-amber-700">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Primary Sources</h3>
            <p className="text-slate-600 text-sm">
              Read actual documents, letters, and records from historical events instead of textbook summaries.
            </p>
            <div className="mt-4 text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
              Explore Library →
            </div>
          </div>
        </Link>

        <Link href="/dashboard/history/analysis" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
            <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
              <Eye size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Critical Analysis</h3>
            <p className="text-slate-600 text-sm">
              Compare what you're taught with what primary sources actually reveal about historical events.
            </p>
            <div className="mt-4 text-purple-600 font-semibold text-sm group-hover:text-purple-700">
              Start Analysis →
            </div>
          </div>
        </Link>

        <Link href="/dashboard/history/investigation" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
            <div className="mb-4 p-3 bg-red-100 rounded-xl w-fit text-red-700">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Follow the Money</h3>
            <p className="text-slate-600 text-sm">
              Understand who profits from how history is presented and why certain narratives are promoted.
            </p>
            <div className="mt-4 text-red-600 font-semibold text-sm group-hover:text-red-700">
              Start Investigation →
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
