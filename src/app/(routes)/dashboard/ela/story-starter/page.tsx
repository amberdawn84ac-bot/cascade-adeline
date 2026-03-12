'use client';

import { useState } from 'react';
import { PenTool, Loader2, Sparkles, HandHeart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface StoryStarter {
  title: string;
  opening: string;
  characterSketch: string;
  plotHook: string;
  writingTip: string;
  purposeAndAudience?: {
    intendedReader: string;
    serviceGoal: string;
    publicationTarget: string;
  };
}

export default function StoryStarterPage() {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('adventure');
  const [story, setStory] = useState<StoryStarter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const GENRES = ['adventure', 'mystery', 'fantasy', 'realistic', 'historical', 'science-fiction'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStory(null);
    try {
      const res = await fetch('/api/ela/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre }),
      });
      if (!res.ok) throw new Error('Failed');
      setStory(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-xl text-rose-700">
            <PenTool size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-rose-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Story Starter</h1>
            <p className="text-rose-800/70">Write stories that serve others. Adeline will help you find your audience and purpose.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-rose-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-rose-700 mb-2">Story Idea</label>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. A girl who discovers a secret garden"
            className="border-rose-200 focus:border-rose-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-rose-700 mb-2">Genre</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  genre === g 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
        >
          {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Story Starter</>}
        </Button>
      </div>

      {story && (
        <div className="bg-white rounded-[2rem] p-8 border-2 border-rose-200 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-rose-900 mb-2">{story.title}</h2>
            <Badge className="bg-rose-600 text-white">{genre}</Badge>
          </div>

          <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
            <h3 className="font-bold text-rose-800 mb-3 text-sm uppercase tracking-wider">Opening</h3>
            <p className="text-rose-900 leading-relaxed italic">{story.opening}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-2 text-xs uppercase tracking-wider">Character</h4>
              <p className="text-purple-900 text-sm">{story.characterSketch}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2 text-xs uppercase tracking-wider">Plot Hook</h4>
              <p className="text-blue-900 text-sm">{story.plotHook}</p>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Writing Tip
            </h4>
            <p className="text-amber-900 text-sm">{story.writingTip}</p>
          </div>

          {/* Purpose & Audience Section */}
          {story.purposeAndAudience && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
              <h4 className="font-bold text-green-900 mb-4 text-base flex items-center gap-2">
                <HandHeart className="w-5 h-5" />
                Your Story's Purpose
              </h4>
              <div className="space-y-4">
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">📖 Who Will Read This:</p>
                  <p className="text-sm text-green-900">{story.purposeAndAudience.intendedReader}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">💚 What It Gives Them:</p>
                  <p className="text-sm text-green-900">{story.purposeAndAudience.serviceGoal}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">📰 Where To Publish:</p>
                  <p className="text-sm text-green-900">{story.purposeAndAudience.publicationTarget}</p>
                </div>
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <p className="text-xs font-bold text-amber-800 mb-2">💡 Remember:</p>
                  <p className="text-xs text-amber-900 italic">Writing is a gift to others. Keep your reader in mind as you write. How will this story serve them?</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t-2 border-rose-100 pt-6 text-center">
            <p className="text-rose-700 italic mb-4">Use this starter to write your story in a notebook or document. Remember your reader and purpose!</p>
            <Button
              onClick={() => {
                const fullStarter = `${story.title}\n\n${story.opening}\n\nCHARACTER: ${story.characterSketch}\n\nPLOT: ${story.plotHook}\n\nWRITING TIP: ${story.writingTip}${story.purposeAndAudience ? `\n\nWRITING FOR: ${story.purposeAndAudience.intendedReader}\nPURPOSE: ${story.purposeAndAudience.serviceGoal}\nPUBLISH AT: ${story.purposeAndAudience.publicationTarget}` : ''}`;
                navigator.clipboard.writeText(fullStarter);
                alert('Story starter copied! Now write it to serve your reader.');
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              📋 Copy Story Starter
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/ela" className="text-sm text-rose-600 hover:underline">← Back to ELA Hub</Link>
      </div>
    </div>
  );
}
