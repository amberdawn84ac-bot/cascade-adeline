'use client';

import { useState } from 'react';
import { VisualMathManipulative, MathVariable } from '@/components/math/VisualMathManipulative';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

export default function VisualMathPage() {
  const [challenge, setChallenge] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('area and perimeter');

  const generateChallenge = async () => {
    setIsGenerating(true);
    setChallenge(null);

    try {
      const response = await fetch('/api/math/visual-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let partialChallenge: any = {};

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const jsonStr = line.slice(2);
                const data = JSON.parse(jsonStr);
                partialChallenge = { ...partialChallenge, ...data };
                setChallenge({ ...partialChallenge });
              } catch (e) {
                // Ignore parse errors for partial data
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating challenge:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-[#2F4731] mb-6">
          <CardHeader className="bg-gradient-to-r from-[#2F4731] to-[#2F7A54] text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              Visual Math Manipulatives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[#2F4731] mb-4 leading-relaxed">
              Learn math by <strong>seeing</strong> and <strong>manipulating</strong> it! 
              Use the sliders to adjust variables and watch the math happen in real-time.
            </p>

            <div className="flex gap-3 items-center mb-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a math topic (e.g., 'fractions', 'area')"
                className="flex-1 px-4 py-2 border-2 border-[#E7DAC3] rounded-lg focus:border-[#BD6809] focus:outline-none"
                disabled={isGenerating}
              />
              <Button
                onClick={generateChallenge}
                disabled={isGenerating}
                className="bg-[#BD6809] hover:bg-[#A05707] text-white font-bold px-6 py-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Challenge
                  </>
                )}
              </Button>
            </div>

            {challenge && !isGenerating && (
              <Button
                onClick={generateChallenge}
                variant="outline"
                className="w-full border-2 border-[#2F4731] text-[#2F4731] hover:bg-[#2F4731] hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Challenge
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Visual Math Challenge */}
        {challenge && challenge.wordProblem && (
          <VisualMathManipulative
            wordProblem={challenge.wordProblem}
            formula={challenge.formula || ''}
            variables={challenge.variables || []}
            targetAnswer={challenge.targetAnswer || 0}
            problemType={challenge.problemType || 'generic'}
            onCorrect={() => {
              console.log('Correct answer found!');
            }}
          />
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-[#BD6809] animate-spin mx-auto mb-4" />
              <p className="text-[#2F4731] font-semibold">
                Adeline is crafting your visual math challenge...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Demo Examples */}
        {!challenge && !isGenerating && (
          <div className="space-y-6">
            <Card className="border-2 border-[#E7DAC3]">
              <CardHeader>
                <CardTitle className="text-lg text-[#2F4731]">Example: Area Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <VisualMathManipulative
                  wordProblem="A rectangular garden needs to be fenced. If the width is 8 feet and the length is 12 feet, what is the area of the garden?"
                  formula="width × height"
                  variables={[
                    { name: 'width', min: 1, max: 20, value: 5, label: 'Width (feet)' },
                    { name: 'height', min: 1, max: 20, value: 5, label: 'Length (feet)' },
                  ]}
                  targetAnswer={96}
                  problemType="area"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-[#E7DAC3]">
              <CardHeader>
                <CardTitle className="text-lg text-[#2F4731]">Example: Fraction Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <VisualMathManipulative
                  wordProblem="You have a pizza cut into 8 slices. If you eat 3 slices, what fraction of the pizza did you eat?"
                  formula="numerator / denominator"
                  variables={[
                    { name: 'numerator', min: 0, max: 8, value: 1, label: 'Slices Eaten' },
                    { name: 'denominator', min: 1, max: 12, value: 4, label: 'Total Slices' },
                  ]}
                  targetAnswer={0.375}
                  problemType="fraction"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-[#E7DAC3]">
              <CardHeader>
                <CardTitle className="text-lg text-[#2F4731]">Example: Division Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <VisualMathManipulative
                  wordProblem="You have 24 cookies to share equally among your friends. If you want to give each friend 4 cookies, how many friends can you share with?"
                  formula="dividend / divisor"
                  variables={[
                    { name: 'dividend', min: 1, max: 30, value: 20, label: 'Total Cookies' },
                    { name: 'divisor', min: 1, max: 10, value: 3, label: 'Cookies per Friend' },
                  ]}
                  targetAnswer={6}
                  problemType="division"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
