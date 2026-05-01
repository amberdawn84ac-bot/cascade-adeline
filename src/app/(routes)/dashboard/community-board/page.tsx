'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Loader2, Sparkles, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  type: 'CONTEST' | 'GRANT' | 'APPRENTICESHIP' | 'SERVICE_PROJECT' | 'SCHOLARSHIP' | 'SPELLING_BEE' | 'COMPETITION' | 'EVENT';
  description: string;
  url?: string;
  deadline?: string;
  ageRange?: string;
  matchedInterests: string[];
  createdAt: string;
}

interface StudentProfile {
  age?: number;
  gradeLevel?: string;
  interests?: string[];
}

export default function CommunityBoardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({});

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/opportunities');
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    // Fetch student profile for the discover button
    fetch('/api/student/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setStudentProfile({
            age: data.age,
            gradeLevel: data.gradeLevel,
            interests: data.interests || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/competitions/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAge: studentProfile.age,
          studentGrade: studentProfile.gradeLevel,
          interests: studentProfile.interests,
        }),
      });
      if (res.ok) {
        // Refresh the opportunity list to show newly discovered items
        await fetchOpportunities();
      }
    } catch (error) {
      console.error('Failed to discover opportunities:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2F4731] to-[#1e3020] text-white p-8 border-b-4 border-[#BD6809]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <Users className="w-12 h-12 text-[#BD6809]" />
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Community Board
              </h1>
              <p className="text-white/80 mt-1">Discover real-world opportunities: contests, scholarships, grants, and events for students like you.</p>
            </div>
            <button
              onClick={handleDiscover}
              disabled={isDiscovering}
              className="flex items-center gap-2 px-4 py-2 bg-[#BD6809] hover:bg-[#A55808] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors shrink-0"
            >
              {isDiscovering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isDiscovering ? 'Searching...' : 'Find New'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#BD6809] mx-auto mb-4" />
            <p className="text-[#2F4731]/60">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <Card className="border-2 border-dashed border-[#E7DAC3] bg-transparent">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-[#BD6809] mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-[#2F4731] mb-2">No opportunities found</h3>
              <p className="text-[#2F4731]/70">Check back soon for new contests, scholarships, and events!</p>
            </CardContent>
          </Card>
        ) : (
          opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="border-2 border-[#E7DAC3] overflow-hidden hover:border-[#BD6809] transition-colors">
              {/* Opportunity Header */}
              <div className="p-4 flex items-center gap-3 border-b border-[#E7DAC3] bg-white">
                <div className="w-10 h-10 rounded-full bg-[#BD6809] text-white flex items-center justify-center font-bold">
                  {opportunity.title.includes('Reading') || opportunity.title.includes('BOOK IT') || opportunity.title.includes('Book Buddy') ? '📚' :
                   opportunity.type === 'SPELLING_BEE' ? '📝' :
                   opportunity.type === 'CONTEST' && opportunity.title.includes('Pizza') ? '🍕' :
                   opportunity.type === 'CONTEST' && opportunity.title.includes('Ice Cream') ? '🍦' :
                   opportunity.type === 'CONTEST' ? '🏆' :
                   opportunity.type === 'GRANT' ? '💰' :
                   opportunity.type === 'SCHOLARSHIP' ? '🎓' :
                   opportunity.type === 'APPRENTICESHIP' ? '🔧' :
                   opportunity.type === 'SERVICE_PROJECT' ? '🤝' :
                   opportunity.type === 'COMPETITION' ? '⚡' :
                   opportunity.type === 'EVENT' ? '📅' : '📚'}
                </div>
                <div>
                  <p className="font-bold text-[#2F4731]">{opportunity.title}</p>
                  <p className="text-xs text-[#2F4731]/60">
                    {opportunity.type.replace('_', ' ').toLowerCase()} • 
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    opportunity.title.includes('Reading') || opportunity.title.includes('BOOK IT') || opportunity.title.includes('Book Buddy')
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {opportunity.title.includes('Reading') || opportunity.title.includes('BOOK IT') || opportunity.title.includes('Book Buddy')
                      ? 'Reading Program'
                      : opportunity.type.replace('_', ' ')
                    }
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 bg-[#FFFEF7]">
                <p className="text-[#2F4731]/80 mb-4">{opportunity.description}</p>
                
                {/* Opportunity Details */}
                <div className="space-y-2 mb-4">
                  {opportunity.deadline && (
                    <div className="flex items-center gap-2 text-sm text-[#2F4731]/70">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {opportunity.ageRange && (
                    <div className="flex items-center gap-2 text-sm text-[#2F4731]/70">
                      <Users className="w-4 h-4" />
                      <span>Ages: {opportunity.ageRange}</span>
                    </div>
                  )}

                  {opportunity.matchedInterests && opportunity.matchedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {opportunity.matchedInterests.map((interest, index) => (
                        <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              {opportunity.url && (
                <div className="px-5 py-3 bg-gray-50 border-t border-[#E7DAC3]">
                  <a 
                    href={opportunity.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#BD6809] hover:text-[#2F4731] transition-colors font-medium text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Learn More & Apply
                  </a>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
