"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, X, Upload, Play, Users, Calendar, Award, AlertTriangle } from 'lucide-react';
import { Telescope, MasonJar, VineDivider, MagnifyingGlass, LeafBranch, Wildflower } from '@/components/illustrations';

// Types from our central types file
interface ScienceEntry {
  id: string;
  title?: string;
  topic?: string;
  category?: string;
  hypothesis: string;
  observation: string;
  conclusion: string;
  funFact?: string;
  fieldNotes?: string[];
  references?: string[];
  sources?: { title: string; uri: string }[];
}

interface ScienceExperiment {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeRequired: string;
  safetyWarnings: string[];
  materials: string[];
  procedures: string[];
  theScience: string;
}

interface Club {
  id: string;
  name: string;
  focus: string;
  description: string;
  currentChallenge: string;
  members: number;
}

interface Opportunity {
  id: string;
  title: string;
  type: 'Competition' | 'Exhibition' | 'Workshop' | 'Grant' | 'Fair' | 'Hackathon';
  description: string;
  deadline?: string;
  organization: string;
}

export default function SciencePage() {
  const [activeTab, setActiveTab] = useState<'book' | 'laboratory' | 'societies' | 'bulletin'>('book');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Encyclopedia State
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [generatedEntry, setGeneratedEntry] = useState<ScienceEntry | null>(null);
  const [isGeneratingEntry, setIsGeneratingEntry] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [saveEntrySuccess, setSaveEntrySuccess] = useState(false);

  // Laboratory State
  const [experimentQuery, setExperimentQuery] = useState('');
  const [currentExperiment, setCurrentExperiment] = useState<ScienceExperiment | null>(null);
  const [isVideoSubmitted, setIsVideoSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Community State
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [entries, setEntries] = useState<ScienceEntry[]>([]);

  // Mock data for UI testing
  useEffect(() => {
    // Mock science entries
    setEntries([
      {
        id: '1',
        topic: 'Photosynthesis',
        category: 'Biology',
        hypothesis: 'Plants convert sunlight into chemical energy through a complex process',
        observation: 'Chlorophyll in leaves captures sunlight energy, which converts water and carbon dioxide into glucose and oxygen. This process occurs in chloroplasts and is essential for most life on Earth.',
        conclusion: 'Photosynthesis is the foundation of most ecosystems, producing the oxygen we breathe and the energy that fuels food chains.',
        funFact: 'A single large tree can produce enough oxygen for two people per year!',
        sources: [
          { title: 'NASA Earth Observatory', uri: 'https://earthobservatory.nasa.gov/features/photosynthesis' },
          { title: 'Khan Academy Biology', uri: 'https://www.khanacademy.org/science/biology/photosynthesis' }
        ]
      },
      {
        id: '2',
        topic: 'Gravity and Orbits',
        category: 'Physics',
        hypothesis: 'Gravity is a fundamental force that governs the motion of celestial bodies',
        observation: 'Every object with mass attracts every other object with a force proportional to their masses and inversely proportional to the square of the distance between them. This force keeps planets in orbit around stars and moons around planets.',
        conclusion: 'Gravity is the universal architect of cosmic structure, from falling apples to galaxy clusters.',
        funFact: 'If you could fold a piece of paper in half 42 times, it would reach the moon - demonstrating exponential growth that also applies to gravitational forces!',
        sources: [
          { title: 'Physics Classroom', uri: 'https://www.physicsclassroom.com/Class/circles/u6l3a.cfm' },
          { title: 'NOVA Physics', uri: 'https://www.pbs.org/wgbh/nova/physics/' }
        ]
      }
    ]);

    // Load community data when societies tab is selected
    if (activeTab === 'societies' && clubs.length === 0) {
      loadCommunityData();
    }
  }, [activeTab, clubs.length]);

  const loadCommunityData = async () => {
    try {
      // Mock API calls - will be implemented later
      const clubsResponse = await fetch('/api/science/societies');
      const opportunitiesResponse = await fetch('/api/science/opportunities');
      
      // For now, use mock data
      setClubs([
        {
          id: '1',
          name: 'Young Naturalists Society',
          focus: 'Field Biology & Ecology',
          description: 'Explore local ecosystems, document wildlife, and contribute to citizen science projects.',
          currentChallenge: 'Winter Bird Migration Tracking',
          members: 47
        },
        {
          id: '2',
          name: 'Chemistry Innovators Club',
          focus: 'Experimental Chemistry',
          description: 'Safe, hands-on chemistry experiments and demonstrations.',
          currentChallenge: 'Crystal Growing Competition',
          members: 32
        },
        {
          id: '3',
          name: 'Astronomy Observers',
          focus: 'Stargazing & Space Science',
          description: 'Night sky observation, telescope building, and space exploration.',
          currentChallenge: 'Meteor Shower Photography',
          members: 28
        }
      ]);

      setOpportunities([
        {
          id: '1',
          title: 'Regional Science Fair',
          type: 'Fair',
          description: 'Showcase your experiments and compete for scholarships.',
          deadline: '2024-03-15',
          organization: 'State Science Education Association'
        },
        {
          id: '2',
          title: 'NASA Space Camp Scholarship',
          type: 'Workshop',
          description: 'All-expenses paid week at NASA Space Camp.',
          deadline: '2024-02-28',
          organization: 'NASA Education'
        },
        {
          id: '3',
          title: 'Young Inventors Challenge',
          type: 'Competition',
          description: 'Design and build an invention that solves a real-world problem.',
          deadline: '2024-04-01',
          organization: 'National Inventors Hall of Fame'
        }
      ]);
    } catch (e) {
      console.error('Failed to load community data:', e);
    }
  };

  const activeEntry = entries.find(e => e.id === selectedId) || (entries.length > 0 ? entries[entries.length - 1] : null);

  // Encyclopedia Functions
  const handleGenerateEntry = async () => {
    if (!discoveryQuery.trim()) return;
    
    setGeneratedEntry(null);
    setIsGeneratingEntry(true);
    
    try {
      const response = await fetch('/api/science/encyclopedia/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: discoveryQuery }),
      });
      
      if (response.ok) {
        const entry = await response.json();
        // Add id for UI state management
        const entryWithId = {
          ...entry,
          id: Date.now().toString()
        };
        setGeneratedEntry(entryWithId);
      } else {
        console.error('Failed to generate entry');
      }
    } catch (e) {
      console.error('Error generating entry:', e);
    } finally {
      setIsGeneratingEntry(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!generatedEntry) return;
    setIsSavingEntry(true);
    try {
      const res = await fetch('/api/science/encyclopedia/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: generatedEntry })
      });
      if (res.ok) setSaveEntrySuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // Mock API call - will be implemented later
      const response = await fetch('/api/science/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (response.ok) {
        const newEntry = await response.json();
        setEntries(prev => [...prev, newEntry]);
        setSelectedId(newEntry.id);
      } else {
        // For now, use mock data when API doesn't exist
        const mockEntry: ScienceEntry = {
          id: Date.now().toString(),
          title: query,
          hypothesis: `${query} may involve complex interactions between natural phenomena that require systematic investigation.`,
          observation: 'This phenomenon appears to follow predictable patterns based on established scientific principles. Further observation reveals consistent behaviors that can be measured and analyzed.',
          conclusion: `${query} demonstrates fundamental scientific concepts that help us understand the natural world better.`,
          fieldNotes: [
            `Scientists have been studying ${query.toLowerCase()} for centuries and are still discovering new aspects!`,
            `This concept has practical applications in everyday life and modern technology.`,
            `Understanding ${query.toLowerCase()} helps us appreciate the complexity of natural systems.`
          ],
          references: [
            'Science Encyclopedia',
            'National Geographic',
            'Classical Naturalist Texts'
          ]
        };
        setEntries(prev => [...prev, mockEntry]);
        setSelectedId(mockEntry.id);
      }
    } catch (error) {
      console.error('Error discovering:', error);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  const handleGenerateExperiment = async () => {
    if (!experimentQuery.trim()) return;
    
    setCurrentExperiment(null);
    setIsVideoSubmitted(false);
    setIsLoading(true);
    
    try {
      // Real API call to LangChain backend
      const response = await fetch('/api/science/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: experimentQuery }),
      });
      
      if (response.ok) {
        const experiment = await response.json();
        // Add id for UI state management
        const experimentWithId = {
          ...experiment,
          id: Date.now().toString()
        };
        setCurrentExperiment(experimentWithId);
      } else {
        console.error('Failed to generate experiment');
      }
    } catch (e) {
      console.error('Error generating experiment:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = () => {
    // Simulate upload
    setIsVideoSubmitted(true);
  };

  const handleSaveToJournal = async () => {
    if (!currentExperiment) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/science/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment: currentExperiment })
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinToggle = (clubId: string) => {
    setJoinedClubs(prev => 
      prev.includes(clubId) 
        ? prev.filter(c => c !== clubId) 
        : [...prev, clubId]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-emerald-200 bg-emerald-50/80 backdrop-blur-sm z-10 flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-bold text-emerald-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>The Book of Science</h2>
           <p className="text-sm italic text-emerald-700 mt-1">A Collaborative Encyclopedia of the Natural World</p>
        </div>
        <div className="flex gap-2">
            <Telescope className="w-8 h-8 text-emerald-600 opacity-70" />
        </div>
      </div>

       {/* Navigation */}
       <div className="flex border-b border-emerald-200 bg-white/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('book')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'book' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-100'}`}
          >
            The Encyclopedia
          </button>
          <button 
            onClick={() => setActiveTab('laboratory')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'laboratory' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-100'}`}
          >
            The Laboratory
          </button>
          <button 
            onClick={() => setActiveTab('societies')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'societies' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-100'}`}
          >
            Societies
          </button>
          <button 
            onClick={() => setActiveTab('bulletin')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'bulletin' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-100'}`}
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
                w-full md:w-80 bg-emerald-50 border-r border-emerald-200 flex flex-col z-20 transition-all absolute md:relative h-full
                ${activeEntry ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 bg-emerald-100 border-b border-emerald-200">
                    <h3 className="text-lg text-emerald-800 text-center uppercase tracking-widest font-bold">Index</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {entries.length === 0 ? (
                        <div className="text-center p-8 opacity-50 italic text-sm text-emerald-600">
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
                                        ? 'bg-white border-emerald-600 shadow-sm' 
                                        : 'bg-transparent border-transparent hover:bg-white/50 hover:border-emerald-300'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedId === entry.id ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                        Chapter {idx + 1}
                                    </span>
                                    <span className="text-[10px] text-emerald-500 italic">{entry.category}</span>
                                </div>
                                <div className={`text-lg leading-tight group-hover:text-emerald-700 ${selectedId === entry.id ? 'text-emerald-900 font-semibold' : 'text-emerald-700'}`}>
                                    {entry.topic}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right: The Page */}
            <div className={`
                flex-1 bg-white relative overflow-y-auto flex flex-col
                ${!activeEntry && 'hidden md:flex'}
            `}>
                {activeEntry ? (
                    <div className="max-w-3xl mx-auto p-6 md:p-12 w-full">
                        {/* Mobile Back Button */}
                        <button 
                            onClick={() => setSelectedId(null)}
                            className="md:hidden mb-4 text-xs uppercase tracking-widest text-emerald-700 flex items-center gap-1"
                        >
                            ← Return to Index
                        </button>

                        <div className="border-4 border-double border-emerald-200 p-8 md:p-12 bg-white shadow-sm relative">
                            {/* Page Number */}
                            <div className="absolute top-4 right-6 text-emerald-200 text-4xl opacity-50 font-bold">
                                {entries.findIndex(e => e.id === activeEntry.id) + 1}
                            </div>

                            <div className="text-center mb-8">
                                <span className="inline-block border-b border-emerald-600 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-2 px-2 pb-1">
                                    {activeEntry.category}
                                </span>
                                <h1 className="text-4xl md:text-5xl text-emerald-900 mb-4 font-bold">{activeEntry.topic}</h1>
                                <VineDivider className="w-32 h-6 text-emerald-400 mx-auto" />
                            </div>

                            <div className="grid md:grid-cols-[1fr_200px] gap-8">
                                <div className="space-y-6 text-lg leading-relaxed text-emerald-900">
                                    <section>
                                        <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-2">I. The Hypothesis</h3>
                                        <p className="italic text-emerald-600 border-l-2 border-emerald-300 pl-4">{activeEntry.hypothesis}</p>
                                    </section>

                                    <section>
                                        <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-2">II. Observation & Mechanism</h3>
                                        <p className="text-justify">{activeEntry.observation}</p>
                                    </section>

                                    <section>
                                        <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-2">III. Conclusion</h3>
                                        <p className="font-bold">{activeEntry.conclusion}</p>
                                    </section>
                                </div>

                                {/* Sidebar / Margin Notes */}
                                <div className="md:border-l border-emerald-200 md:pl-6 space-y-6">
                                    <div className="bg-emerald-50 p-4 border border-emerald-200 rounded">
                                        <h4 className="text-lg text-emerald-900 mb-2 font-bold">Field Notes</h4>
                                        <p className="text-sm italic text-emerald-700 leading-relaxed">
                                            {activeEntry.funFact}
                                        </p>
                                    </div>
                                    <div className="flex justify-center opacity-20">
                                        <Telescope className="w-16 h-16 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Source Citations */}
                            {activeEntry.sources && activeEntry.sources.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-emerald-200">
                                    <h4 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">References & Citations</h4>
                                    <ul className="space-y-1">
                                        {activeEntry.sources.map((source, i) => (
                                            <li key={i} className="text-xs truncate">
                                                <a 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
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
                        <Telescope className="w-24 h-24 text-emerald-400 mb-6" />
                        <h3 className="text-2xl text-emerald-900 font-bold">Ready to Discover?</h3>
                        <p className="max-w-md mt-2 italic text-emerald-700">
                            "The important thing is not to stop questioning. Curiosity has its own reason for existing."
                        </p>
                    </div>
                )}
            </div>
            
             {/* Generated Entry Display */}
            {generatedEntry && (
                <div className="absolute inset-0 bg-white z-40 flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-emerald-100 border-b border-emerald-200">
                        <h2 className="text-xl font-bold text-emerald-900">New Discovery</h2>
                        <Button 
                            onClick={() => setGeneratedEntry(null)}
                            variant="ghost"
                            className="text-xs text-emerald-400 hover:text-emerald-600"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Close
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-3xl mx-auto">
                            <div className="border-4 border-double border-emerald-200 p-8 bg-white shadow-sm">
                                <h1 className="text-3xl font-bold text-emerald-900 mb-8 text-center">{generatedEntry.title}</h1>
                                
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-800 mb-3">Hypothesis</h3>
                                        <p className="text-emerald-700 leading-relaxed italic">{generatedEntry.hypothesis}</p>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-800 mb-3">Observation</h3>
                                        <p className="text-emerald-700 leading-relaxed">{generatedEntry.observation}</p>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-800 mb-3">Conclusion</h3>
                                        <p className="text-emerald-700 leading-relaxed font-semibold">{generatedEntry.conclusion}</p>
                                    </div>
                                    
                                    <div className="bg-emerald-50 p-6 border-l-4 border-emerald-600">
                                        <h3 className="text-lg font-bold text-emerald-800 mb-3">Field Notes</h3>
                                        <ul className="space-y-2">
                                            {(generatedEntry.fieldNotes ?? []).map((note, i) => (
                                                <li key={i} className="text-emerald-700 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-800 mb-3">References</h3>
                                        <div className="space-y-1">
                                            {(generatedEntry.references ?? []).map((ref, i) => (
                                                <p key={i} className="text-emerald-600 text-sm italic">• {ref}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Save Button */}
                                <div className="mt-8 flex justify-center border-t-2 border-[#E7DAC3] pt-6">
                                    <Button 
                                        onClick={handleSaveEntry} 
                                        disabled={isSavingEntry || saveEntrySuccess}
                                        className="bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] font-['Kalam'] text-lg px-8 py-6 rounded-2xl shadow-md transition-colors"
                                    >
                                        {isSavingEntry ? "Pressing into Encyclopedia..." : saveEntrySuccess ? "✨ Saved to Encyclopedia!" : "🌿 Save to Encyclopedia"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Discovery Input */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white border-t border-emerald-200 z-30">
                <form onSubmit={(e) => { e.preventDefault(); handleGenerateEntry(); }} className="max-w-2xl mx-auto relative">
                    <Input
                    type="text"
                    value={discoveryQuery}
                    onChange={(e) => setDiscoveryQuery(e.target.value)}
                    placeholder="What scientific concept shall we discover?"
                    disabled={isGeneratingEntry}
                    className="w-full bg-white border-2 border-emerald-300 pr-12 rounded-sm focus:border-emerald-500 outline-none text-lg"
                    />
                    <Button 
                        type="submit"
                        disabled={isGeneratingEntry || !discoveryQuery.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 disabled:opacity-30"
                        variant="ghost"
                        size="sm"
                    >
                        {isGeneratingEntry ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Plus className="w-5 h-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
        )}

        {/* --- LABORATORY TAB --- */}
        {activeTab === 'laboratory' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                
                {/* 1. Request Experiment */}
                {!currentExperiment ? (
                    <div className="max-w-2xl mx-auto text-center py-12">
                        <MasonJar className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                        <h3 className="text-3xl text-emerald-900 mb-3 font-bold">The Laboratory</h3>
                        <p className="text-emerald-600 italic mb-8 max-w-lg mx-auto">
                            "Experiments are the questions we ask of nature." <br/>
                            Request an epic experiment below. Think explosions, slime, or magnetic magic.
                        </p>
                        
                        <div className="relative max-w-lg mx-auto mb-16">
                            <Input 
                                type="text"
                                value={experimentQuery}
                                onChange={(e) => setExperimentQuery(e.target.value)}
                                placeholder="E.g. Elephant Toothpaste, Volcano, Rockets..."
                                className="w-full p-4 pr-32 bg-white border-2 border-emerald-300 focus:border-emerald-500 outline-none rounded-sm text-lg"
                            />
                            <Button 
                                onClick={handleGenerateExperiment}
                                disabled={!experimentQuery.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-2 text-xs uppercase font-bold tracking-widest rounded-sm hover:bg-emerald-700"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Experiment Card */}
                        <Card className="border-2 border-emerald-300 p-6 md:p-10 shadow-lg relative mb-12">
                             <Button 
                                onClick={() => setCurrentExperiment(null)}
                                variant="ghost"
                                className="absolute top-4 right-4 text-xs text-emerald-400 hover:text-emerald-600"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Close Lab
                              </Button>

                             <div className="text-center mb-8">
                                <div className="flex justify-center gap-2 mb-2">
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{currentExperiment.difficulty}</Badge>
                                    <Badge variant="outline" className="border-emerald-300 text-emerald-600">{currentExperiment.timeRequired}</Badge>
                                </div>
                                <h2 className="text-4xl text-emerald-900 mb-2 font-bold">{currentExperiment.title}</h2>
                             </div>

                             <div className="grid md:grid-cols-2 gap-8 mb-8">
                                 <div>
                                     <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-700 mb-3 border-b border-emerald-200 pb-1">Equipment</h4>
                                     <ul className="text-sm space-y-1">
                                         {currentExperiment.materials.map((m, i) => (
                                             <li key={i} className="flex items-center gap-2">
                                                 <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                                 {m}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                                 <div className="bg-red-50 border border-red-100 p-4 rounded">
                                     <h4 className="font-bold text-xs uppercase tracking-widest text-red-800 mb-2 flex items-center gap-2">
                                         <AlertTriangle className="w-3 h-3" />
                                         Safety First
                                     </h4>
                                     <ul className="text-xs text-red-800/80 space-y-1 list-disc pl-4">
                                         {currentExperiment.safetyWarnings.map((s, i) => <li key={i}>{s}</li>)}
                                     </ul>
                                 </div>
                             </div>

                             <div className="mb-8">
                                 <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-700 mb-4 border-b border-emerald-200 pb-1">Procedure</h4>
                                 <div className="space-y-4">
                                     {currentExperiment.procedures.map((step, i) => (
                                         <div key={i} className="flex gap-4">
                                             <span className="text-2xl text-emerald-400 font-bold">{i + 1}</span>
                                             <p className="text-emerald-900 leading-relaxed mt-1">{step}</p>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div className="bg-emerald-50 p-6 border-l-4 border-emerald-600">
                                 <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-700 mb-2">The Science Behind It</h4>
                                 <p className="text-sm text-emerald-800 leading-relaxed">{currentExperiment.theScience}</p>
                             </div>

                             {/* Save to Journal Button */}
                             <div className="mt-8 flex justify-center border-t-2 border-[#E7DAC3] pt-6 relative">
                               <Button 
                                 onClick={handleSaveToJournal} 
                                 disabled={isSaving || saveSuccess}
                                 className="bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] font-['Kalam'] text-lg px-8 py-6 rounded-2xl shadow-md transition-colors"
                               >
                                 {isSaving ? "Pressing into Journal..." : saveSuccess ? "✨ Saved to Journal!" : "🌿 Save to Nature Journal"}
                               </Button>
                             </div>

                             {/* Submission Section */}
                             <div className="mt-12 pt-8 border-t border-dashed border-emerald-300 text-center">
                                 {!isVideoSubmitted ? (
                                    <>
                                        <h3 className="text-xl text-emerald-900 mb-2 font-bold">Capture the Magic</h3>
                                        <p className="text-sm text-emerald-600 mb-6">Did you perform this experiment? Upload your video to be featured on our community broadcast.</p>
                                        <Button 
                                            onClick={handleVideoUpload}
                                            className="bg-emerald-600 text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-emerald-700"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Video Evidence
                                        </Button>
                                    </>
                                 ) : (
                                     <div className="bg-green-50 p-6 border border-green-100">
                                         <h3 className="text-green-800 font-bold text-lg mb-1">Submission Received!</h3>
                                         <p className="text-green-700 text-sm">Your experiment is being reviewed by the Adeline Science Committee for feature.</p>
                                     </div>
                                 )}
                             </div>
                        </Card>
                    </div>
                )}

                {/* Community Feed / Mock Social Media */}
                <div className="max-w-6xl mx-auto border-t border-emerald-200 pt-12">
                    <h3 className="text-2xl text-center text-emerald-900 mb-8 font-bold">Featured Student Discoveries</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { user: "Timmy B.", title: "Mega Volcano", color: "bg-red-100" },
                            { user: "Sarah J.", title: "Glow Slime", color: "bg-green-100" },
                            { user: "Alex R.", title: "Bottle Rocket", color: "bg-blue-100" },
                            { user: "Priya M.", title: "Crystal Garden", color: "bg-purple-100" }
                        ].map((item, i) => (
                            <Card key={i} className="p-3 border border-emerald-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                                <div className={`h-40 w-full mb-3 ${item.color} flex items-center justify-center relative overflow-hidden rounded`}>
                                    <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Play className="w-6 h-6 text-white ml-1" />
                                    </div>
                                </div>
                                <h4 className="font-bold text-sm text-emerald-900 leading-tight">{item.title}</h4>
                                <p className="text-xs text-emerald-500 mt-1">by {item.user}</p>
                            </Card>
                        ))}
                    </div>
                </div>

            </div>
        )}

        {/* --- SOCIETIES TAB --- */}
        {activeTab === 'societies' && (
             <div className="overflow-y-auto h-full p-6">
                <h3 className="text-2xl text-emerald-900 mb-6 font-bold">Science Societies</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club) => (
                        <Card key={club.id} className="border-emerald-200">
                            <CardHeader>
                                <CardTitle className="text-emerald-900">{club.name}</CardTitle>
                                <CardDescription>{club.focus}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-emerald-700">{club.description}</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-emerald-600" />
                                        <span>{club.members} members</span>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded text-sm">
                                        <span className="font-semibold text-emerald-700">Current Challenge:</span>
                                        <p className="text-emerald-600">{club.currentChallenge}</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleJoinToggle(club.id)}
                                    className={joinedClubs.includes(club.id) ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}
                                    variant={joinedClubs.includes(club.id) ? "default" : "secondary"}
                                >
                                    {joinedClubs.includes(club.id) ? 'Joined' : 'Join Society'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}
        
        {/* --- BULLETIN TAB --- */}
        {activeTab === 'bulletin' && (
             <div className="overflow-y-auto h-full p-6">
                <h3 className="text-2xl text-emerald-900 mb-6 font-bold">Science Opportunities Bulletin</h3>
                <div className="space-y-4">
                    {opportunities.map((opportunity) => (
                        <Card key={opportunity.id} className="border-emerald-200">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-semibold text-emerald-900">{opportunity.title}</h4>
                                        <Badge variant="outline" className="border-emerald-300 text-emerald-600 mt-1">
                                            {opportunity.type}
                                        </Badge>
                                    </div>
                                    {opportunity.deadline && (
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm text-emerald-600">
                                                <Calendar className="w-4 h-4" />
                                                {opportunity.deadline}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-emerald-700 mb-4">{opportunity.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-emerald-600">Organized by {opportunity.organization}</span>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                        Learn More
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
