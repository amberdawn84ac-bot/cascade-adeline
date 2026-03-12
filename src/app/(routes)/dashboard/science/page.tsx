"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, AlertTriangle, ScrollText } from 'lucide-react';
import { Telescope, MasonJar, VineDivider, MagnifyingGlass } from '@/components/illustrations';

// Types from our central types file
interface ScienceEntry {
  id?: string;
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
  primarySourceCitation?: string;
  directQuote?: string;
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

interface Group {
  id: string;
  name: string;
  focus: string;
  description: string;
  currentChallenge: string;
}

interface FieldProject {
  title: string;
  objective: string;
  communityImpact: string;
  materialsNeeded: string[];
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
  const [activeTab, setActiveTab] = useState<'book' | 'laboratory' | 'groups' | 'fieldwork'>('book');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Community State
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
  const [fieldProjects, setFieldProjects] = useState<FieldProject[]>([]);
  const [isLoadingFieldWork, setIsLoadingFieldWork] = useState(false);
  const [fieldWorkLoaded, setFieldWorkLoaded] = useState(false);
  const [entries, setEntries] = useState<ScienceEntry[]>([]);
  const [globalHerbarium, setGlobalHerbarium] = useState<ScienceEntry[]>([]);
  const [isLoadingHerbarium, setIsLoadingHerbarium] = useState(true);

  // Load Global Herbarium from database on mount
  useEffect(() => {
    const loadGlobalHerbarium = async () => {
      setIsLoadingHerbarium(true);
      try {
        const response = await fetch('/api/science/encyclopedia/all');
        if (response.ok) {
          const data = await response.json();
          setGlobalHerbarium(data);
        }
      } catch (error) {
        console.error('Failed to load Global Herbarium:', error);
      } finally {
        setIsLoadingHerbarium(false);
      }
    };

    loadGlobalHerbarium();

    if (activeTab === 'groups' && groups.length === 0) {
      loadGroupsData();
      fetch('/api/user/me')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.joinedGroups)) setJoinedGroups(d.joinedGroups); })
        .catch(() => {});
    }
    if (activeTab === 'fieldwork' && !fieldWorkLoaded) {
      loadFieldWork();
    }
  }, [activeTab, groups.length, fieldWorkLoaded]);

  const loadGroupsData = () => {
    setGroups([
      {
        id: '1',
        name: 'Water Justice Lab',
        focus: 'Water quality testing, FOIA requests, and community protection',
        description: 'Test local water sources for contamination. Draft FOIA requests to water departments. Deliver clean water data to neighbors who need it.',
        currentChallenge: 'Test 3 local water sources (well, creek, tap). Draft FOIA request to County Water Dept for contamination records. Deliver results to 2 elderly neighbors.',
      },
      {
        id: '2',
        name: 'Soil Stewardship Collective',
        focus: 'Soil testing, pesticide investigation, and land restoration',
        description: 'Test soil for pesticide residue and heavy metals. Investigate corporate pollution. Restore contaminated land and deliver harvests to food-insecure neighbors.',
        currentChallenge: 'Test soil near industrial site. Draft policy proposal to ban harmful pesticides. Plant remediation crops and deliver first harvest to Martinez family.',
      },
      {
        id: '3',
        name: 'Food Safety Watchdogs',
        focus: 'Food testing, regulatory investigation, and community alerts',
        description: 'Test local food for contamination. Investigate FDA/USDA regulatory failures. Issue community alerts about unsafe products.',
        currentChallenge: 'Test 5 local food items for pesticide residue. Research one FDA recall failure. Draft community alert letter for church bulletin.',
      },
      {
        id: '4',
        name: 'Air Quality Defenders',
        focus: 'Air monitoring, pollution tracking, and environmental justice',
        description: 'Monitor local air quality. Track pollution sources (factories, highways). Draft complaints to EPA Regional Office about violations.',
        currentChallenge: 'Set up air quality monitor near highway. Track pollution for 2 weeks. Draft EPA complaint citing Clean Air Act violations.',
      },
      {
        id: '5',
        name: 'Seed Sovereignty Network',
        focus: 'Heirloom seeds, corporate seed monopolies, and food independence',
        description: 'Save heirloom seeds. Investigate Monsanto/Bayer seed patents. Build community seed library. Deliver seed packets to neighbors.',
        currentChallenge: 'Save seeds from 3 heirloom varieties. Research one seed patent case. Deliver 10 seed packets to neighbors with planting instructions.',
      },
      {
        id: '6',
        name: 'Wildlife Corridor Protectors',
        focus: 'Habitat mapping, development opposition, and land stewardship',
        description: 'Map wildlife corridors and migration paths. Oppose destructive development projects. Draft letters to planning commissions. Restore habitat.',
        currentChallenge: 'Map wildlife movement on your land. Research one local development threat. Draft letter to County Planning opposing habitat destruction.',
      },
    ]);
  };

  const loadFieldWork = async () => {
    setIsLoadingFieldWork(true);
    try {
      const res = await fetch('/api/science/field-work/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFieldProjects(data);
        setFieldWorkLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load field work:', e);
    } finally {
      setIsLoadingFieldWork(false);
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
      if (res.ok) {
        setSaveEntrySuccess(true);
        setGlobalHerbarium(prev => [generatedEntry, ...prev]);
        setEntries(prev => [...prev, { ...generatedEntry, id: generatedEntry.id || Date.now().toString() }]);
        setSelectedId(generatedEntry.id || Date.now().toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleGenerateExperiment = async () => {
    if (!experimentQuery.trim()) return;
    
    setCurrentExperiment(null);
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

  const handleJoinToggle = async (group: Group) => {
    try {
      const res = await fetch('/api/science/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: group.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setJoinedGroups(data.joinedGroups ?? []);
      }
    } catch (e) {
      console.error('Failed to toggle group membership:', e);
    }
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
            onClick={() => setActiveTab('groups')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'groups' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-100'}`}
          >
            Groups
          </button>
          <button 
            onClick={() => setActiveTab('fieldwork')}
            className={`flex-1 min-w-[120px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'fieldwork' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-100'}`}
          >
            Field Work
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
                                onClick={() => setSelectedId(entry.id || null)}
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
                    <div className="p-6 md:p-12 w-full">
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
                                    
                                    {/* Primary Source Evidence */}
                                    {generatedEntry.primarySourceCitation && generatedEntry.directQuote && (
                                        <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-300">
                                            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                                <ScrollText className="w-5 h-5" />
                                                Primary Source Evidence
                                            </h3>
                                            <div className="bg-white p-4 rounded-lg border border-amber-200 mb-4">
                                                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Original Source Citation:</p>
                                                <p className="text-amber-900 font-medium">{generatedEntry.primarySourceCitation}</p>
                                            </div>
                                            <div className="bg-[#FFFEF7] p-5 rounded-lg border-l-4 border-amber-600">
                                                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">Direct Quote from Original Document:</p>
                                                <blockquote className="text-amber-900 leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
                                                    "{generatedEntry.directQuote}"
                                                </blockquote>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-800 mb-3">Additional References</h3>
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

            {/* Global Herbarium - Crowdsourced Knowledge */}
            <div className="absolute bottom-24 left-0 right-0 max-h-[40vh] overflow-y-auto bg-[#FFFEF7] border-t-2 border-emerald-300 z-20">
                <div className="p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-emerald-900" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                                🌿 Global Herbarium
                            </h3>
                            <Badge className="bg-emerald-600 text-white">
                                {globalHerbarium.length} Discoveries
                            </Badge>
                        </div>
                        <p className="text-sm text-emerald-700 mb-6 italic">
                            A living encyclopedia built by students around the world. Every discovery adds to our collective understanding.
                        </p>
                        
                        {isLoadingHerbarium ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                                <span className="ml-3 text-emerald-700">Loading collective knowledge...</span>
                            </div>
                        ) : globalHerbarium.length === 0 ? (
                            <div className="text-center py-12 text-emerald-600 italic">
                                The Herbarium awaits its first discovery. Be the pioneer!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {globalHerbarium.map((entry) => (
                                    <div 
                                        key={entry.id}
                                        className="bg-white p-4 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all hover:shadow-lg cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-600">
                                                {entry.category || 'Science'}
                                            </Badge>
                                        </div>
                                        <h4 className="font-bold text-emerald-900 mb-2" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                                            {entry.title || entry.topic}
                                        </h4>
                                        <p className="text-sm text-emerald-700 line-clamp-3">
                                            {entry.observation}
                                        </p>
                                        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
                                            <span className="text-xs text-emerald-500 italic">Community Entry</span>
                                            <MagnifyingGlass className="w-4 h-4 text-emerald-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
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

                             {/* Systemic Action Section */}
                             {(currentExperiment as any).systemicAction && (
                               <div className="bg-red-50 p-6 border-l-4 border-red-600 mt-6">
                                 <h4 className="font-bold text-xs uppercase tracking-widest text-red-800 mb-3 flex items-center gap-2">
                                   <AlertTriangle className="w-4 h-4" />
                                   Take Action: {(currentExperiment as any).systemicAction.actionType.replace('-', ' ').toUpperCase()}
                                 </h4>
                                 <div className="space-y-3">
                                   <div>
                                     <p className="text-xs font-semibold text-red-700 mb-1">TARGET:</p>
                                     <p className="text-sm text-red-900">{(currentExperiment as any).systemicAction.target}</p>
                                   </div>
                                   <div>
                                     <p className="text-xs font-semibold text-red-700 mb-1">WHY THIS MATTERS:</p>
                                     <p className="text-sm text-red-900">{(currentExperiment as any).systemicAction.reasoning}</p>
                                   </div>
                                   <div className="bg-white p-4 rounded border border-red-200">
                                     <p className="text-xs font-semibold text-red-700 mb-2">DRAFT LETTER (Ready to Send):</p>
                                     <pre className="text-xs text-red-900 whitespace-pre-wrap font-mono">{(currentExperiment as any).systemicAction.draftText}</pre>
                                   </div>
                                   <Button 
                                     onClick={() => {
                                       navigator.clipboard.writeText((currentExperiment as any).systemicAction.draftText);
                                       alert('Letter copied to clipboard! Send it to make a difference.');
                                     }}
                                     className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                                   >
                                     📋 Copy Letter to Clipboard
                                   </Button>
                                 </div>
                               </div>
                             )}

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

                        </Card>
                    </div>
                )}


            </div>
        )}

        {/* --- GROUPS TAB --- */}
        {activeTab === 'groups' && (
             <div className="overflow-y-auto h-full p-6">
                <div className="max-w-5xl mx-auto">
                  <h3 className="text-2xl text-emerald-900 mb-2 font-bold">Science Groups</h3>
                  <p className="text-sm text-emerald-600 italic mb-6">Join a group to track your focus area and log related credits together.</p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => {
                      const isJoined = joinedGroups.includes(group.name);
                      return (
                        <Card key={group.id} className={`border-2 transition-all ${isJoined ? 'border-emerald-500 shadow-md' : 'border-emerald-200'}`}>
                            <CardHeader>
                                <CardTitle className="text-emerald-900 text-lg">{group.name}</CardTitle>
                                <CardDescription className="text-emerald-600">{group.focus}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-emerald-700">{group.description}</p>
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm">
                                    <span className="font-semibold text-amber-800 block mb-1">Current Challenge:</span>
                                    <p className="text-amber-700">{group.currentChallenge}</p>
                                </div>
                                <Button 
                                    onClick={() => handleJoinToggle(group)}
                                    className={isJoined ? 'w-full bg-emerald-600 hover:bg-red-600 transition-colors' : 'w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}
                                    variant={isJoined ? 'default' : 'secondary'}
                                >
                                    {isJoined ? '✓ Joined' : 'Join Group'}
                                </Button>
                            </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
            </div>
        )}
        
        {/* --- FIELD WORK TAB --- */}
        {activeTab === 'fieldwork' && (
          <div className="overflow-y-auto h-full p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl text-emerald-900 font-bold">Field Work</h3>
                <Button
                  onClick={() => { setFieldWorkLoaded(false); setFieldProjects([]); loadFieldWork(); }}
                  variant="ghost"
                  className="text-xs text-emerald-600 hover:text-emerald-800 uppercase tracking-widest"
                  disabled={isLoadingFieldWork}
                >
                  {isLoadingFieldWork ? <Loader2 className="w-4 h-4 animate-spin" /> : '↺ New Projects'}
                </Button>
              </div>
              <p className="text-sm text-emerald-600 italic mb-6">Real projects for your land, your animals, and your community. Generated fresh by Adeline.</p>

              {isLoadingFieldWork ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                  <p className="text-emerald-700 italic text-sm">Adeline is designing your field work...</p>
                </div>
              ) : fieldProjects.length === 0 ? (
                <div className="text-center py-16 text-emerald-500 italic">No projects loaded yet.</div>
              ) : (
                <div className="space-y-6">
                  {fieldProjects.map((project, i) => (
                    <Card key={i} className="border-2 border-emerald-200 hover:border-emerald-400 transition-all shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-emerald-700 font-bold text-lg">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-emerald-900 mb-2">{project.title}</h4>
                            <p className="text-emerald-700 mb-4 leading-relaxed">{project.objective}</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                                <span className="text-xs font-bold uppercase tracking-wide text-amber-800 block mb-1">Community Impact</span>
                                <p className="text-sm text-amber-700">{project.communityImpact}</p>
                              </div>
                              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                                <span className="text-xs font-bold uppercase tracking-wide text-emerald-800 block mb-1">What You Need</span>
                                <ul className="text-sm text-emerald-700 space-y-1">
                                  {project.materialsNeeded.map((m, j) => (
                                    <li key={j} className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>
                                      {m}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            {/* Systemic Action Section */}
                            {(project as any).systemicAction && (
                              <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg mt-4">
                                <h5 className="text-xs font-bold uppercase tracking-widest text-red-800 mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  {(project as any).systemicAction.actionType.replace('-', ' ').toUpperCase()}
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold text-red-700 mb-1">TARGET:</p>
                                    <p className="text-sm text-red-900">{(project as any).systemicAction.target}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-red-700 mb-1">WHY:</p>
                                    <p className="text-sm text-red-900">{(project as any).systemicAction.reasoning}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-red-200">
                                    <p className="text-xs font-semibold text-red-700 mb-2">ACTION PLAN:</p>
                                    <pre className="text-xs text-red-900 whitespace-pre-wrap">{(project as any).systemicAction.draftText}</pre>
                                  </div>
                                  <Button 
                                    onClick={() => {
                                      navigator.clipboard.writeText((project as any).systemicAction.draftText);
                                      alert('Action plan copied! Execute it to serve your community.');
                                    }}
                                    size="sm"
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                                  >
                                    📋 Copy Action Plan
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

