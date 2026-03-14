'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, MessageCircle, Share2, Loader2, Sparkles, Award } from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'project' | 'highlight';
  title: string;
  description: string;
  imageUrl?: string;
  author: {
    name: string;
    avatarUrl?: string;
    gradeLevel?: string;
  };
  createdAt: string;
  metadata?: any;
}

export default function AgoraPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/agora/feed');
        if (res.ok) {
          const data = await res.json();
          
          // Transform projects and highlights into a unified feed
          const unifiedFeed: FeedItem[] = [
            ...(data.projects || []).map((p: any) => ({
              id: `proj-${p.id}`,
              type: 'project',
              title: p.activityName,
              description: `Completed a ${p.mappedSubject} project: ${p.metadata?.category || ''}`,
              imageUrl: p.metadata?.photoUrl,
              author: p.user || { name: 'Anonymous Student' },
              createdAt: p.createdAt,
              metadata: p.metadata
            })),
            ...(data.highlights || []).map((h: any) => ({
              id: `high-${h.id}`,
              type: 'highlight',
              title: `Insight in ${h.source}`,
              description: h.content,
              author: h.user || { name: 'Anonymous Student' },
              createdAt: h.createdAt
            }))
          ];

          // Sort by newest first
          unifiedFeed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setFeed(unifiedFeed);
        }
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
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
                Student Feed
              </h1>
              <p className="text-white/80 mt-1">See what your fellow students are building, learning, and discovering.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#BD6809] mx-auto mb-4" />
            <p className="text-[#2F4731]/60">Loading the latest projects...</p>
          </div>
        ) : feed.length === 0 ? (
          <Card className="border-2 border-dashed border-[#E7DAC3] bg-transparent">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-[#BD6809] mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-[#2F4731] mb-2">It's quiet here...</h3>
              <p className="text-[#2F4731]/70">Complete projects with photos to see them show up in The Agora!</p>
            </CardContent>
          </Card>
        ) : (
          feed.map((item) => (
            <Card key={item.id} className="border-2 border-[#E7DAC3] overflow-hidden hover:border-[#BD6809] transition-colors">
              {/* Author Header */}
              <div className="p-4 flex items-center gap-3 border-b border-[#E7DAC3] bg-white">
                <div className="w-10 h-10 rounded-full bg-[#2F4731] text-white flex items-center justify-center font-bold">
                  {item.author.avatarUrl ? (
                    <img src={item.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    item.author.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#2F4731]">{item.author.name}</p>
                  <p className="text-xs text-[#2F4731]/60">
                    {item.author.gradeLevel ? `Grade ${item.author.gradeLevel} • ` : ''}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {item.type === 'project' && (
                  <div className="ml-auto bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Project Completed
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 bg-[#FFFEF7]">
                <h3 className="text-xl font-bold text-[#2F4731] mb-2">{item.title}</h3>
                <p className="text-[#2F4731]/80 mb-4">{item.description}</p>
                
                {item.imageUrl && (
                  <div className="rounded-xl overflow-hidden border-2 border-[#E7DAC3] mb-4">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover max-h-[400px]" />
                  </div>
                )}

                {item.metadata?.yield && (
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm font-medium border border-green-200">
                    🎯 Yield: {item.metadata.yield}
                  </div>
                )}
              </div>

              {/* Interaction Bar */}
              <div className="px-5 py-3 bg-gray-50 border-t border-[#E7DAC3] flex gap-4">
                <button className="flex items-center gap-2 text-[#2F4731]/60 hover:text-red-500 transition-colors font-medium text-sm">
                  <Heart className="w-5 h-5" /> Like
                </button>
                <button className="flex items-center gap-2 text-[#2F4731]/60 hover:text-blue-500 transition-colors font-medium text-sm">
                  <MessageCircle className="w-5 h-5" /> Comment
                </button>
                <button className="flex items-center gap-2 text-[#2F4731]/60 hover:text-green-500 transition-colors font-medium text-sm ml-auto">
                  <Share2 className="w-5 h-5" /> Share
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
