'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Target, CheckCircle, Circle, Lock, TrendingUp, Calendar, Edit2, Save, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetCredits: number;
  status: 'completed' | 'in-progress' | 'locked';
  grade: string;
  pillars: {
    academics: boolean;
    trade: boolean;
    business: boolean;
    character: boolean;
  };
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  focus: 'trade' | 'business' | 'college' | 'balanced';
  selected: boolean;
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: '1',
    title: 'Basecamp - Foundation Year',
    description: 'Build core academic skills, explore interests, establish daily rhythms',
    targetCredits: 6,
    status: 'in-progress',
    grade: '9th',
    pillars: { academics: true, trade: false, business: false, character: true }
  },
  {
    id: '2',
    title: 'The Traverse - Skill Development',
    description: 'Master key subjects, begin trade apprenticeship or business venture',
    targetCredits: 12,
    status: 'locked',
    grade: '10th',
    pillars: { academics: true, trade: true, business: true, character: true }
  },
  {
    id: '3',
    title: 'The Ridge - Specialization',
    description: 'Deep dive into chosen path, earn college credits, build portfolio',
    targetCredits: 18,
    status: 'locked',
    grade: '11th',
    pillars: { academics: true, trade: true, business: true, character: true }
  },
  {
    id: '4',
    title: 'The Summit - Mastery & Defense',
    description: 'Complete graduation portfolio, prepare defense, finalize post-grad plan',
    targetCredits: 24,
    status: 'locked',
    grade: '12th',
    pillars: { academics: true, trade: true, business: true, character: true }
  }
];

const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'trade',
    name: 'Trade & Apprenticeship',
    description: 'Focus on hands-on skills, apprenticeships, and technical mastery. Minimal college prep.',
    focus: 'trade',
    selected: false
  },
  {
    id: 'business',
    name: 'Entrepreneurship',
    description: 'Build and run a real business. Learn through doing. Revenue is your transcript.',
    focus: 'business',
    selected: false
  },
  {
    id: 'college',
    name: 'College Preparation',
    description: 'Maximize CLEP credits, dual enrollment, and academic rigor for university admission.',
    focus: 'college',
    selected: false
  },
  {
    id: 'balanced',
    name: 'Balanced Path',
    description: 'Mix of academics, trade skills, and entrepreneurship. Keep all doors open.',
    focus: 'balanced',
    selected: true
  }
];

export default function GraduationAscentPage() {
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [paths, setPaths] = useState<LearningPath[]>(LEARNING_PATHS);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(3.5);
  const [totalTarget] = useState(24);

  const selectedPath = paths.find(p => p.selected);
  const progressPercent = Math.round((currentCredits / totalTarget) * 100);

  const handleSelectPath = (pathId: string) => {
    setPaths(paths.map(p => ({ ...p, selected: p.id === pathId })));
  };

  const handleSavePath = () => {
    setIsEditingPath(false);
    // TODO: Save to backend
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-[#2F4731]" />
            <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Graduation Ascent
            </h1>
          </div>
          <p className="text-[#2F4731]/70 text-lg">
            Your 4-year roadmap to a real, defensible graduation. Adeline will keep you moving.
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="border-2 border-[#2F4731] bg-gradient-to-br from-[#2F4731] to-[#1e3020]">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6 text-white">
              <div>
                <p className="text-sm uppercase tracking-wider text-[#BD6809] font-bold mb-2">Overall Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{progressPercent}%</span>
                  <span className="text-white/60">complete</span>
                </div>
                <div className="mt-3 bg-white/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-[#BD6809] h-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider text-[#BD6809] font-bold mb-2">Credits Earned</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{currentCredits}</span>
                  <span className="text-white/60">/ {totalTarget}</span>
                </div>
                <p className="text-xs text-white/60 mt-2">Target: 24 credits for graduation</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider text-[#BD6809] font-bold mb-2">Current Path</p>
                <p className="text-2xl font-bold">{selectedPath?.name}</p>
                <Button 
                  onClick={() => setIsEditingPath(true)}
                  variant="outline" 
                  size="sm"
                  className="mt-3 border-white/40 text-white hover:bg-white/10"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Change Path
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Path Selection Modal */}
        {isEditingPath && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-3xl w-full border-2 border-[#2F4731]">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#2F4731]">Choose Your Path</h2>
                  <button onClick={() => setIsEditingPath(false)} className="text-[#2F4731]/60 hover:text-[#2F4731]">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-[#2F4731]/70 mb-6">
                  Your path shapes your learning plan. You can change this anytime as your goals evolve.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {paths.map(path => (
                    <button
                      key={path.id}
                      onClick={() => handleSelectPath(path.id)}
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        path.selected 
                          ? 'border-[#BD6809] bg-[#BD6809]/10' 
                          : 'border-[#E7DAC3] hover:border-[#BD6809]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-[#2F4731]">{path.name}</h3>
                        {path.selected && <CheckCircle className="w-5 h-5 text-[#BD6809]" />}
                      </div>
                      <p className="text-sm text-[#2F4731]/70">{path.description}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 justify-end">
                  <Button onClick={() => setIsEditingPath(false)} variant="outline">Cancel</Button>
                  <Button onClick={handleSavePath} className="bg-[#2F4731] hover:bg-[#BD6809]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Path
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Milestones Roadmap */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-[#BD6809]" />
            <h2 className="text-2xl font-bold text-[#2F4731]">Your Roadmap</h2>
          </div>

          {milestones.map((milestone, index) => {
            const isLocked = milestone.status === 'locked';
            const isCompleted = milestone.status === 'completed';
            const isActive = milestone.status === 'in-progress';

            return (
              <Card 
                key={milestone.id}
                className={`border-2 transition-all ${
                  isCompleted ? 'border-green-500 bg-green-50' :
                  isActive ? 'border-[#BD6809] bg-[#BD6809]/5' :
                  'border-[#E7DAC3] opacity-60'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`mt-1 ${isLocked ? 'text-gray-400' : isCompleted ? 'text-green-600' : 'text-[#BD6809]'}`}>
                      {isLocked ? <Lock className="w-8 h-8" /> :
                       isCompleted ? <CheckCircle className="w-8 h-8" /> :
                       <Circle className="w-8 h-8" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-[#2F4731]">{milestone.title}</h3>
                            <span className="px-3 py-1 bg-[#2F4731] text-white text-xs font-bold rounded-full">
                              {milestone.grade} Grade
                            </span>
                          </div>
                          <p className="text-[#2F4731]/70">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#2F4731]/60">Target</p>
                          <p className="text-2xl font-bold text-[#BD6809]">{milestone.targetCredits} cr</p>
                        </div>
                      </div>

                      {/* Pillars */}
                      <div className="flex gap-2 flex-wrap">
                        {milestone.pillars.academics && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                            📚 Academics
                          </span>
                        )}
                        {milestone.pillars.trade && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            🔧 Trade
                          </span>
                        )}
                        {milestone.pillars.business && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                            💼 Business
                          </span>
                        )}
                        {milestone.pillars.character && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                            ⭐ Character
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      {isActive && (
                        <div className="mt-4 pt-4 border-t border-[#E7DAC3]">
                          <Button className="bg-[#BD6809] hover:bg-[#2F4731]">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View Current Goals
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Adeline's Motivation */}
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Adeline's Reminder</h3>
                <p className="text-amber-800 leading-relaxed">
                  Graduation is not a finish line — it's a launchpad. Every credit you earn, every skill you build, 
                  every business dollar you generate is proof of real-world competence. I will not let you coast. 
                  Let's keep climbing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
