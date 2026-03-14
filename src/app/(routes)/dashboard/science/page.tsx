"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, AlertTriangle, Users } from 'lucide-react';
import { Telescope, MasonJar, VineDivider, MagnifyingGlass } from '@/components/illustrations';

// Types from our central types file
interface ScienceEntry {
  id?: string;
  title?: string;
  topic?: string;
  coreConcept?: string;
  appliedReality?: string;
  fieldChallenge?: string;
  imageUrl?: string | null;
  isColoringPage?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

  // Encyclopedia Chat State
  const [encyMessages, setEncyMessages] = useState<ChatMessage[]>([]);
  const [encyInput, setEncyInput] = useState('');
  const [isEncyChatting, setIsEncyChatting] = useState(false);
  const [encyChatEntryId, setEncyChatEntryId] = useState<string | null>(null);
  const encyChatScrollRef = useRef<HTMLDivElement>(null);

  // Laboratory State
  const [experimentQuery, setExperimentQuery] = useState('');
  const [currentExperiment, setCurrentExperiment] = useState<ScienceExperiment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Community State
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [fieldProjects, setFieldProjects] = useState<FieldProject[]>([]);
  const [isLoadingFieldWork, setIsLoadingFieldWork] = useState(false);
  const [fieldWorkLoaded, setFieldWorkLoaded] = useState(false);
  const [entries, setEntries] = useState<ScienceEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Load student's encyclopedia entries from database
  useEffect(() => {
    const loadEntries = async () => {
      if (activeTab === 'book') {
        setIsLoadingEntries(true);
        try {
          const response = await fetch('/api/science/encyclopedia/my-entries');
          if (response.ok) {
            const data = await response.json();
            setEntries(data);
          }
        } catch (error) {
          console.error('Failed to load encyclopedia entries:', error);
        } finally {
          setIsLoadingEntries(false);
        }
      }
    };

    loadEntries();

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

  const loadGroupsData = async () => {
    try {
      const res = await fetch('/api/science/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadGroupMemberships = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        const membershipRes = await fetch('/api/science/groups');
        if (membershipRes.ok) {
          const allGroups = await membershipRes.json();
          const myGroupIds = allGroups
            .filter((g: any) => g.memberships.some((m: any) => m.userId === data.id))
            .map((g: any) => g.id);
          setJoinedGroups(myGroupIds);
        }
      }
    } catch (error) {
      console.error('Failed to load memberships:', error);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupFocus, setNewGroupFocus] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupChallenge, setNewGroupChallenge] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const createGroup = async () => {
    if (!newGroupName.trim() || !newGroupFocus.trim() || !newGroupDescription.trim() || !newGroupChallenge.trim()) return;
    setIsCreatingGroup(true);
    try {
      const res = await fetch('/api/science/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          focus: newGroupFocus,
          description: newGroupDescription,
          currentChallenge: newGroupChallenge,
          isPublic: true,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupFocus('');
        setNewGroupDescription('');
        setNewGroupChallenge('');
        await loadGroupsData();
        await loadGroupMemberships();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [groupProjects, setGroupProjects] = useState<any[]>([]);
  const [groupLogs, setGroupLogs] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState<'chat' | 'projects' | 'logs'>('chat');

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMessages();
      loadGroupProjects();
      loadGroupLogs();
      const interval = setInterval(loadGroupMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  const loadGroupMessages = async () => {
    if (!selectedGroup) return;
    try {
      const lastMessageTime = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1].createdAt : null;
      const url = lastMessageTime 
        ? `/api/science/groups/${selectedGroup.id}/messages?since=${lastMessageTime}`
        : `/api/science/groups/${selectedGroup.id}/messages`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (lastMessageTime) {
          setGroupMessages(prev => [...prev, ...data]);
        } else {
          setGroupMessages(data);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadGroupProjects = async () => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/science/groups/${selectedGroup.id}/projects`);
      if (res.ok) setGroupProjects(await res.json());
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadGroupLogs = async () => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/science/groups/${selectedGroup.id}/log`);
      if (res.ok) setGroupLogs(await res.json());
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/science/groups/${selectedGroup.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        await loadGroupMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSendingMessage(false);
    }
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

  // Reset chat when switching entries
  useEffect(() => {
    if (selectedId !== encyChatEntryId) {
      setEncyMessages([]);
      setEncyChatEntryId(selectedId);
    }
  }, [selectedId]);

  // Auto-scroll chat
  useEffect(() => {
    if (encyChatScrollRef.current) {
      encyChatScrollRef.current.scrollTop = encyChatScrollRef.current.scrollHeight;
    }
  }, [encyMessages]);

  const sendEncyMessage = async (entry: ScienceEntry, entryId: string) => {
    if (!encyInput.trim() || isEncyChatting) return;
    const userMessage: ChatMessage = { role: 'user', content: encyInput };
    const newMessages = [...encyMessages, userMessage];
    setEncyMessages(newMessages);
    setEncyInput('');
    setIsEncyChatting(true);
    try {
      const res = await fetch(`/api/science/encyclopedia/${entryId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, entry }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      setEncyMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setEncyMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content };
          return msgs;
        });
      }
    } catch (e) {
      console.error('Encyclopedia chat error:', e);
    } finally {
      setIsEncyChatting(false);
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
        const newEntry = { ...generatedEntry, id: generatedEntry.id || Date.now().toString() };
        setEntries(prev => [newEntry, ...prev]);
        setSelectedId(newEntry.id);
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
      const res = await fetch(`/api/science/groups/${group.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.joined) {
          setJoinedGroups(prev => [...prev, group.id]);
        } else {
          setJoinedGroups(prev => prev.filter(id => id !== group.id));
        }
      }
    } catch (e) {
      console.error('Failed to toggle group membership:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF8F2] relative overflow-hidden">
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
                    {isLoadingEntries ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                            <p className="text-xs text-emerald-600 italic">Loading your encyclopedia...</p>
                        </div>
                    ) : entries.length === 0 ? (
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
                                </div>
                                <div className={`text-lg leading-tight group-hover:text-emerald-700 ${selectedId === entry.id ? 'text-emerald-900 font-semibold' : 'text-emerald-700'}`}>
                                    {entry.title || entry.topic}
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
                                <h1 className="text-4xl md:text-5xl text-emerald-900 mb-4 font-bold">{activeEntry.title || activeEntry.topic}</h1>
                                <VineDivider className="w-32 h-6 text-emerald-400 mx-auto" />
                            </div>

                            {/* Entry Image */}
                            {activeEntry.imageUrl && (
                              <div className="mb-8 flex flex-col items-center gap-3">
                                <img
                                  src={activeEntry.imageUrl}
                                  alt={activeEntry.title || activeEntry.topic || 'Encyclopedia illustration'}
                                  className="w-full max-w-sm rounded-xl border-2 border-emerald-200 shadow-md"
                                />
                                {activeEntry.isColoringPage && (
                                  <button
                                    onClick={() => {
                                      const win = window.open('', '_blank');
                                      if (win) {
                                        win.document.write(`<html><head><title>Color: ${activeEntry.title || activeEntry.topic}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;}</style></head><body><img src="${activeEntry.imageUrl}" onload="window.print()"/></body></html>`);
                                        win.document.close();
                                      }
                                    }}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-colors text-sm"
                                  >
                                    🖨️ Print to Color!
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="space-y-6 text-lg leading-relaxed text-emerald-900">
                                <section>
                                    <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-3 flex items-center gap-2">
                                        🔬 Core Concept
                                    </h3>
                                    <p className="text-emerald-900 leading-relaxed">{activeEntry.coreConcept}</p>
                                </section>

                                <section className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl">
                                    <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-3 flex items-center gap-2">
                                        🌱 Applied Reality
                                    </h3>
                                    <p className="text-emerald-800 leading-relaxed">{activeEntry.appliedReality}</p>
                                </section>
                            </div>
                        </div>

                        {/* Field Challenge */}
                        {activeEntry.fieldChallenge && (
                            <div className="mt-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                                    🌿 Field Challenge
                                </h3>
                                <p className="text-amber-900 leading-relaxed font-medium">{activeEntry.fieldChallenge}</p>
                            </div>
                        )}

                        {/* Live Chat with Adeline */}
                        <div className="mt-6 border-t-2 border-emerald-200 pt-6">
                            <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                💬 Talk to Adeline About This
                            </h3>
                            {encyMessages.length > 0 && (
                                <div ref={encyChatScrollRef} className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-1">
                                    {encyMessages.map((msg, i) => (
                                        <div key={i} className={`p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-900 ml-8' : 'bg-white border border-emerald-200 text-emerald-900 mr-8'}`}>
                                            <span className="font-bold text-xs uppercase tracking-wider block mb-1 opacity-60">{msg.role === 'user' ? 'You' : 'Adeline'}</span>
                                            {msg.content}
                                        </div>
                                    ))}
                                    {isEncyChatting && encyMessages[encyMessages.length - 1]?.role === 'assistant' && encyMessages[encyMessages.length - 1].content === '' && (
                                        <div className="flex items-center gap-2 text-emerald-500 text-sm italic ml-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Adeline is thinking…
                                        </div>
                                    )}
                                </div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); if (activeEntry.id) sendEncyMessage(activeEntry, activeEntry.id); }} className="flex gap-2">
                                <Input
                                    value={encyInput}
                                    onChange={e => setEncyInput(e.target.value)}
                                    placeholder={activeEntry.fieldChallenge ? "Report back what you found…" : "Ask Adeline a question about this topic…"}
                                    disabled={isEncyChatting}
                                    className="flex-1 border-emerald-300 focus:border-emerald-500 text-sm"
                                />
                                <Button type="submit" disabled={!encyInput.trim() || isEncyChatting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4">
                                    {isEncyChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                                </Button>
                            </form>
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

                                {/* Generated Image */}
                                {generatedEntry.imageUrl && (
                                  <div className="mb-8 flex flex-col items-center gap-3">
                                    <img
                                      src={generatedEntry.imageUrl}
                                      alt={generatedEntry.title || 'Encyclopedia illustration'}
                                      className="w-full max-w-md rounded-xl border-2 border-emerald-200 shadow-md"
                                    />
                                    {generatedEntry.isColoringPage && (
                                      <button
                                        onClick={() => {
                                          const win = window.open('', '_blank');
                                          if (win) {
                                            win.document.write(`<html><head><title>Color: ${generatedEntry.title}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;}</style></head><body><img src="${generatedEntry.imageUrl}" onload="window.print()"/></body></html>`);
                                            win.document.close();
                                          }
                                        }}
                                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-colors text-sm"
                                      >
                                        🖨️ Print to Color!
                                      </button>
                                    )}
                                  </div>
                                )}
                                
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-3 flex items-center gap-2">
                                            🔬 Core Concept
                                        </h3>
                                        <p className="text-emerald-900 leading-relaxed">{generatedEntry.coreConcept}</p>
                                    </section>

                                    <section className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl">
                                        <h3 className="font-bold text-emerald-700 uppercase text-sm tracking-wide mb-3 flex items-center gap-2">
                                            🌱 Applied Reality
                                        </h3>
                                        <p className="text-emerald-800 leading-relaxed">{generatedEntry.appliedReality}</p>
                                    </section>
                                </div>
                                
                                    {/* Field Challenge */}
                                    {generatedEntry.fieldChallenge && (
                                        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                                                🌿 Field Challenge
                                            </h3>
                                            <p className="text-amber-900 leading-relaxed font-medium">{generatedEntry.fieldChallenge}</p>
                                        </div>
                                    )}

                                {/* Live Chat with Adeline */}
                                <div className="mt-6 border-t-2 border-emerald-200 pt-6">
                                    <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                        💬 Talk to Adeline About This
                                    </h3>
                                    {encyMessages.length > 0 && (
                                        <div ref={encyChatScrollRef} className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-1">
                                            {encyMessages.map((msg, i) => (
                                                <div key={i} className={`p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-900 ml-8' : 'bg-white border border-emerald-200 text-emerald-900 mr-8'}`}>
                                                    <span className="font-bold text-xs uppercase tracking-wider block mb-1 opacity-60">{msg.role === 'user' ? 'You' : 'Adeline'}</span>
                                                    {msg.content}
                                                </div>
                                            ))}
                                            {isEncyChatting && encyMessages[encyMessages.length - 1]?.role === 'assistant' && encyMessages[encyMessages.length - 1].content === '' && (
                                                <div className="flex items-center gap-2 text-emerald-500 text-sm italic ml-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Adeline is thinking…
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <form onSubmit={(e) => { e.preventDefault(); sendEncyMessage(generatedEntry, 'new'); }} className="flex gap-2">
                                        <Input
                                            value={encyInput}
                                            onChange={e => setEncyInput(e.target.value)}
                                            placeholder={generatedEntry.fieldChallenge ? "Report back what you found…" : "Ask Adeline a question…"}
                                            disabled={isEncyChatting}
                                            className="flex-1 border-emerald-300 focus:border-emerald-500 text-sm"
                                        />
                                        <Button type="submit" disabled={!encyInput.trim() || isEncyChatting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4">
                                            {isEncyChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                                        </Button>
                                    </form>
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
          selectedGroup ? (
            <div className="overflow-y-auto h-full p-6">
              <div className="max-w-5xl mx-auto">
                <Button
                  onClick={() => setSelectedGroup(null)}
                  variant="ghost"
                  className="mb-4 text-emerald-600 hover:text-emerald-800"
                >
                  ← Back to All Groups
                </Button>
                
                <div className="bg-white rounded-2xl border-2 border-emerald-300 p-8 shadow-lg">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-emerald-900 mb-2">{selectedGroup.name}</h2>
                    <p className="text-emerald-600 italic">{selectedGroup.focus}</p>
                  </div>

                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-red-900 mb-3 text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Current Mission
                    </h3>
                    <p className="text-red-900 leading-relaxed">{selectedGroup.currentChallenge}</p>
                  </div>

                  <div className="flex border-b border-emerald-200 mb-6">
                    {(['chat', 'projects', 'logs'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveGroupTab(tab)}
                        className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${
                          activeGroupTab === tab ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {tab === 'chat' ? '💬 Group Chat' : tab === 'projects' ? '📁 Projects' : '📝 Work Logs'}
                      </button>
                    ))}
                  </div>

                  {activeGroupTab === 'chat' && (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                        {groupMessages.length === 0 ? (
                          <p className="text-emerald-600 italic text-sm text-center py-8">No messages yet. Start the conversation!</p>
                        ) : (
                          groupMessages.map((msg) => (
                            <div key={msg.id} className={`p-3 rounded-lg ${msg.aiMediated ? 'bg-amber-100 border border-amber-300' : 'bg-white border border-emerald-200'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-emerald-900 text-sm">{msg.author.name}</span>
                                {msg.aiMediated && <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">AI Mediated</Badge>}
                                <span className="text-xs text-emerald-500 ml-auto">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-sm text-emerald-900">{msg.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="border-emerald-300 focus:border-emerald-500"
                        />
                        <Button onClick={sendMessage} disabled={isSendingMessage || !newMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                          Send
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeGroupTab === 'projects' && (
                    <div className="space-y-4">
                      {groupProjects.length === 0 ? (
                        <p className="text-emerald-600 italic text-sm text-center py-8">No projects yet. Create one to get started!</p>
                      ) : (
                        groupProjects.map((project) => (
                          <Card key={project.id} className="border-2 border-emerald-200">
                            <CardHeader>
                              <CardTitle className="text-emerald-900">{project.title}</CardTitle>
                              <CardDescription>{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Badge variant="outline" className="border-emerald-400 text-emerald-700">{project.status}</Badge>
                              <p className="text-xs text-emerald-600 mt-2">{project._count.logEntries} work log entries</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}

                  {activeGroupTab === 'logs' && (
                    <div className="space-y-3">
                      {groupLogs.length === 0 ? (
                        <p className="text-emerald-600 italic text-sm text-center py-8">No work logs yet. Document your progress!</p>
                      ) : (
                        groupLogs.map((log) => (
                          <div key={log.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-emerald-900 text-sm">{log.user.name}</span>
                              {log.project && <Badge variant="outline" className="border-emerald-400 text-emerald-700 text-xs">{log.project.title}</Badge>}
                              <span className="text-xs text-emerald-500 ml-auto">{new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-emerald-900">{log.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-emerald-200">
                    <Card className="border-2 border-emerald-200">
                      <CardHeader>
                        <CardTitle className="text-emerald-900 flex items-center gap-2">
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-emerald-700 mb-4">Log your work, create projects, or request AI mediation if the group needs help.</p>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                          📝 Create Log Entry
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-amber-900 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Group Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-amber-700 mb-4">See what other members are working on and share your findings.</p>
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                          👥 View Group Feed
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <h3 className="font-bold text-emerald-900 mb-3">About This Group</h3>
                    <p className="text-emerald-800 leading-relaxed mb-4">{selectedGroup.description}</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                        📚 View Past Challenges
                      </Button>
                      <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                        🏆 Group Achievements
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="overflow-y-auto h-full p-6">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl text-emerald-900 mb-2 font-bold">Science Groups</h3>
                      <p className="text-sm text-emerald-600 italic">Join a group to work on systemic action challenges together. Each group focuses on real-world justice and community service.</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Group
                    </Button>
                  </div>
                  
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-900">
                      <strong>Students can create groups!</strong> Take initiative and start your own science group. 
                      Public groups require an adult monitor/moderator to ensure safety and accountability.
                    </p>
                  </div>

                  <h4 className="text-lg text-emerald-800 font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="border-emerald-400 text-emerald-700">Example Groups</Badge>
                    Explore these sample groups for inspiration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groups.map((group) => {
                      const isJoined = joinedGroups.includes(group.id);
                      return (
                        <Card key={group.id} className={`border-2 transition-all ${isJoined ? 'border-emerald-500 shadow-md' : 'border-emerald-200'} cursor-pointer hover:shadow-lg`}
                          onClick={() => isJoined && setSelectedGroup(group)}
                        >
                            <CardHeader>
                                <CardTitle className="text-emerald-900 text-lg">{group.name}</CardTitle>
                                <CardDescription className="text-emerald-600">{group.focus}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-emerald-700">{group.description}</p>
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm">
                                    <span className="font-semibold text-amber-800 block mb-1">Current Challenge:</span>
                                    <p className="text-amber-700 text-xs">{group.currentChallenge}</p>
                                </div>
                                <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isJoined) {
                                        setSelectedGroup(group);
                                      } else {
                                        handleJoinToggle(group);
                                      }
                                    }}
                                    className={isJoined ? 'w-full bg-emerald-600 hover:bg-emerald-700 transition-colors' : 'w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}
                                    variant={isJoined ? 'default' : 'secondary'}
                                >
                                    {isJoined ? '→ Open Group Workspace' : 'Join Group'}
                                </Button>
                            </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
            </div>
          )
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border-2 border-emerald-300 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-emerald-900">Create Science Group</h2>
              <Button onClick={() => setShowCreateModal(false)} variant="ghost" size="sm">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-emerald-800 block mb-1">Group Name</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Water Justice Lab"
                  className="border-emerald-300 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-800 block mb-1">Focus Area</label>
                <Input
                  value={newGroupFocus}
                  onChange={(e) => setNewGroupFocus(e.target.value)}
                  placeholder="e.g. Water quality testing, FOIA requests, and policy action"
                  className="border-emerald-300 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-800 block mb-1">Description</label>
                <Textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What will your group do? What systemic issues will you address?"
                  className="border-emerald-300 focus:border-emerald-500 min-h-24"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-800 block mb-1">Current Challenge</label>
                <Textarea
                  value={newGroupChallenge}
                  onChange={(e) => setNewGroupChallenge(e.target.value)}
                  placeholder="What's the first mission for your group? Be specific about actions and deliverables."
                  className="border-emerald-300 focus:border-emerald-500 min-h-24"
                />
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Note:</strong> Public groups are visible to all students. You'll be set as the moderator and can invite others to join.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={createGroup}
                  disabled={isCreatingGroup || !newGroupName.trim() || !newGroupFocus.trim() || !newGroupDescription.trim() || !newGroupChallenge.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isCreatingGroup ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
                <Button onClick={() => setShowCreateModal(false)} variant="outline" className="border-emerald-300">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

