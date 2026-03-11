"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Compass, Calendar, Clock, Users, Camera, BookOpen, Mountain, Building, Loader2, Heart, HandHeart } from 'lucide-react';

interface ExpeditionReport {
  location: string;
  coordinates: string;
  geology: {
    formation: string;
    rocks: string[];
  };
  archaeology: {
    era: string;
    remnants: string;
  };
  sociology: {
    culture: string;
    connection: string;
  };
  characterFocus: string;
  communityImpact: string;
}

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
    setReport(null);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/expeditions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationInput }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const data = await response.json();
      setReport(data);
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
              <Card className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <Badge variant="outline" className="mb-2">{report.coordinates}</Badge>
                      <CardTitle className="text-2xl">{report.location}</CardTitle>
                    </div>
                    <Badge className="absolute top-4 right-4">Surveyed</Badge>
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
                        <p className="text-sm text-gray-600">{report.geology.formation}</p>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Rock Samples:</h4>
                          <div className="flex flex-wrap gap-1">
                            {report.geology.rocks.map((rock: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {rock}
                              </Badge>
                            ))}
                          </div>
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
                        <Badge variant="outline">{report.archaeology.era}</Badge>
                        <p className="text-sm text-gray-600 italic">"{report.archaeology.remnants}"</p>
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
                        <p className="text-sm text-gray-600">{report.sociology.culture}</p>
                        <div className="p-3 bg-gray-50 rounded">
                          <h4 className="text-sm font-semibold mb-1">Land's Influence:</h4>
                          <p className="text-xs text-gray-600">{report.sociology.connection}</p>
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
                      <p className="text-purple-800 leading-relaxed">{report.characterFocus}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <HandHeart className="h-6 w-6 text-green-600" />
                        <h4 className="font-bold text-green-900 text-lg">Community Impact</h4>
                      </div>
                      <p className="text-green-800 leading-relaxed">{report.communityImpact}</p>
                    </div>
                  </div>

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

