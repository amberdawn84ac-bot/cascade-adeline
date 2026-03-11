"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sprout, Beef, Flower2, AlertTriangle, Users } from 'lucide-react';

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
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [focus, setFocus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<HomesteadProject | null>(null);

  const handleGenerate = async () => {
    if (!selectedCategory || !focus.trim()) return;
    setIsGenerating(true);
    setProject(null);
    try {
      const res = await fetch('/api/domestic-arts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, focus, skillLevel }),
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

  const activeCat = CATEGORIES.find(c => c.id === selectedCategory);

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

        {/* Category Grid */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-green-800 mb-4">Choose Your Area</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setProject(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedCategory === cat.id ? 'border-green-600 bg-green-50 shadow-md' : 'border-green-100 bg-white hover:border-green-300'}`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="font-bold text-green-900 text-sm">{cat.label}</div>
                <div className="text-xs text-green-600 mt-0.5 leading-tight">{cat.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generator Form */}
        {selectedCategory && (
          <Card className="border-2 border-green-200">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-green-900 text-lg">{activeCat?.icon} {activeCat?.label} Project</h3>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">What specifically?</label>
                  <Input
                    value={focus}
                    onChange={e => setFocus(e.target.value)}
                    placeholder={
                      selectedCategory === 'preservation' ? 'e.g. pressure canning green beans' :
                      selectedCategory === 'livestock-sheep' ? 'e.g. shearing and skirting a fleece' :
                      selectedCategory === 'livestock-poultry' ? 'e.g. setting up a winter brooder' :
                      selectedCategory === 'livestock-horses' ? 'e.g. daily hoof picking routine' :
                      selectedCategory === 'greenhouse' ? 'e.g. January succession planting plan' :
                      'e.g. washing and carding raw fleece'
                    }
                    className="border-green-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">Skill Level</label>
                  <div className="flex gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setSkillLevel(lvl)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border-2 transition-all ${skillLevel === lvl ? 'bg-green-700 text-white border-green-700' : 'border-green-200 text-green-700 hover:border-green-400'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !focus.trim()}
                className="w-full bg-green-700 hover:bg-green-800 text-white uppercase tracking-widest py-5"
              >
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Project…</> : 'Generate Project'}
              </Button>
            </CardContent>
          </Card>
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

            <div className="grid md:grid-cols-2 gap-5">
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
          </div>
        )}
      </div>
    </div>
  );
}

