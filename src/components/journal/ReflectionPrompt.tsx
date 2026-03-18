'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

const REFLECTION_PROMPTS = [
  "What was the hardest thing you had to figure out today?",
  "What is one thing you built or fixed today?",
  "Explain one new concept to me like I am five.",
  "What surprised you most about what you learned today?",
  "If you could teach today's lesson to someone else, what would you say?",
  "What question are you still thinking about?",
  "What did you do today that you're proud of?",
  "What mistake did you make today that taught you something?",
  "What would you do differently if you could do today over?",
  "What's one thing you want to investigate deeper tomorrow?",
];

interface ReflectionPromptProps {
  existingReflection?: {
    prompt: string;
    content: string;
    createdAt: Date;
  } | null;
}

export function ReflectionPrompt({ existingReflection }: ReflectionPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [optimisticReflection, setOptimisticReflection] = useState<{ prompt: string; content: string } | null>(null);

  useEffect(() => {
    if (!existingReflection) {
      const randomPrompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
      setPrompt(randomPrompt);
    }
  }, [existingReflection]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    setOptimisticReflection({ prompt, content });

    try {
      const response = await fetch('/api/journal/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save reflection');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      setOptimisticReflection(null);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show existing reflection or optimistic UI after submit
  if (existingReflection || optimisticReflection || submitted) {
    const reflection = existingReflection || optimisticReflection;
    if (!reflection) return null;

    return (
      <Card className="border-2 border-[#BD6809] bg-gradient-to-br from-[#FFF3E7] to-[#FFFEF7] shadow-lg mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📝</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#BD6809] uppercase tracking-wider mb-2">
                Today's Reflection
              </p>
              <blockquote className="text-[#2F4731] italic mb-4 border-l-4 border-[#BD6809] pl-4">
                "{reflection.prompt}"
              </blockquote>
              <div className="bg-white rounded-lg p-4 border border-[#E7DAC3]">
                <p className="text-[#2F4731] leading-relaxed whitespace-pre-wrap">
                  {reflection.content}
                </p>
              </div>
              {existingReflection && (
                <p className="text-xs text-[#2F4731]/50 mt-3">
                  Written {new Date(existingReflection.createdAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show prompt and textarea for new reflection
  return (
    <Card className="border-2 border-[#BD6809] bg-gradient-to-br from-[#FFF3E7] to-[#FFFEF7] shadow-lg mb-8">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">📝</div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-bold text-[#BD6809] uppercase tracking-wider mb-2">
                Adeline asks:
              </p>
              <blockquote className="text-lg text-[#2F4731] italic font-medium border-l-4 border-[#BD6809] pl-4">
                "{prompt}"
              </blockquote>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reflection here..."
              className="w-full min-h-[150px] p-4 border-2 border-[#E7DAC3] rounded-lg focus:border-[#BD6809] focus:outline-none resize-y text-[#2F4731] bg-white"
              rows={6}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-[#2F4731]/50">
                {content.split(/\s+/).filter(w => w.length > 0).length} words
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-[#BD6809] hover:bg-[#A05808] text-white font-bold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Entry
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
