import React, { useState, useEffect } from 'react';
import { ScienceEntry, ScienceExperiment, Club, Opportunity } from '../types';
import { MicroscopeIcon, DividerFlower, BeakerIcon } from './FloralIcons';
import { getSocieties, getOpportunities, generateScienceExperiment } from '../services/geminiService';
import { SocietiesView, BulletinView } from './CommunityFeatures';

interface Props {
  entries: ScienceEntry[];
  onDiscover: (query: string) => void;
  isLoading: boolean;
}

export const ScienceBookView: React.FC<Props> = ({ entries, onDiscover, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'laboratory' | 'societies' | 'bulletin'>('book');
  const [selectedId, setSelectedId] = useState<string | null>(entries.length > 0 ? entries[entries.length - 1].id : null);
  const [query, setQuery] = useState('');

  // Laboratory State
  const [experimentQuery, setExperimentQuery] = useState('');
  const [currentExperiment, setCurrentExperiment] = useState<ScienceExperiment | null>(null);
  const [isVideoSubmitted, setIsVideoSubmitted] = useState(false);

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
      const c = await getSocieties("Science & Natural Philosophy");
      setClubs(c);
      const o = await getOpportunities("STEM & Science");
      setOpportunities(o);
    } catch (e) {
      console.error(e);
    }
  };

  const activeEntry = entries.find(e => e.id === selectedId) || (entries.length > 0 ? entries[entries.length - 1] : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onDiscover(query);
      setQuery('');
    }
  };

  const handleGenerateExperiment = async () => {
    if (!experimentQuery.trim()) return;
    setCurrentExperiment(null);
    setIsVideoSubmitted(false);
    try {
        const result = await generateScienceExperiment(experimentQuery);
        setCurrentExperiment(result);
    } catch (e) {
        console.error(e);
    }
  };

  const handleVideoUpload = () => {
      // Simulate upload
      setTimeout(() => {
          setIsVideoSubmitted(true);
      }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center">
        <div>
           <h2 className="font-display text-3xl text-ink">The Book of Science</h2>
           <p className="text-sm italic text-sage-dark mt-1">A Collaborative Encyclopedia of the Natural World</p>
        </div>
        <div className="flex gap-2">
            <MicroscopeIcon className="w-8 h-8 text-sage opacity-50" />
        </div>
      </div>

       {/* Navigation */}
       <div className="flex border-b border-gold/20 bg-white/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('book')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'book' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            The Encyclopedia
          </button>
          <button 
            onClick={() => setActiveTab('laboratory')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'laboratory' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            The Laboratory
          </button>
          <button 
            onClick={() => setActiveTab('societies')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'societies' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Societies
          </button>
          <button 
            onClick={() => setActiveTab('bulletin')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'bulletin' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Bulletin
          </button>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* --- BOOK TAB --- */}
        {activeTab === 'book' && (
        <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Table of Contents */}
            <div className={`
                w-full md:w-80 bg-[#F3F0EB] border-r border-gold/30 flex flex-col z-20 transition-all absolute md:relative h-full
                ${activeEntry ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 bg-[#EFECE5] border-b border-gold/20">
                    <h3 className="font-display text-lg text-ink/80 text-center uppercase tracking-widest">Index</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {entries.length === 0 ? (
                        <div className="text-center p-8 opacity-50 italic text-sm">
                            No chapters written yet. Start a new discovery.
                        </div>
                    ) : (
                        entries.map((entry, idx) => (
                            <button 
                                key={entry.id}
                                onClick={() => setSelectedId(entry.id)}
                                className={`
                                    w-full text-left p-3 rounded-sm border transition-all duration-300 group
                                    ${selectedId === entry.id 
                                        ? 'bg-white border-sage shadow-sm' 
                                        : 'bg-transparent border-transparent hover:bg-white/50 hover:border-gold/20'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedId === entry.id ? 'text-sage-dark' : 'text-ink/40'}`}>
                                        Chapter {idx + 1}
                                    </span>
                                    <span className="text-[10px] text-ink/30 italic">{entry.category}</span>
                                </div>
                                <div className={`font-display text-lg leading-tight group-hover:text-sage-dark ${selectedId === entry.id ? 'text-ink' : 'text-ink/70'}`}>
                                    {entry.topic}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right: The Page */}
            <div className={`
                flex-1 bg-paper relative overflow-y-auto custom-scrollbar flex flex-col
                ${!activeEntry && 'hidden md:flex'}
            `}>
                {activeEntry ? (
                    <div className="max-w-3xl mx-auto p-6 md:p-12 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Mobile Back Button */}
                        <button 
                            onClick={() => setSelectedId(null)}
                            className="md:hidden mb-4 text-xs uppercase tracking-widest text-sage-dark flex items-center gap-1"
                        >
                            ← Return to Index
                        </button>

                        <div className="border-4 border-double border-gold/20 p-8 md:p-12 bg-white shadow-sm relative">
                            {/* Page Number */}
                            <div className="absolute top-4 right-6 text-ink/20 font-display text-4xl opacity-50">
                                {entries.findIndex(e => e.id === activeEntry.id) + 1}
                            </div>

                            <div className="text-center mb-8">
                                <span className="inline-block border-b border-sage text-sage-dark text-xs font-bold uppercase tracking-widest mb-2 px-2 pb-1">
                                    {activeEntry.category}
                                </span>
                                <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">{activeEntry.topic}</h1>
                                <DividerFlower className="w-32 h-6 text-gold mx-auto" />
                            </div>

                            <div className="grid md:grid-cols-[1fr_200px] gap-8">
                                <div className="space-y-6 text-lg leading-relaxed font-serif text-ink/90">
                                    <section>
                                        <h3 className="font-bold text-sage-dark uppercase text-sm tracking-wide mb-2">I. The Hypothesis</h3>
                                        <p className="italic text-ink/70 border-l-2 border-gold/30 pl-4">{activeEntry.hypothesis}</p>
                                    </section>

                                    <section>
                                        <h3 className="font-bold text-sage-dark uppercase text-sm tracking-wide mb-2">II. Observation & Mechanism</h3>
                                        <p className="text-justify">{activeEntry.observation}</p>
                                    </section>

                                    <section>
                                        <h3 className="font-bold text-sage-dark uppercase text-sm tracking-wide mb-2">III. Conclusion</h3>
                                        <p className="font-bold">{activeEntry.conclusion}</p>
                                    </section>
                                </div>

                                {/* Sidebar / Margin Notes */}
                                <div className="md:border-l border-gold/20 md:pl-6 space-y-6">
                                    <div className="bg-[#FDFBF7] p-4 border border-gold/30 rounded rotate-1 shadow-sm">
                                        <h4 className="font-display text-lg text-ink mb-2">Field Notes</h4>
                                        <p className="text-sm italic text-ink/70 leading-relaxed">
                                            {activeEntry.funFact}
                                        </p>
                                    </div>
                                    <div className="flex justify-center opacity-20">
                                        <MicroscopeIcon className="w-16 h-16 text-sage" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Source Citations */}
                            {activeEntry.sources && activeEntry.sources.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gold/20">
                                    <h4 className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-2">References & Citations</h4>
                                    <ul className="space-y-1">
                                        {activeEntry.sources.map((source, i) => (
                                            <li key={i} className="text-xs truncate">
                                                <a 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="text-sage hover:text-sage-dark hover:underline flex items-center gap-1"
                                                >
                                                    <span className="opacity-50">SC-{i+1}:</span> {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <MicroscopeIcon className="w-24 h-24 text-gold mb-6" />
                        <h3 className="font-display text-2xl text-ink">Ready to Discover?</h3>
                        <p className="max-w-md mt-2 italic text-ink/70">
                            "The important thing is not to stop questioning. Curiosity has its own reason for existing."
                        </p>
                    </div>
                )}
            </div>
            
             {/* Discovery Input */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-paper border-t border-gold/30 z-30">
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
                    <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What scientific phenomenon shall we investigate?"
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
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
        )}

        {/* --- LABORATORY TAB --- */}
        {activeTab === 'laboratory' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                
                {/* 1. Request Experiment */}
                {!currentExperiment ? (
                    <div className="max-w-2xl mx-auto text-center py-12">
                        <BeakerIcon className="w-20 h-20 text-gold mx-auto mb-6" />
                        <h3 className="font-display text-3xl text-ink mb-3">The Laboratory</h3>
                        <p className="text-ink/60 italic mb-8 max-w-lg mx-auto">
                            "Experiments are the questions we ask of nature." <br/>
                            Request an epic experiment below. Think explosions, slime, or magnetic magic.
                        </p>
                        
                        <div className="relative max-w-lg mx-auto mb-16">
                            <input 
                                type="text"
                                value={experimentQuery}
                                onChange={(e) => setExperimentQuery(e.target.value)}
                                placeholder="E.g. Elephant Toothpaste, Volcano, Rockets..."
                                className="w-full p-4 pr-32 bg-white border-2 border-gold/30 focus:border-sage outline-none rounded-sm font-serif shadow-inner text-lg"
                            />
                            <button 
                                onClick={handleGenerateExperiment}
                                disabled={!experimentQuery.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-sage text-white px-4 py-2 text-xs uppercase font-bold tracking-widest rounded-sm hover:bg-sage-dark transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Experiment Card */}
                        <div className="bg-white border-2 border-double border-gold/40 p-6 md:p-10 shadow-lg relative mb-12">
                             <button 
                                onClick={() => setCurrentExperiment(null)}
                                className="absolute top-4 right-4 text-xs uppercase text-ink/40 hover:text-ink"
                              >
                                Close Lab
                              </button>

                             <div className="text-center mb-8">
                                <div className="flex justify-center gap-2 mb-2">
                                    <span className="bg-sepia text-sage-dark px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">{currentExperiment.difficulty}</span>
                                    <span className="border border-gold/30 text-ink/50 px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">{currentExperiment.duration}</span>
                                </div>
                                <h2 className="font-display text-4xl text-ink mb-2">{currentExperiment.title}</h2>
                                <p className="italic text-ink/70 max-w-2xl mx-auto">"{currentExperiment.funFactor}"</p>
                             </div>

                             <div className="grid md:grid-cols-2 gap-8 mb-8">
                                 <div>
                                     <h4 className="font-bold text-xs uppercase tracking-widest text-sage-dark mb-3 border-b border-gold/20 pb-1">Equipment</h4>
                                     <ul className="text-sm space-y-1">
                                         {currentExperiment.materials.map((m, i) => (
                                             <li key={i} className="flex items-center gap-2">
                                                 <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                                                 {m}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                                 <div className="bg-red-50 border border-red-100 p-4 rounded">
                                     <h4 className="font-bold text-xs uppercase tracking-widest text-red-800 mb-2 flex items-center gap-2">
                                         <span>⚠️</span> Safety First
                                     </h4>
                                     <ul className="text-xs text-red-800/80 space-y-1 list-disc pl-4">
                                         {currentExperiment.safety.map((s, i) => <li key={i}>{s}</li>)}
                                     </ul>
                                 </div>
                             </div>

                             <div className="mb-8">
                                 <h4 className="font-bold text-xs uppercase tracking-widest text-sage-dark mb-4 border-b border-gold/20 pb-1">Procedure</h4>
                                 <div className="space-y-4">
                                     {currentExperiment.steps.map((step, i) => (
                                         <div key={i} className="flex gap-4">
                                             <span className="font-display text-2xl text-gold/50 font-bold">{i + 1}</span>
                                             <p className="text-ink/90 leading-relaxed mt-1">{step}</p>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div className="bg-[#F3F0EB] p-6 border-l-4 border-sage">
                                 <h4 className="font-bold text-xs uppercase tracking-widest text-sage-dark mb-2">The Science Behind It</h4>
                                 <p className="text-sm text-ink/80 leading-relaxed">{currentExperiment.science}</p>
                             </div>

                             {/* Sources for Safety */}
                             {currentExperiment.sources && currentExperiment.sources.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gold/20 text-center">
                                    <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold block mb-2">Safety Verified Via</span>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {currentExperiment.sources.map((source, i) => (
                                            <a 
                                                key={i} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-xs text-sage hover:text-sage-dark hover:underline bg-white border border-gold/30 px-2 py-1 rounded"
                                            >
                                                {source.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* Submission Section */}
                             <div className="mt-12 pt-8 border-t border-dashed border-gold/40 text-center">
                                 {!isVideoSubmitted ? (
                                    <>
                                        <h3 className="font-display text-xl text-ink mb-2">Capture the Magic</h3>
                                        <p className="text-sm text-ink/60 mb-6">Did you perform this experiment? Upload your video to be featured on our community broadcast.</p>
                                        <button 
                                            onClick={handleVideoUpload}
                                            className="bg-ink text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-sage-dark transition-colors shadow-lg"
                                        >
                                            📹 Upload Video Evidence
                                        </button>
                                    </>
                                 ) : (
                                     <div className="bg-green-50 p-6 border border-green-100 animate-in zoom-in">
                                         <h3 className="text-green-800 font-bold text-lg mb-1">Submission Received!</h3>
                                         <p className="text-green-700 text-sm">Your experiment is being reviewed by the Adeline Science Committee for feature.</p>
                                     </div>
                                 )}
                             </div>
                        </div>
                    </div>
                )}

                {/* Community Feed / Mock Social Media */}
                <div className="max-w-6xl mx-auto border-t border-gold/20 pt-12">
                    <h3 className="font-display text-2xl text-center text-ink mb-8">Featured Student Discoveries</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { user: "Timmy B.", title: "Mega Volcano", color: "bg-red-100" },
                            { user: "Sarah J.", title: "Glow Slime", color: "bg-green-100" },
                            { user: "Alex R.", title: "Bottle Rocket", color: "bg-blue-100" },
                            { user: "Priya M.", title: "Crystal Garden", color: "bg-purple-100" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-3 border border-gold/20 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                                <div className={`h-40 w-full mb-3 ${item.color} flex items-center justify-center relative overflow-hidden`}>
                                    <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                                <h4 className="font-bold text-sm text-ink leading-tight">{item.title}</h4>
                                <p className="text-xs text-ink/50 mt-1">by {item.user}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        )}

        {/* --- SHARED TABS --- */}
        {activeTab === 'societies' && (
             <div className="overflow-y-auto h-full">
                <SocietiesView 
                    clubs={clubs} 
                    onJoinToggle={(id) => setJoinedClubs(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
                    joinedIds={joinedClubs} 
                    isLoading={isLoading && clubs.length === 0} 
                />
            </div>
        )}
        
        {activeTab === 'bulletin' && (
             <div className="overflow-y-auto h-full">
                <BulletinView 
                    opportunities={opportunities} 
                    isLoading={isLoading && opportunities.length === 0}
                    domain="STEM & Science"
                />
            </div>
        )}

      </div>
    </div>
  );
};