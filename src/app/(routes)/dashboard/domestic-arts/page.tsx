"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sprout, Beef, Flower2, AlertTriangle, Users, Camera, CheckCircle } from 'lucide-react';
import { SubjectLessonsPanel } from '@/components/learning/SubjectLessonsPanel';

type CategoryId = 'preservation' | 'livestock-sheep' | 'livestock-poultry' | 'livestock-horses' | 'greenhouse' | 'fiber-arts';

interface HomesteadProject {
  title: string;
  category: string;
  difficulty: string;
  seasonalWindow: string;
  timeRequired: string;
  materials: string[];
  steps: string[];
  safetyNotes: string[];
  yield: string;
  communityImpact: string;
}

const CATEGORIES: { id: CategoryId; label: string; icon: string; description: string }[] = [
  { id: 'preservation', label: 'Preservation & Kitchen', icon: '🫙', description: 'Canning, fermentation, dehydrating, root cellaring' },
  { id: 'livestock-sheep', label: 'Sheep', icon: '🐑', description: 'Wool, milk, meat — shearing, hoof care, lambing' },
  { id: 'livestock-poultry', label: 'Poultry', icon: '🐓', description: 'Chickens, ducks — feed ratios, health, processing' },
  { id: 'livestock-horses', label: 'Horses', icon: '🐴', description: 'Daily care, feed schedules, hoof and tack' },
  { id: 'greenhouse', label: 'Greenhouse', icon: '🌿', description: '16×60 saltbox — succession planting, thermal mass, season extension' },
  { id: 'fiber-arts', label: 'Fiber Arts', icon: '🧶', description: 'Raw wool → washing → carding → spinning → dyeing' },
];

export default function HomesteadingPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [focus, setFocus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<HomesteadProject | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcriptAdded, setTranscriptAdded] = useState(false);

  const handleGenerate = async (category: CategoryId, specificFocus?: string) => {
    setIsGenerating(true);
    setProject(null);
    setIsCompleted(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setTranscriptAdded(false);
    try {
      const res = await fetch('/api/domestic-arts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, focus: specificFocus?.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setProject(data);
    } catch (e) {
      console.error('Homesteading generate error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCompletion = async () => {
    if (!project || !photoFile) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('projectTitle', project.title);
      formData.append('category', project.category);
      formData.append('difficulty', project.difficulty);
      formData.append('yield', project.yield);
      
      const res = await fetch('/api/domestic-arts/complete', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Failed to submit');
      setTranscriptAdded(true);
    } catch (e) {
      console.error('Submit completion error:', e);
      alert('Failed to add to transcript. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F2]">
      {/* Header */}
      <div className="p-6 border-b border-green-200 bg-green-50/60">
        <h1 className="text-3xl font-bold text-green-900 flex items-center gap-3">
          <Sprout className="w-8 h-8" /> Homesteading
        </h1>
        <p className="text-green-700 text-sm mt-1 italic">Real skills. Real food. Real independence.</p>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full space-y-8">

        {/* Today's Lessons from Learning Plan */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-green-800 mb-4">Today's Lessons</h2>
          <SubjectLessonsPanel
            subject="Homesteading & Life Skills"
            keywords={['domestic', 'homestead', 'home economics', 'cooking', 'culinary', 'sewing', 'fiber', 'agriculture', 'life skills', 'practical arts', 'health', 'nutrition', 'gardening', 'farming', 'livestock', 'preservation', 'crafts']}
            accentColor="#16a34a"
          />
        </div>

        {/* Category Grid */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-green-800 mb-4">Choose Your Area</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                disabled={isGenerating}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setFocus('');
                  handleGenerate(cat.id);
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                  selectedCategory === cat.id
                    ? 'border-green-600 bg-green-50 shadow-md'
                    : 'border-green-100 bg-white hover:border-green-300'
                } ${isGenerating && selectedCategory === cat.id ? 'opacity-80' : ''}`}
              >
                <div className="text-2xl mb-1">
                  {isGenerating && selectedCategory === cat.id
                    ? <Loader2 className="w-7 h-7 animate-spin text-green-600" />
                    : cat.icon}
                </div>
                <div className="font-bold text-green-900 text-sm">{cat.label}</div>
                <div className="text-xs text-green-600 mt-0.5 leading-tight">{cat.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional focus refinement — shown after a category is selected */}
        {selectedCategory && !isGenerating && (
          <div className="flex gap-2 items-center">
            <Input
              value={focus}
              onChange={e => setFocus(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && focus.trim()) handleGenerate(selectedCategory, focus); }}
              placeholder={
                selectedCategory === 'preservation' ? 'Try something specific, e.g. pressure canning green beans…' :
                selectedCategory === 'livestock-sheep' ? 'Try something specific, e.g. shearing and skirting a fleece…' :
                selectedCategory === 'livestock-poultry' ? 'Try something specific, e.g. setting up a winter brooder…' :
                selectedCategory === 'livestock-horses' ? 'Try something specific, e.g. daily hoof picking routine…' :
                selectedCategory === 'greenhouse' ? 'Try something specific, e.g. January succession planting plan…' :
                'Try something specific, e.g. washing and carding raw fleece…'
              }
              className="border-green-200 flex-1"
            />
            <Button
              onClick={() => handleGenerate(selectedCategory, focus)}
              className="bg-green-700 hover:bg-green-800 text-white px-5 whitespace-nowrap"
            >
              {focus.trim() ? 'Generate This' : 'Generate Another'}
            </Button>
          </div>
        )}

        {/* Project Output */}
        {project && (
          <div className="space-y-5">
            {/* Title + Meta */}
            <div className="bg-green-800 text-white rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black leading-tight">{project.title}</h2>
                  <p className="text-green-200 text-sm mt-1">{project.difficulty} · {project.timeRequired}</p>
                </div>
                <div className="text-right text-sm text-green-200">
                  <p className="font-bold text-white">{project.seasonalWindow}</p>
                  <p className="text-xs mt-0.5">Seasonal Window</p>
                </div>
              </div>
              <div className="mt-4 bg-green-700/60 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-green-300 mb-1">Expected Yield</p>
                <p className="text-white font-bold">{project.yield}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Materials */}
              <Card className="border-2 border-green-100">
                <CardContent className="p-5">
                  <h3 className="font-black text-green-900 uppercase tracking-widest text-xs mb-3 flex items-center gap-2"><Beef className="w-4 h-4" /> Materials & Tools</h3>
                  <ul className="space-y-1.5">
                    {project.materials.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800"><span className="text-green-400 mt-0.5">▸</span>{m}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Safety */}
              {project.safetyNotes.length > 0 && (
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-5">
                    <h3 className="font-black text-amber-900 uppercase tracking-widest text-xs mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Safety Notes</h3>
                    <ul className="space-y-1.5">
                      {project.safetyNotes.map((n, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-800"><span className="text-amber-500 mt-0.5">⚠</span>{n}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Steps */}
            <Card className="border-2 border-green-100">
              <CardContent className="p-5">
                <h3 className="font-black text-green-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Flower2 className="w-4 h-4" /> Step-by-Step</h3>
                <ol className="space-y-3">
                  {project.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-green-900">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-700 text-white text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Community Impact */}
            <Card className="border-2 border-green-700 bg-green-50">
              <CardContent className="p-5">
                <h3 className="font-black text-green-900 uppercase tracking-widest text-xs mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Community Impact</h3>
                <p className="text-green-800 leading-relaxed text-sm">{project.communityImpact}</p>
              </CardContent>
            </Card>

            {/* Completion Section */}
            {!isCompleted && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-blue-900 mb-2">Ready to start?</h3>
                  <p className="text-sm text-blue-800 mb-4">When you finish this project, I'll ask you for a photo so we can add it to your transcript!</p>
                  <Button 
                    onClick={() => setIsCompleted(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    I'm Done! Show me what to do next →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Photo Upload Section */}
            {isCompleted && !transcriptAdded && (
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Camera className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-bold text-purple-900 text-xl mb-2">Great work! Let's see it!</h3>
                    <p className="text-purple-800">Upload a photo of your finished {project.title.toLowerCase()} so we can add this to your transcript.</p>
                  </div>

                  {photoPreview && (
                    <div className="mb-4 relative w-full max-w-md mx-auto h-64">
                      <Image src={photoPreview} alt="Preview" fill sizes="448px" className="object-contain rounded-lg border-2 border-purple-300" />
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3">
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <div className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">
                        {photoFile ? 'Change Photo' : 'Choose Photo'}
                      </div>
                    </label>

                    {photoFile && (
                      <Button
                        onClick={handleSubmitCompletion}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Adding to Transcript...</>
                        ) : (
                          <><CheckCircle className="w-5 h-5 mr-2" /> Add to My Transcript</>  
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Message */}
            {transcriptAdded && (
              <Card className="border-2 border-green-500 bg-green-50">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-green-900 text-xl mb-2">Added to Your Transcript!</h3>
                  <p className="text-green-800">Excellent work. This project is now part of your permanent record. Keep building real skills.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

