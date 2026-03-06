'use client';

import { useState } from 'react';
import { Gamepad2, Sparkles, Trophy, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Challenge {
  type: 'math' | 'logic' | 'pattern' | 'word';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
}

export default function ArcadePage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; creditsEarned: number; explanation: string } | null>(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [challengeType, setChallengeType] = useState<'math' | 'logic' | 'pattern' | 'word'>('math');

  const handleGenerateChallenge = async (type: 'math' | 'logic' | 'pattern' | 'word') => {
    setIsGenerating(true);
    setChallenge(null);
    setSelectedAnswer(null);
    setResult(null);
    setChallengeType(type);

    try {
      const response = await fetch('/api/arcade/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeType: type }),
      });
      if (!response.ok) throw new Error('Failed to generate challenge');
      const data = await response.json();
      setChallenge(data);
    } catch (error) {
      console.error('Error generating challenge:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!challenge || !selectedAnswer) return;
    setIsValidating(true);

    try {
      const response = await fetch('/api/arcade/validate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, userAnswer: selectedAnswer }),
      });
      if (!response.ok) throw new Error('Failed to validate answer');
      const data = await response.json();
      setResult(data);
      setTotalCredits(prev => prev + data.creditsEarned);
      if (data.isCorrect) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
    } catch (error) {
      console.error('Error validating answer:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleNextChallenge = () => {
    handleGenerateChallenge(challengeType);
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7]">
                <Gamepad2 size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  Brain Arcade
                </h1>
                <p className="text-[#2F4731]/70 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  Sharpen your mind with delightful puzzles
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#BD6809]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  {totalCredits.toFixed(2)}
                </div>
                <div className="text-xs text-[#2F4731]/60">Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#BD6809]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  {streak}
                </div>
                <div className="text-xs text-[#2F4731]/60">Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Type Selection */}
        {!challenge && !isGenerating && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'math' as const, label: 'Math Quest', emoji: '🔢', color: 'bg-blue-100 hover:bg-blue-200' },
              { type: 'logic' as const, label: 'Logic Riddle', emoji: '🧩', color: 'bg-purple-100 hover:bg-purple-200' },
              { type: 'pattern' as const, label: 'Pattern Hunt', emoji: '🎨', color: 'bg-green-100 hover:bg-green-200' },
              { type: 'word' as const, label: 'Word Puzzle', emoji: '📚', color: 'bg-amber-100 hover:bg-amber-200' },
            ].map(({ type, label, emoji, color }) => (
              <button
                key={type}
                onClick={() => handleGenerateChallenge(type)}
                className={`${color} p-6 rounded-2xl border-2 border-[#BD6809]/20 transition-all hover:shadow-lg`}
              >
                <div className="text-4xl mb-2">{emoji}</div>
                <div className="font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  {label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card className="border-2 border-[#BD6809]/20">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#BD6809]" />
              <span className="ml-3 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>Crafting your challenge...</span>
            </CardContent>
          </Card>
        )}

        {/* Challenge Display */}
        {challenge && !result && (
          <Card className="border-2 border-[#BD6809]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                    {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)} Challenge
                  </CardTitle>
                  <CardDescription>Difficulty: {challenge.difficulty}</CardDescription>
                </div>
                <Badge className="bg-[#2F4731] text-[#FFFEF7]">{challenge.subject}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-[#E7DAC3] p-6 rounded-xl">
                <p className="text-lg text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  {challenge.question}
                </p>
              </div>

              <div className="space-y-3">
                {challenge.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedAnswer === option
                        ? 'border-[#BD6809] bg-[#BD6809]/10'
                        : 'border-[#E7DAC3] hover:border-[#BD6809]/50'
                    }`}
                  >
                    <span className="font-semibold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || isValidating}
                className="w-full bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] py-6 text-lg"
                style={{ fontFamily: 'var(--font-kalam), cursive' }}
              >
                {isValidating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</>
                ) : (
                  <>Submit Answer <Sparkles className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result Display */}
        {result && (
          <Card className={`border-2 ${
            result.isCorrect ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'
          }`}>
            <CardContent className="py-8 space-y-4">
              <div className="text-center">
                {result.isCorrect ? (
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                ) : (
                  <XCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                )}
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  {result.isCorrect ? '🎉 Brilliant!' : '💡 Not quite, but great try!'}
                </h3>
                <p className="text-lg mb-4">
                  You earned <span className="font-bold text-[#BD6809]">{result.creditsEarned}</span> credits!
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-[#E7DAC3]">
                <h4 className="font-bold mb-2 text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                  Explanation:
                </h4>
                <p className="text-[#2F4731]/80">{result.explanation}</p>
              </div>

              <Button
                onClick={handleNextChallenge}
                className="w-full bg-[#2F4731] hover:bg-[#BD6809] text-[#FFFEF7] py-6 text-lg"
                style={{ fontFamily: 'var(--font-kalam), cursive' }}
              >
                Next Challenge <Trophy className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
