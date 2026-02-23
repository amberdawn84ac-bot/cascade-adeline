import React, { useState, useEffect } from 'react';
import { ExpeditionReport, Club, Opportunity } from '../types';
import { CompassIcon, PickaxeIcon, MapIcon, RoseMinimal, DividerFlower } from './FloralIcons';
import { generateExpeditionReport, getSocieties, getOpportunities } from '../services/geminiService';
import { SocietiesView, BulletinView } from './CommunityFeatures';

interface Props {
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const ExpeditionView: React.FC<Props> = ({ isLoading, setGlobalLoading }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'societies' | 'bulletin'>('map');
  const [locationInput, setLocationInput] = useState('');
  const [report, setReport] = useState<ExpeditionReport | null>(null);

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
      const c = await getSocieties("Geology, Geography, & Archaeology");
      setClubs(c);
      const o = await getOpportunities("Expeditions & Field Research");
      setOpportunities(o);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSurvey = async () => {
    if (!locationInput.trim()) return;
    setGlobalLoading(true);
    setReport(null);
    try {
      const result = await generateExpeditionReport(locationInput);
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/vintage-speckles.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center relative">
        <div>
           <h2 className="font-display text-3xl text-ink">The Expedition Hall</h2>
           <p className="text-sm italic text-sage-dark mt-1">"The land itself is a manuscript, writing the history of its people."</p>
        </div>
        <div className="flex gap-2 text-sage opacity-50">
            <CompassIcon className="w-6 h-6" />
            <PickaxeIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gold/20 bg-white/50">
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'map' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Field Map & Survey
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">

          {/* --- MAP TAB --- */}
          {activeTab === 'map' && (
              <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col items-center">
                  
                  {/* Location Input */}
                  <div className="w-full max-w-xl mx-auto mb-10 relative z-10 text-center">
                      <div className="flex flex-col items-center mb-6">
                        <MapIcon className="w-16 h-16 text-gold mb-2 opacity-60" />
                        <h3 className="font-display text-xl text-ink">Where shall we organize an expedition?</h3>
                        <p className="text-sm italic text-ink/50">Adeline will survey the geology, archaeology, and human culture.</p>
                      </div>

                      <div className="relative">
                          <input 
                            type="text"
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSurvey()}
                            placeholder="E.g. The Grand Canyon, Pompeii, The Nile Delta..."
                            className="w-full p-4 pr-12 bg-white border-2 border-gold/30 focus:border-sage outline-none rounded-sm font-serif shadow-inner text-lg text-center"
                            disabled={isLoading}
                          />
                          <button 
                            onClick={handleSurvey}
                            disabled={isLoading || !locationInput.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sage-dark hover:text-ink disabled:opacity-30 p-2"
                          >
                            {isLoading ? '...' : 'Survey'}
                          </button>
                      </div>
                  </div>

                  {/* Generated Report */}
                  {report && (
                      <div className="w-full bg-[#FDFBF7] border border-gold/40 shadow-lg relative animate-in zoom-in-95 duration-700 p-8 md:p-12 mb-12 transform rotate-1">
                           {/* Decorative Stamp */}
                           <div className="absolute top-6 right-8 border-2 border-sage-dark text-sage-dark opacity-40 px-2 py-1 transform -rotate-12">
                               <span className="text-xs font-bold uppercase tracking-widest block text-center">Surveyed</span>
                               <span className="text-[10px] block text-center">{new Date().toLocaleDateString()}</span>
                           </div>

                           <div className="text-center mb-12">
                               <span className="text-xs uppercase tracking-widest text-ink/40 block mb-2">{report.coordinates}</span>
                               <h2 className="font-display text-4xl md:text-5xl text-ink border-b-2 border-double border-gold/30 pb-4 inline-block px-12">
                                   {report.location}
                               </h2>
                           </div>

                           <div className="grid md:grid-cols-3 gap-8 relative">
                               {/* 1. Geology */}
                               <div className="relative group">
                                   <div className="flex items-center gap-2 mb-4">
                                       <PickaxeIcon className="w-5 h-5 text-sage" />
                                       <h3 className="font-bold text-sm uppercase tracking-widest text-sage-dark">I. Geology</h3>
                                   </div>
                                   <div className="bg-white p-5 border-l-2 border-gold/30 h-full shadow-sm group-hover:border-sage transition-colors">
                                       <p className="text-ink/80 text-sm leading-relaxed mb-4">{report.geology.formation}</p>
                                       <div className="border-t border-gold/10 pt-3">
                                           <span className="text-[10px] uppercase text-ink/40 font-bold block mb-1">Strata Samples:</span>
                                           <div className="flex flex-wrap gap-1">
                                                {report.geology.rocks.map(r => (
                                                    <span key={r} className="bg-stone-100 text-stone-600 px-2 py-0.5 text-[10px] uppercase font-bold rounded-sm border border-stone-200">{r}</span>
                                                ))}
                                           </div>
                                       </div>
                                   </div>
                               </div>

                               {/* 2. Archaeology */}
                               <div className="relative group">
                                   <div className="flex items-center gap-2 mb-4">
                                       <div className="w-5 h-5 flex items-center justify-center text-sage text-lg font-serif">⏳</div>
                                       <h3 className="font-bold text-sm uppercase tracking-widest text-sage-dark">II. Archaeology</h3>
                                   </div>
                                   <div className="bg-white p-5 border-l-2 border-gold/30 h-full shadow-sm group-hover:border-sage transition-colors">
                                       <span className="block text-xs font-bold text-gold uppercase tracking-wider mb-2">{report.archaeology.era}</span>
                                       <p className="text-ink/80 text-sm leading-relaxed italic">"{report.archaeology.remnants}"</p>
                                   </div>
                               </div>

                               {/* 3. Sociology (The Connection) */}
                               <div className="relative group md:col-span-1">
                                   <div className="flex items-center gap-2 mb-4">
                                       <CompassIcon className="w-5 h-5 text-sage" />
                                       <h3 className="font-bold text-sm uppercase tracking-widest text-sage-dark">III. Human Geography</h3>
                                   </div>
                                   <div className="bg-sage/5 p-5 border-l-2 border-sage h-full shadow-sm">
                                       <p className="text-ink/90 font-serif leading-relaxed mb-4">{report.sociology.culture}</p>
                                       <div className="bg-white p-3 border border-sage/20 rounded-sm">
                                           <span className="block text-[9px] uppercase font-bold text-sage-dark mb-1">The Land's Influence</span>
                                           <p className="text-xs text-ink/70 italic">{report.sociology.connection}</p>
                                       </div>
                                   </div>
                               </div>
                           </div>

                           <div className="mt-12 text-center">
                               <DividerFlower className="w-32 h-6 text-gold mx-auto opacity-50" />
                           </div>
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
                domain="Expeditions"
              />
          )}

      </div>
    </div>
  );
};