import React, { useState, useEffect } from 'react';
import { HomeEcEntry, Club, Opportunity } from '../types';
import { WhiskIcon, NeedleIcon, RoseMinimal, DividerFlower } from './FloralIcons';
import { generateHomeEcEntry, getSocieties, getOpportunities } from '../services/geminiService';
import { SocietiesView, BulletinView } from './CommunityFeatures';

interface Props {
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const HomeEcView: React.FC<Props> = ({ isLoading, setGlobalLoading }) => {
  const [activeTab, setActiveTab] = useState<'kitchen' | 'sewing' | 'journal' | 'societies' | 'bulletin'>('kitchen');
  const [request, setRequest] = useState('');
  const [entries, setEntries] = useState<HomeEcEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<HomeEcEntry | null>(null);

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
      const c = await getSocieties("Domestic Arts (Cooking, Sewing, Gardening)");
      setClubs(c);
      const o = await getOpportunities("Culinary Arts & Textile Crafts");
      setOpportunities(o);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!request.trim()) return;
    setGlobalLoading(true);
    try {
      const domain = activeTab === 'kitchen' ? 'Baking' : 'Sewing';
      const result = await generateHomeEcEntry(request, domain);
      setCurrentEntry(result);
      setRequest('');
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalLoading(false);
    }
  };

  const saveToJournal = () => {
    if (currentEntry) {
      setEntries(prev => [currentEntry, ...prev]);
      setCurrentEntry(null);
      setActiveTab('journal');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center relative">
        <div>
           <h2 className="font-display text-3xl text-ink">Domestic Arts & Sciences</h2>
           <p className="text-sm italic text-sage-dark mt-1">"The creation of something new is not accomplished by the intellect but by the play instinct."</p>
        </div>
        <div className="flex gap-2 text-sage opacity-50">
            <WhiskIcon className="w-6 h-6" />
            <NeedleIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gold/20 bg-white/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('kitchen')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'kitchen' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            <WhiskIcon className="w-4 h-4" /> The Kitchen
          </button>
          <button 
            onClick={() => setActiveTab('sewing')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'sewing' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            <NeedleIcon className="w-4 h-4" /> The Sewing Room
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'journal' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Journal
          </button>
          <button 
            onClick={() => setActiveTab('societies')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'societies' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Societies
          </button>
          <button 
            onClick={() => setActiveTab('bulletin')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'bulletin' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Bulletin
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          
          {/* --- GENERATION VIEW (Kitchen & Sewing) --- */}
          {(activeTab === 'kitchen' || activeTab === 'sewing') && (
              <div className="max-w-2xl mx-auto p-4 md:p-8">
                  
                  {/* Current Generated Card */}
                  {currentEntry ? (
                      <div className="bg-white border-2 border-double border-gold/40 p-8 shadow-sm relative animate-in zoom-in-95 duration-500">
                          <button 
                            onClick={() => setCurrentEntry(null)}
                            className="absolute top-4 right-4 text-xs uppercase text-ink/40 hover:text-ink"
                          >
                            Close
                          </button>

                          <div className="text-center mb-6">
                              <span className="text-[10px] uppercase tracking-widest bg-sepia px-2 py-1 rounded text-sage-dark font-bold">
                                  {currentEntry.type}
                              </span>
                              <h3 className="font-display text-3xl text-ink mt-2">{currentEntry.title}</h3>
                              <DividerFlower className="w-24 h-4 text-gold mx-auto mt-2" />
                          </div>

                          <div className="grid md:grid-cols-2 gap-8 mb-6">
                              <div>
                                  <h4 className="font-bold text-xs uppercase tracking-widest text-sage-dark mb-2 border-b border-gold/20 pb-1">
                                      {currentEntry.type === 'recipe' ? 'Ingredients' : 'Materials'}
                                  </h4>
                                  <ul className="text-sm text-ink/80 space-y-1 list-disc pl-4 marker:text-gold">
                                      {currentEntry.materials.map((m, i) => <li key={i}>{m}</li>)}
                                  </ul>
                              </div>
                              <div className="bg-[#FAF8F2] p-4 border border-gold/20 rounded rotate-1">
                                  <h4 className="font-bold text-xs uppercase tracking-widest text-sage-dark mb-1">Adeline's Tip</h4>
                                  <p className="text-sm italic text-ink/70 leading-relaxed">"{currentEntry.tip}"</p>
                              </div>
                          </div>

                          <div className="mb-8">
                              <h4 className="font-bold text-xs uppercase tracking-widest text-sage-dark mb-2 border-b border-gold/20 pb-1">Instructions</h4>
                              <ol className="text-sm text-ink/80 space-y-3 list-decimal pl-4 marker:text-sage font-serif leading-relaxed">
                                  {currentEntry.instructions.map((step, i) => <li key={i}>{step}</li>)}
                              </ol>
                          </div>
                          
                          {/* Sources */}
                          {currentEntry.sources && currentEntry.sources.length > 0 && (
                             <div className="mb-8 pt-4 border-t border-gold/20">
                                <h4 className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-2">Sources</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentEntry.sources.map((source, i) => (
                                        <a 
                                            key={i} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-xs text-sage hover:text-sage-dark hover:underline flex items-center gap-1"
                                        >
                                            {source.title}
                                        </a>
                                    ))}
                                </div>
                             </div>
                          )}

                          <div className="flex justify-center">
                              <button 
                                onClick={saveToJournal}
                                className="bg-sage text-white px-6 py-2 rounded-sm uppercase tracking-widest text-xs font-bold hover:bg-sage-dark transition-colors shadow-sm"
                              >
                                Save to Journal
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-12">
                          {activeTab === 'kitchen' ? <WhiskIcon className="w-16 h-16 mx-auto text-gold mb-4" /> : <NeedleIcon className="w-16 h-16 mx-auto text-gold mb-4" />}
                          <h3 className="font-display text-2xl text-ink mb-2">
                              {activeTab === 'kitchen' ? 'What shall we bake today?' : 'What shall we create today?'}
                          </h3>
                          <p className="text-ink/60 italic mb-8 max-w-md mx-auto">
                              Ask Adeline for a {activeTab === 'kitchen' ? 'recipe (e.g., "Lavender Scones")' : 'pattern (e.g., "A Simple Tote Bag")'}.
                          </p>
                          
                          <div className="relative max-w-md mx-auto">
                             <input
                               type="text"
                               value={request}
                               onChange={(e) => setRequest(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                               placeholder={activeTab === 'kitchen' ? "E.g. Apple Pie, Sourdough..." : "E.g. Apron, Embroidery..."}
                               className="w-full p-4 pr-12 bg-white border-2 border-gold/30 focus:border-sage outline-none rounded-sm font-serif shadow-inner text-lg"
                               disabled={isLoading}
                             />
                             <button 
                               onClick={handleGenerate}
                               disabled={isLoading || !request.trim()}
                               className="absolute right-2 top-1/2 -translate-y-1/2 text-sage-dark hover:text-ink disabled:opacity-30"
                             >
                                {isLoading ? (
                                    <span className="w-5 h-5 block border-2 border-sage border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <span className="text-2xl">➝</span>
                                )}
                             </button>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* --- JOURNAL MODE --- */}
          {activeTab === 'journal' && (
              <div className="max-w-4xl mx-auto p-4 md:p-8">
                  <div className="text-center mb-10">
                      <h3 className="font-display text-4xl text-ink mb-2">My Domestic Journal</h3>
                      <p className="italic text-ink/50 text-sm">A collection of recipes, patterns, and memories.</p>
                      <button className="mt-4 text-xs uppercase tracking-widest border border-gold/40 px-3 py-1 rounded hover:bg-white hover:border-sage transition-colors text-sage-dark">
                          🖨️ Print Book
                      </button>
                  </div>

                  {entries.length === 0 ? (
                      <div className="text-center py-12 opacity-40 border-2 border-dashed border-gold/30 rounded">
                          <p className="italic">Your journal is waiting for its first entry.</p>
                      </div>
                  ) : (
                      <div className="grid md:grid-cols-2 gap-8">
                          {entries.map(entry => (
                              <div key={entry.id} className="bg-white p-6 shadow-sm border border-gold/20 relative group hover:shadow-md transition-shadow">
                                  {/* "Photo" Placeholder */}
                                  <div className="h-40 bg-[#f4f4f4] mb-4 flex items-center justify-center border-b border-gold/10 overflow-hidden relative">
                                      <div className="absolute inset-0 bg-sage opacity-5 pattern-dots"></div>
                                      <span className="text-xs uppercase tracking-widest text-ink/30 font-bold">
                                          {entry.type === 'recipe' ? 'Photo of Dish' : 'Photo of Project'}
                                      </span>
                                      {/* Simulate User Upload Button */}
                                      <button className="absolute bottom-2 right-2 bg-white/80 p-1 text-[10px] uppercase rounded hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                          + Add Photo
                                      </button>
                                  </div>

                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-display text-xl text-ink leading-tight">{entry.title}</h4>
                                      <span className="text-[10px] text-sage-dark uppercase tracking-widest border border-sage/20 px-1">{entry.type}</span>
                                  </div>
                                  
                                  <p className="text-xs text-ink/40 italic mb-4">{entry.date.toLocaleDateString()}</p>
                                  
                                  <div className="text-sm text-ink/80 font-serif leading-relaxed line-clamp-3 mb-4">
                                      {entry.notes}
                                  </div>

                                  <div className="border-t border-gold/10 pt-3 flex justify-between items-center">
                                      <span className="text-[10px] text-ink/50 uppercase tracking-widest">Adeline's Pattern</span>
                                      <button className="text-xs font-bold text-sage hover:text-sage-dark">Read Full Entry →</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
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
                domain="Home Economics"
              />
          )}

      </div>
    </div>
  );
};