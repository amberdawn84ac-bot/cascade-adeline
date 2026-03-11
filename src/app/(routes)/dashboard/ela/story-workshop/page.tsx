'use client';

import { useState } from 'react';
import { PenTool, Sparkles, Loader2, BookOpen, TrendingUp, Award, Heart, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StoryPrompt {
  genre: string;
  setting: string;
  character: string;
  conflict: string;
  twist: string;
  wordCountTarget: number;
  inspirationalQuote: string;
  characterFocus: string;
  communityImpact: string;
}

interface StoryAnalysis {
  overallScore: number;
  strengths: string[];
  areasForGrowth: string[];
  grammarScore: number;
  creativityScore: number;
  narrativeScore: number;
  vocabularyScore: number;
  encouragement: string;
  nextSteps: string;
}

interface AnalysisResult {
  analysis: StoryAnalysis;
  creditsEarned: number;
  wordCount: number;
}

const THEMES = ['any', 'adventure', 'mystery', 'fantasy', 'friendship', 'courage', 'discovery'];

export default function StoryWorkshopPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>('any');
  const [prompt, setPrompt] = useState<StoryPrompt | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  const [studentStory, setStudentStory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const wordCount = studentStory.trim().split(/\s+/).filter(w => w.length > 0).length;
  const progressPercent = prompt ? Math.min(100, (wordCount / prompt.wordCountTarget) * 100) : 0;

  const handleGeneratePrompt = async (theme: string) => {
    setIsGeneratingPrompt(true);
    setPrompt(null);
    setStudentStory('');
    setAnalysisResult(null);
    setSelectedTheme(theme);

    try {
      const response = await fetch('/api/story/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      if (!response.ok) throw new Error('Failed to generate prompt');
      const data = await response.json();
      setPrompt(data);
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSubmitStory = async () => {
    if (!prompt || !studentStory.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/story/analyze-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, studentStory }),
      });
      if (!response.ok) throw new Error('Failed to analyze story');
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error('Error analyzing story:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewStory = () => {
    setPrompt(null);
    setStudentStory('');
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7]">
              <PenTool size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Story Workshop
              </h1>
              <p className="text-[#2F4731]/70 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Craft tales that come alive on the page
              </p>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        {!prompt && !isGeneratingPrompt && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
              Choose Your Story Theme
            </h2>
            <div className="grid md:grid-cols-4 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleGeneratePrompt(theme)}
                  className="p-4 rounded-2xl border-2 border-[#BD6809]/20 bg-white hover:bg-[#E7DAC3] transition-all hover:shadow-lg"
                >
                  <div className="font-bold text-[#2F4731] capitalize" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                    {theme === 'any' ? '✨ Surprise Me' : `📖 ${theme}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Prompt */}
        {isGeneratingPrompt && (
          <Card className="border-2 border-[#BD6809]/20">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#BD6809]" />
              <span className="ml-3 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>Crafting your story prompt...</span>
            </CardContent>
          </Card>
        )}

        {/* Story Prompt Display */}
        {prompt && !analysisResult && (
          <Card className="border-2 border-[#BD6809]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  Your Writing Prompt
                </CardTitle>
                <Badge className="bg-[#2F4731] text-[#FFFEF7]">{prompt.genre}</Badge>
              </div>
              <CardDescription className="italic text-[#2F4731]/60" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                &ldquo;{prompt.inspirationalQuote}&rdquo;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#E7DAC3] p-4 rounded-xl">
                  <h4 className="font-bold text-[#2F4731] mb-2 text-sm">Setting</h4>
                  <p className="text-[#2F4731]/80 text-sm">{prompt.setting}</p>
                </div>
                <div className="bg-[#E7DAC3] p-4 rounded-xl">
                  <h4 className="font-bold text-[#2F4731] mb-2 text-sm">Character</h4>
                  <p className="text-[#2F4731]/80 text-sm">{prompt.character}</p>
                </div>
              </div>

              <div className="bg-[#E7DAC3] p-4 rounded-xl">
                <h4 className="font-bold text-[#2F4731] mb-2 text-sm">Conflict</h4>
                <p className="text-[#2F4731]/80 text-sm">{prompt.conflict}</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                <h4 className="font-bold text-amber-800 mb-2 text-sm">✨ Plot Twist</h4>
                <p className="text-amber-700 text-sm">{prompt.twist}</p>
              </div>

              {/* Character Focus & Community Impact */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900 text-sm">Character Focus</h4>
                  </div>
                  <p className="text-purple-800 text-sm">{prompt.characterFocus}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <HandHeart className="h-5 w-5 text-green-600" />
                    <h4 className="font-bold text-green-900 text-sm">Community Impact</h4>
                  </div>
                  <p className="text-green-800 text-sm">{prompt.communityImpact}</p>
                </div>
              </div>

              {/* Writing Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                    Write Your Story
                  </h3>
                  <div className="text-sm text-[#2F4731]/60">
                    {wordCount} / {prompt.wordCountTarget} words
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <Textarea
                  value={studentStory}
                  onChange={(e) => setStudentStory(e.target.value)}
                  placeholder="Once upon a time..."
                  className="min-h-[300px] text-base leading-relaxed border-2 border-[#E7DAC3] focus:border-[#BD6809]"
                  style={{ fontFamily: 'var(--font-kalam), cursive' }}
                />
              </div>

              <Button
                onClick={handleSubmitStory}
                disabled={!studentStory.trim() || isAnalyzing}
                className="w-full bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] py-6 text-lg"
                style={{ fontFamily: 'var(--font-kalam), cursive' }}
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adeline is reading...</>
                ) : (
                  <>Submit for Feedback <Sparkles className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="border-2 border-green-500 bg-green-50">
            <CardContent className="py-8 space-y-6">
              <div className="text-center">
                <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  🎉 Story Complete!
                </h3>
                <p className="text-lg mb-2">
                  You earned <span className="font-bold text-[#BD6809]">{analysisResult.creditsEarned.toFixed(2)}</span> credits!
                </p>
                <p className="text-sm text-green-700">({analysisResult.wordCount} words written)</p>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall', score: analysisResult.analysis.overallScore },
                  { label: 'Grammar', score: analysisResult.analysis.grammarScore },
                  { label: 'Creativity', score: analysisResult.analysis.creativityScore },
                  { label: 'Narrative', score: analysisResult.analysis.narrativeScore },
                ].map(({ label, score }) => (
                  <div key={label} className="bg-white p-4 rounded-xl border-2 border-[#E7DAC3] text-center">
                    <div className="text-2xl font-bold text-[#BD6809]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                      {score}
                    </div>
                    <div className="text-xs text-[#2F4731]/60">{label}</div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              <div className="bg-white p-6 rounded-xl border-2 border-[#E7DAC3]">
                <h4 className="font-bold mb-3 text-[#2F4731] flex items-center gap-2" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  <TrendingUp className="w-5 h-5" /> What You Did Brilliantly
                </h4>
                <ul className="space-y-2">
                  {analysisResult.analysis.strengths.map((strength, i) => (
                    <li key={i} className="text-[#2F4731]/80 flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Growth */}
              <div className="bg-white p-6 rounded-xl border-2 border-[#E7DAC3]">
                <h4 className="font-bold mb-3 text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  💡 Ways to Grow
                </h4>
                <ul className="space-y-2">
                  {analysisResult.analysis.areasForGrowth.map((area, i) => (
                    <li key={i} className="text-[#2F4731]/80 flex items-start gap-2">
                      <span className="text-amber-600">→</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Encouragement */}
              <div className="bg-[#E7DAC3] p-6 rounded-xl">
                <p className="text-[#2F4731] italic" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  &ldquo;{analysisResult.analysis.encouragement}&rdquo;
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-white p-6 rounded-xl border-2 border-[#E7DAC3]">
                <h4 className="font-bold mb-2 text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  📝 Next Steps
                </h4>
                <p className="text-[#2F4731]/80">{analysisResult.analysis.nextSteps}</p>
              </div>

              <Button
                onClick={handleNewStory}
                className="w-full bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] py-6 text-lg"
                style={{ fontFamily: 'var(--font-kalam), cursive' }}
              >
                Write Another Story <BookOpen className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

