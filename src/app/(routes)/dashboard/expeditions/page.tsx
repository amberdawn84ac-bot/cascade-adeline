"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Compass, Calendar, Clock, Users, Camera, BookOpen, Mountain, Trees, Building } from 'lucide-react';

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
  
  // Field Journal State
  const [journalEntries, setJournalEntries] = useState<FieldJournalEntry[]>([
    {
      id: '1',
      title: 'Rock Formation Study',
      location: 'Local Creek Bed',
      date: '2024-01-15',
      weather: 'Sunny, 72°F',
      observations: 'Found interesting sedimentary layers with visible fossil imprints.',
      discoveries: ['Marine fossils', 'Sedimentary rock layers', 'Mineral deposits'],
      photos: 3
    },
    {
      id: '2',
      title: 'Urban Architecture Tour',
      location: 'Downtown Historic District',
      date: '2024-01-20',
      weather: 'Cloudy, 65°F',
      observations: 'Studied building styles from different eras and their construction materials.',
      discoveries: ['Art Deco designs', 'Victorian architecture', 'Modern steel structures'],
      photos: 5
    }
  ]);

  const [newEntry, setNewEntry] = useState({
    title: '',
    location: '',
    weather: '',
    observations: ''
  });

  const handleGenerateReport = async () => {
    if (!locationInput.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate API call - in real implementation, this would call your LangGraph service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock report data
      const mockReport: ExpeditionReport = {
        location: locationInput,
        coordinates: `${(Math.random() * 180 - 90).toFixed(4)}°N, ${(Math.random() * 360 - 180).toFixed(4)}°W`,
        geology: {
          formation: `The geological formation of ${locationInput} consists of layered sedimentary rock deposits that have been uplifted and eroded over millions of years.`,
          rocks: ['Sandstone', 'Shale', 'Limestone', 'Quartzite']
        },
        archaeology: {
          era: 'Holocene Period',
          remnants: `Evidence of early human settlement has been discovered in the area, including pottery fragments and primitive tools dating back approximately 8,000 years.`
        },
        sociology: {
          culture: `The region has been inhabited by various indigenous peoples who developed sophisticated agricultural practices and trading networks.`,
          connection: 'The natural landscape has significantly influenced settlement patterns, with communities establishing near water sources and fertile valleys.'
        }
      };
      
      setReport(mockReport);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
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
    
    setJournalEntries([entry, ...journalEntries]);
    setNewEntry({ title: '', location: '', weather: '', observations: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expeditions Pavilion</h1>
            <p className="text-gray-600 mt-1">Plan field trips and document your discoveries</p>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-gray-400" />
            <Mountain className="h-6 w-4 text-gray-400" />
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
