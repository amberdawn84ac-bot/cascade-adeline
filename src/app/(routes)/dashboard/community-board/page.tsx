'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, MessageCircle, Share2, Loader2, Sparkles, Award, Calendar, ExternalLink, MapPin, DollarSign } from 'lucide-react';

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

export default function CommunityBoardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    fetchOpportunities();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2F4731] to-[#1e3020] text-white p-8 border-b-4 border-[#BD6809]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <Users className="w-12 h-12 text-[#BD6809]" />
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Community Board
              </h1>
              <p className="text-white/80 mt-1">Discover real-world opportunities: contests, scholarships, grants, and events for students like you.</p>
            </div>
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
                  {opportunity.type === 'SPELLING_BEE' && '📝'}
                  {opportunity.type === 'CONTEST' && '🏆'}
                  {opportunity.type === 'GRANT' && '💰'}
                  {opportunity.type === 'SCHOLARSHIP' && '🎓'}
                  {opportunity.type === 'APPRENTICESHIP' && '🔧'}
                  {opportunity.type === 'SERVICE_PROJECT' && '🤝'}
                  {opportunity.type === 'COMPETITION' && '⚡'}
                  {opportunity.type === 'EVENT' && '📅'}
                </div>
                <div>
                  <p className="font-bold text-[#2F4731]">{opportunity.title}</p>
                  <p className="text-xs text-[#2F4731]/60">
                    {opportunity.type.replace('_', ' ').toLowerCase()} • 
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                    {opportunity.type.replace('_', ' ')}
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
