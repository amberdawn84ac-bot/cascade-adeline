"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Compass, Calendar, Clock, Users, Camera, BookOpen, Mountain, Building, Loader2, Heart, HandHeart } from 'lucide-react';
import { z } from 'zod';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Expedition schema
type ExpeditionReport = {
  location?: string;
  coordinates?: string;
  geology?: {
    formation?: string;
    rocks?: string[];
  };
  archaeology?: {
    era?: string;
    remnants?: string;
  };
  sociology?: {
    culture?: string;
    connection?: string;
  };
  characterFocus?: string;
  communityImpact?: string;
  stewardshipAction?: {
    environmentalThreat?: string;
    affectedCommunity?: string;
    actionSteps?: string[];
    deliveryTarget?: string;
  };
};

interface FieldJournalEntry {
  id: string;
  title: string;
  location: string;
  date: string;
  weather: string;
  observations: string;
  discoveries: string[];
  photos: number;
}

export default function ExpeditionsPage() {
  const [activeTab, setActiveTab] = useState<'plan' | 'journal'>('plan');
  const [locationInput, setLocationInput] = useState('');
  const [report, setReport] = useState<ExpeditionReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [journalEntries, setJournalEntries] = useState<FieldJournalEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('adeline-field-journal');
    if (saved) setJournalEntries(JSON.parse(saved));
  }, []);

  const [newEntry, setNewEntry] = useState({
    title: '',
    location: '',
    weather: '',
    observations: ''
  });

  const handleGenerateReport = async () => {
    if (!locationInput.trim()) return;
    setIsGenerating(true);
    setReport({});
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/expeditions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationInput }),
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      // Check if response is JSON (cached) or stream (new generation)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // Cached response - instant
        const data = await response.json();
        setReport(data);
      } else {
        // Streaming response - progressive
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
                  const partialData = JSON.parse(jsonStr);
                  setReport(prev => ({ ...prev, ...partialData }));
                } catch (e) {
                  // Ignore parse errors for partial data
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/expeditions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddJournalEntry = () => {
    if (!newEntry.title || !newEntry.location || !newEntry.observations) return;
    
    const entry: FieldJournalEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      location: newEntry.location,
      date: new Date().toISOString().split('T')[0],
      weather: newEntry.weather || 'Not recorded',
      observations: newEntry.observations,
      discoveries: [],
      photos: 0
    };
    
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem('adeline-field-journal', JSON.stringify(updated));
    setNewEntry({ title: '', location: '', weather: '', observations: '' });
    
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7]">
              <Compass size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Expeditions Pavilion
              </h1>
              <p className="text-[#2F4731]/70 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Plan field trips and document your discoveries in nature
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'plan' | 'journal')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Plan an Outing
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Field Journal
            </TabsTrigger>
          </TabsList>

          {/* Plan an Outing Tab */}
          <TabsContent value="plan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Expedition Survey
                </CardTitle>
                <CardDescription>
                  Enter a location to generate a comprehensive survey of its geological, archaeological, and cultural significance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., The Grand Canyon, Pompeii, The Nile Delta..."
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1"
                    disabled={isGenerating}
                  />
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating || !locationInput.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Surveying...
                      </>
                    ) : (
                      <>
                        <Compass className="h-4 w-4 mr-2" />
                        Survey
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {report && (
              <ErrorBoundary>
                <Card className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                      {report.coordinates ? (
                        <Badge variant="outline" className="mb-2">{report.coordinates}</Badge>
                      ) : (
                        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded mx-auto mb-2"></div>
                      )}
                      {report.location ? (
                        <CardTitle className="text-2xl">{report.location}</CardTitle>
                      ) : (
                        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded mx-auto"></div>
                      )}
                    </div>
                    <Badge className="absolute top-4 right-4">{isGenerating ? 'Surveying...' : 'Surveyed'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Geology */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mountain className="h-5 w-5" />
                          Geology
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {report.geology?.formation ? (
                          <p className="text-sm text-gray-600">{report.geology.formation}</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 animate-pulse rounded"></div>
                            <div className="h-4 bg-slate-200 animate-pulse rounded w-5/6"></div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Rock Samples:</h4>
                          {report.geology?.rocks && report.geology.rocks.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {report.geology.rocks.map((rock: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {rock}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <div className="h-6 w-16 bg-slate-200 animate-pulse rounded"></div>
                              <div className="h-6 w-20 bg-slate-200 animate-pulse rounded"></div>
                              <div className="h-6 w-14 bg-slate-200 animate-pulse rounded"></div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Archaeology */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Archaeology
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {report.archaeology?.era ? (
                          <Badge variant="outline">{report.archaeology.era}</Badge>
                        ) : (
                          <div className="h-6 w-24 bg-slate-200 animate-pulse rounded"></div>
                        )}
                        {report.archaeology?.remnants ? (
                          <p className="text-sm text-gray-600 italic">"{report.archaeology.remnants}"</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 animate-pulse rounded"></div>
                            <div className="h-4 bg-slate-200 animate-pulse rounded w-4/5"></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Human Geography */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Human Geography
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {report.sociology?.culture ? (
                          <p className="text-sm text-gray-600">{report.sociology.culture}</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 animate-pulse rounded"></div>
                            <div className="h-4 bg-slate-200 animate-pulse rounded w-5/6"></div>
                          </div>
                        )}
                        <div className="p-3 bg-gray-50 rounded">
                          <h4 className="text-sm font-semibold mb-1">Land's Influence:</h4>
                          {report.sociology?.connection ? (
                            <p className="text-xs text-gray-600">{report.sociology.connection}</p>
                          ) : (
                            <div className="h-3 bg-slate-200 animate-pulse rounded"></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Character Focus & Community Impact */}
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Heart className="h-6 w-6 text-purple-600" />
                        <h4 className="font-bold text-purple-900 text-lg">Character Focus</h4>
                      </div>
                      {report.characterFocus ? (
                        <p className="text-purple-800 leading-relaxed">{report.characterFocus}</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-4 bg-purple-200 animate-pulse rounded"></div>
                          <div className="h-4 bg-purple-200 animate-pulse rounded w-5/6"></div>
                          <div className="h-4 bg-purple-200 animate-pulse rounded w-4/6"></div>
                        </div>
                      )}
                    </div>
                    <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <HandHeart className="h-6 w-6 text-green-600" />
                        <h4 className="font-bold text-green-900 text-lg">Community Impact</h4>
                      </div>
                      {report.communityImpact ? (
                        <p className="text-green-800 leading-relaxed">{report.communityImpact}</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-4 bg-green-200 animate-pulse rounded"></div>
                          <div className="h-4 bg-green-200 animate-pulse rounded w-5/6"></div>
                          <div className="h-4 bg-green-200 animate-pulse rounded w-4/6"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stewardship Action Section */}
                  {report.stewardshipAction && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                      <h4 className="font-bold text-red-900 mb-4 text-lg flex items-center gap-2">
                        <Mountain className="w-5 h-5" />
                        Stewardship Mission
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white border border-red-200 rounded-lg p-4">
                          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Environmental Threat:</p>
                          <p className="text-sm text-red-900 leading-relaxed">{report.stewardshipAction.environmentalThreat}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Who Depends On This Place:</p>
                          <p className="text-sm text-red-900">{report.stewardshipAction.affectedCommunity}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Action Steps:</p>
                          <ol className="space-y-2">
                            {report.stewardshipAction.actionSteps?.map((step: string, i: number) => (
                              <li key={i} className="text-sm text-red-900 flex gap-2">
                                <span className="font-bold text-red-600">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🏡 Delivery Target:</p>
                          <p className="text-sm text-amber-900">{report.stewardshipAction.deliveryTarget}</p>
                        </div>
                        <Button 
                          onClick={() => {
                            const actionPlan = `STEWARDSHIP MISSION: ${report.location}\n\nTHREAT: ${report.stewardshipAction!.environmentalThreat}\n\nWHO DEPENDS ON THIS: ${report.stewardshipAction!.affectedCommunity}\n\nACTION STEPS:\n${report.stewardshipAction!.actionSteps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'No action steps available'}\n\nDELIVERY TARGET: ${report.stewardshipAction!.deliveryTarget}`;
                            navigator.clipboard.writeText(actionPlan);
                            alert('Stewardship mission copied! Execute it to serve your community.');
                          }}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          📋 Copy Mission Plan
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-center pt-4 border-t-2 border-[#E7DAC3]">
                    <Button
                      onClick={handleSaveReport}
                      disabled={isSaving || saveSuccess}
                      className="bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] px-8 py-6 rounded-2xl text-lg shadow-md transition-colors"
                      style={{ fontFamily: 'var(--font-kalam), cursive' }}
                    >
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Pressing into Field Journal...</>
                      ) : saveSuccess ? '✨ Saved to Field Journal!' : '🌿 Save to Field Journal'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </ErrorBoundary>
            )}
          </TabsContent>

          {/* Field Journal Tab */}
          <TabsContent value="journal" className="space-y-6">
            {/* Add New Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  New Journal Entry
                </CardTitle>
                <CardDescription>
                  Document your field observations and discoveries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Entry Title</label>
                    <Input
                      placeholder="e.g., Rock Formation Study"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Location</label>
                    <Input
                      placeholder="e.g., Local Creek Bed"
                      value={newEntry.location}
                      onChange={(e) => setNewEntry({...newEntry, location: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Weather Conditions</label>
                  <Input
                    placeholder="e.g., Sunny, 72°F"
                    value={newEntry.weather}
                    onChange={(e) => setNewEntry({...newEntry, weather: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Observations</label>
                  <Textarea
                    placeholder="Describe what you observed, discovered, or learned..."
                    value={newEntry.observations}
                    onChange={(e) => setNewEntry({...newEntry, observations: e.target.value})}
                    rows={4}
                  />
                </div>
                <Button onClick={handleAddJournalEntry} className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add Journal Entry
                </Button>
              </CardContent>
            </Card>

            {/* Journal Entries */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Previous Entries</h2>
              {journalEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{entry.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {entry.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {entry.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.weather}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          {entry.photos}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{entry.observations}</p>
                    {entry.discoveries.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold mb-2">Discoveries:</h4>
                        <div className="flex flex-wrap gap-1">
                          {entry.discoveries.map((discovery, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {discovery}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

