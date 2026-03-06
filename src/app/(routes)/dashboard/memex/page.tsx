'use client';

import { useState, useEffect } from 'react';
import { Brain, Sparkles, Calendar, Tag, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Memory {
  id: string;
  content: string;
  importance: number;
  category: string;
  createdAt: Date;
  similarity: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  interest: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
  struggle: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  project: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  goal: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  family: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' },
  achievement: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800' },
  preference: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800' },
  unknown: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800' },
};

export default function MemexPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/memex/memories');
      if (response.ok) {
        const data = await response.json();
        setMemories(data);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMemories = selectedCategory
    ? memories.filter(m => m.category === selectedCategory)
    : memories;

  const categoryCounts = memories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getMemoryAge = (createdAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(createdAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7]">
              <Brain size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Your Memex
              </h1>
              <p className="text-[#2F4731]/70 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                A constellation of knowledge Adeline remembers about you
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl border-2 transition-all ${
              selectedCategory === null
                ? 'bg-[#2F4731] text-[#FFFEF7] border-[#2F4731]'
                : 'bg-white text-[#2F4731] border-[#E7DAC3] hover:border-[#BD6809]'
            }`}
            style={{ fontFamily: 'var(--font-kalam), cursive' }}
          >
            All Memories ({memories.length})
          </button>
          {Object.entries(categoryCounts).map(([category, count]) => {
            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.unknown;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl border-2 transition-all capitalize ${
                  selectedCategory === category
                    ? `${colors.bg} ${colors.text} border-current`
                    : `bg-white ${colors.text} ${colors.border} hover:${colors.bg}`
                }`}
                style={{ fontFamily: 'var(--font-kalam), cursive' }}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#BD6809]" />
            <span className="ml-3 text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
              Loading your memories...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && memories.length === 0 && (
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-16 h-16 text-[#BD6809] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Your Memory Constellation Awaits
              </h3>
              <p className="text-[#2F4731]/70" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                As you chat with Adeline, she'll remember important facts about you—your interests, goals, and journey. Those memories will appear here like stars in a constellation.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Memory Grid */}
        {!isLoading && filteredMemories.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((memory) => {
              const colors = CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.unknown;
              const importanceStars = Math.round(memory.importance * 5);
              
              return (
                <Card
                  key={memory.id}
                  className={`border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-all`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${colors.bg} ${colors.text} border ${colors.border} capitalize`}>
                        {memory.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Sparkles
                            key={i}
                            className={`w-3 h-3 ${
                              i < importanceStars ? 'text-[#BD6809] fill-[#BD6809]' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <CardDescription className={`${colors.text} text-base leading-relaxed`}>
                      {memory.content}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-[#2F4731]/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{getMemoryAge(memory.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{Math.round(memory.importance * 100)}% important</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-2 border-[#BD6809]/20 bg-white">
          <CardContent className="py-6">
            <h3 className="font-bold text-[#2F4731] mb-3" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
              How Memex Works
            </h3>
            <div className="space-y-2 text-sm text-[#2F4731]/80">
              <p>
                <strong>Episodic Memory:</strong> As you chat with Adeline, she extracts and remembers important facts about you—your interests, struggles, projects, and goals.
              </p>
              <p>
                <strong>Semantic Search:</strong> When you ask a new question, Adeline searches her memory to find relevant context from past conversations, making her responses more personal and continuous.
              </p>
              <p>
                <strong>Importance Weighting:</strong> Each memory has an importance score (shown as stars). More important memories are prioritized when Adeline recalls context.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
