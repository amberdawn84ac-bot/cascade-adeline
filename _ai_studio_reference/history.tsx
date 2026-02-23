import React, { useState, useEffect } from 'react';
import { TimelineEvent, Club, Opportunity } from '../types';
import { RoseMinimal, CornerVine } from './FloralIcons';
import { getSocieties, getOpportunities } from '../services/geminiService';
import { SocietiesView, BulletinView } from './CommunityFeatures';
import { SketchVerticalLine } from './Freehand';

interface Props {
  events: TimelineEvent[];
  onInvestigate: (query: string) => void;
  isLoading: boolean;
}

export const HistoryTimelineView: React.FC<Props> = ({ events, onInvestigate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'societies' | 'bulletin'>('timeline');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  // Community State
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    if (activeTab === 'societies' && clubs.length === 0) {
      loadCommunityData();
    }
  }, [activeTab]);

  const loadCommunityData = async () => {
    try {
      const c = await getSocieties("History & Archaeology");
      setClubs(c);
      const o = await getOpportunities("History & Social Studies");
      setOpportunities(o);
    } catch (e) {
      console.error(e);
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onInvestigate(query);
      setQuery('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center">
        <div>
           <h2 className="font-display text-3xl text-ink">The True History</h2>
           <p className="text-sm italic text-sage-dark mt-1">"History is a set of lies agreed upon." — Napoleon</p>
        </div>
        <RoseMinimal className="w-10 h-10 text-sage opacity-50" />
      </div>

       {/* Navigation */}
      <div className="flex border-b border-gold/20 bg-white/50">
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'timeline' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Timeline & Investigation
          </button>
          <button 
            onClick={() => setActiveTab('societies')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'societies' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Societies
          </button>
          <button 
            onClick={() => setActiveTab('bulletin')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'bulletin' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Bulletin
          </button>
      </div>

      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
      
      {/* --- TIMELINE TAB --- */}
      {activeTab === 'timeline' && (
      <>
        <div className="p-4 md:p-8 min-h-0 flex-1">
            {sortedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <CornerVine className="w-24 h-24 text-gold mb-4" />
                <p className="font-display text-xl text-ink">The timeline is empty.</p>
                <p className="italic text-sm text-ink/70 max-w-md mt-2">
                Start an investigation to uncover the hidden realities of our past. 
                Try topics like "The First Thanksgiving" or "The Invention of the Lightbulb".
                </p>
            </div>
            ) : (
            <div className="max-w-3xl mx-auto relative pl-8 md:pl-0">
                {/* Center Line using Perfect Freehand */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-0 md:-ml-[5px] w-[10px] pointer-events-none opacity-40">
                    <SketchVerticalLine color="#D4C5A9" />
                </div>

                {sortedEvents.map((event, idx) => {
                const isEven = idx % 2 === 0;
                const isExpanded = expandedId === event.id;

                return (
                    <div key={event.id} className={`relative mb-12 md:flex ${isEven ? 'md:flex-row-reverse' : ''} items-center group`}>
                    
                    <div className="absolute left-[-36px] md:left-1/2 md:-translate-x-1/2 w-16 text-center">
                        <div className="w-4 h-4 rounded-full bg-paper border-2 border-sage group-hover:bg-sage transition-colors mx-auto relative z-10"></div>
                        <span className="font-display text-sm font-bold text-sage-dark bg-paper px-1 mt-1 block">{event.displayDate}</span>
                    </div>

                    <div className="hidden md:block md:w-1/2"></div>

                    <div className={`md:w-1/2 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                        <div 
                            className={`
                            bg-white border border-gold/30 p-5 rounded-sm shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden
                            ${isExpanded ? 'ring-1 ring-sage' : ''}
                            `}
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                        >
                            <div className="absolute top-2 right-2 opacity-10 rotate-12 pointer-events-none">
                                <div className="border-2 border-sage-dark p-1 text-[8px] font-bold uppercase tracking-widest text-sage-dark rounded">Confidential</div>
                            </div>

                            <h3 className="font-display text-xl text-ink mb-2 pr-8">{event.title}</h3>
                            
                            <div className="mb-3">
                                <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Standard Narrative</span>
                                <p className="text-ink/80 text-sm leading-relaxed font-serif bg-gray-50 p-2 rounded border border-gray-100 italic">
                                "{event.myth}"
                                </p>
                            </div>

                            <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                <div className="relative">
                                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-sage"></div>
                                    <span className="text-[10px] uppercase tracking-widest text-sage-dark font-bold">Historical Reality</span>
                                    <p className="text-ink text-sm leading-relaxed mt-1 font-medium">
                                        {event.reality}
                                    </p>
                                    
                                    <div className="mt-3 pt-3 border-t border-dashed border-gold/40">
                                        <span className="text-[10px] uppercase tracking-widest text-gold font-bold flex items-center gap-1">
                                            <span className="text-lg">⚖️</span> Exhibit A: Evidence
                                        </span>
                                        <p className="text-xs text-ink/60 italic mt-1 font-mono bg-[#FDFBF7] p-2 border border-gold/20">
                                            {event.evidence}
                                        </p>
                                    </div>

                                    {/* Grounding Sources (MCP-like real data) */}
                                    {event.sources && event.sources.length > 0 && (
                                      <div className="mt-4 pt-2 border-t border-gold/10">
                                          <span className="text-[9px] uppercase tracking-widest text-sage font-bold block mb-1">Primary Sources Found:</span>
                                          <ul className="space-y-1">
                                            {event.sources.map((source, i) => (
                                              <li key={i} className="text-[10px] truncate">
                                                <a 
                                                  href={source.uri} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className="text-ink/50 hover:text-sage-dark hover:underline flex items-center gap-1"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <span>🔗</span> {source.title}
                                                </a>
                                              </li>
                                            ))}
                                          </ul>
                                      </div>
                                    )}
                                </div>
                            </div>

                            {!isExpanded && (
                                <div className="mt-2 text-center text-xs text-sage hover:text-sage-dark font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                    <span>Click to uncover truth</span>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>
        
        {/* Investigation Input - Sticky Bottom */}
        <div className="p-4 md:p-6 bg-paper border-t border-gold/30 z-20 sticky bottom-0">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Investigate a topic, event, or person..."
                disabled={isLoading}
                className="w-full bg-white border-2 border-gold/30 p-4 pr-12 rounded-sm focus:border-sage outline-none font-serif placeholder:italic text-lg shadow-inner"
                />
                <button 
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-sage-dark hover:text-ink disabled:opacity-30"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 block border-2 border-sage border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    )}
                </button>
            </form>
            <p className="text-center text-xs text-ink/40 mt-2 uppercase tracking-widest">Collaborative Investigation Mode</p>
        </div>
      </>
      )}

      {/* --- SHARED TABS --- */}
      {activeTab === 'societies' && (
        <SocietiesView 
            clubs={clubs} 
            onJoinToggle={(id) => setJoinedClubs(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
            joinedIds={joinedClubs} 
            isLoading={isLoading && clubs.length === 0} 
        />
      )}
      
      {activeTab === 'bulletin' && (
        <BulletinView 
            opportunities={opportunities} 
            isLoading={isLoading && opportunities.length === 0}
            domain="History & Social Studies"
        />
      )}

      </div>
    </div>
  );
};
