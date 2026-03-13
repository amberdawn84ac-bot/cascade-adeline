'use client';

import { useState, useEffect } from 'react';
import { Mountain, Target, TrendingUp, MapPin, MessageSquare, X, Loader2, Calendar, Award, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChat } from '@ai-sdk/react';

interface Credit {
  id: string;
  title: string;
  subject: string;
  creditsNeeded: number;
  description: string;
  status: 'active' | 'planned' | 'completed';
  dueDate?: string;
  progress?: number;
}

interface JourneyPlan {
  graduationDate: string;
  totalCreditsNeeded: number;
  creditsEarned: number;
  activeExpeditions: Credit[];
  trailAhead: Credit[];
  lastActivity?: {
    activityName: string;
    date: string;
    daysSince: number;
  };
  adelineMessage: string;
}

export default function JourneyPage() {
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [showChangeRoute, setShowChangeRoute] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: '/api/journey/change-route',
    body: { creditId: selectedCredit?.id },
    onFinish: async () => {
      // Reload the plan after route change
      await loadPlan();
      setShowChangeRoute(false);
      setSelectedCredit(null);
    }
  });

  const loadPlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/journey/plan');
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      }
    } catch (error) {
      console.error('Failed to load journey plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleChangeRoute = (credit: Credit) => {
    setSelectedCredit(credit);
    setShowChangeRoute(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#BD6809] mx-auto mb-4" />
          <p className="text-[#2F4731]/60 italic">Charting your path to the summit...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center p-6">
        <Card className="border-2 border-red-200 bg-red-50 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-red-900">Failed to load your journey plan. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = Math.round((plan.creditsEarned / plan.totalCreditsNeeded) * 100);

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2F4731] to-[#1e3020] text-white p-8 border-b-4 border-[#BD6809]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Mountain className="w-12 h-12 text-[#BD6809]" />
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Your Journey to Graduation
              </h1>
              <p className="text-white/80 mt-1">The summit awaits. Let's keep climbing.</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider text-[#BD6809]">Progress to Summit</span>
              <span className="text-2xl font-black">{progressPercent}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-[#BD6809] h-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-white/70">{plan.creditsEarned} credits earned</span>
              <span className="text-white/70">{plan.totalCreditsNeeded} credits needed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Adeline's Motivational Push */}
        <Card className="border-2 border-[#BD6809] bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#2F4731] rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-[#2F4731]">Adeline's Push</h3>
                  {plan.lastActivity && plan.lastActivity.daysSince > 3 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                      ⚠️ {plan.lastActivity.daysSince} days idle
                    </span>
                  )}
                </div>
                <p className="text-[#2F4731] leading-relaxed font-medium">
                  {plan.adelineMessage}
                </p>
                {plan.lastActivity && (
                  <p className="text-xs text-[#2F4731]/60 mt-2">
                    Last logged: {plan.lastActivity.activityName} ({plan.lastActivity.daysSince} days ago)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Summit (Target) */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Mountain className="w-8 h-8 text-[#2F4731]" />
            <h2 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              The Summit
            </h2>
          </div>
          <Card className="border-2 border-[#2F4731] bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-8 text-center">
              <Award className="w-16 h-16 text-[#BD6809] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#2F4731] mb-2">Graduation Defense</h3>
              <div className="flex items-center justify-center gap-2 text-[#2F4731]/70">
                <Calendar className="w-5 h-5" />
                <span className="text-lg">Target: {new Date(plan.graduationDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <p className="text-sm text-[#2F4731]/60 mt-4 max-w-2xl mx-auto">
                Your graduation defense is not a test — it's a public demonstration of real-world competence. 
                Every credit you earn brings you closer to standing before your community and proving what you've built.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Expeditions (In Progress) */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-[#BD6809]" />
            <h2 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Active Expeditions
            </h2>
          </div>
          <p className="text-[#2F4731]/70 mb-4">
            These are the credits you're working on right now. Keep moving.
          </p>
          
          {plan.activeExpeditions.length === 0 ? (
            <Card className="border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <p className="text-amber-900 font-medium">
                  You have no active expeditions. The summit doesn't care if you're tired. What's your next move?
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {plan.activeExpeditions.map(credit => (
                <Card key={credit.id} className="border-2 border-[#BD6809] bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#2F4731] mb-1">{credit.title}</h3>
                        <p className="text-sm text-[#2F4731]/60">{credit.subject} • {credit.creditsNeeded} credits</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        IN PROGRESS
                      </span>
                    </div>
                    <p className="text-sm text-[#2F4731]/70 mb-4">{credit.description}</p>
                    
                    {credit.progress !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#2F4731]/60">Progress</span>
                          <span className="text-xs font-bold text-[#BD6809]">{credit.progress}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-[#BD6809] h-full transition-all"
                            style={{ width: `${credit.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {credit.dueDate && (
                      <div className="flex items-center gap-2 text-xs text-[#2F4731]/60">
                        <Calendar className="w-4 h-4" />
                        <span>Target: {new Date(credit.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* The Trail Ahead (Planned) */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              The Trail Ahead
            </h2>
          </div>
          <p className="text-[#2F4731]/70 mb-4">
            These are the credits Adeline has mapped for you based on your interests and graduation requirements. 
            Don't like the route? Change it.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {plan.trailAhead.map(credit => (
              <Card key={credit.id} className="border-2 border-[#E7DAC3] bg-white hover:border-indigo-300 transition-all">
                <CardContent className="p-5">
                  <div className="mb-3">
                    <h3 className="font-bold text-[#2F4731] mb-1">{credit.title}</h3>
                    <p className="text-xs text-[#2F4731]/60">{credit.subject} • {credit.creditsNeeded} credits</p>
                  </div>
                  <p className="text-sm text-[#2F4731]/70 mb-4">{credit.description}</p>
                  
                  <Button 
                    onClick={() => handleChangeRoute(credit)}
                    variant="outline"
                    size="sm"
                    className="w-full border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Change Route
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Change Route Modal */}
      {showChangeRoute && selectedCredit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full border-2 border-[#2F4731] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E7DAC3] flex items-center justify-between bg-[#2F4731] text-white">
              <div>
                <h3 className="text-xl font-bold">Change Your Route</h3>
                <p className="text-sm text-white/80 mt-1">Currently: {selectedCredit.title}</p>
              </div>
              <button 
                onClick={() => {
                  setShowChangeRoute(false);
                  setSelectedCredit(null);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Adeline:</strong> This is currently mapped as <strong>{selectedCredit.title}</strong> 
                  ({selectedCredit.subject}). How would you like to tackle this requirement instead?
                </p>
              </div>
              
              {messages.map((message, i) => (
                <div 
                  key={i}
                  className={`p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-50 border border-blue-200 ml-8' 
                      : 'bg-green-50 border border-green-200 mr-8'
                  }`}
                >
                  <p className="text-sm font-bold mb-1 text-[#2F4731]">
                    {message.role === 'user' ? 'You' : 'Adeline'}
                  </p>
                  <p className="text-sm text-[#2F4731]">{message.content}</p>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex items-center gap-2 text-[#2F4731]/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm italic">Adeline is thinking...</span>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 border-t border-[#E7DAC3] bg-gray-50">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Tell Adeline how you want to earn this credit..."
                  className="flex-1 px-4 py-3 border-2 border-[#E7DAC3] rounded-lg focus:border-[#BD6809] focus:outline-none"
                  disabled={isChatLoading}
                />
                <Button 
                  type="submit"
                  disabled={isChatLoading || !input.trim()}
                  className="bg-[#2F4731] hover:bg-[#BD6809]"
                >
                  Send
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
