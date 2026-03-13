'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen, Languages, History, AlertCircle, Search } from 'lucide-react';

interface TextualAnalysis {
  passage: string;
  reference: string;
  originalHebrew?: string;
  originalGreek?: string;
  literalTranslation: string;
  culturalContext: string;
  originalNames: {
    modern: string;
    original: string;
    meaning: string;
  }[];
  textualVariants?: {
    manuscript: string;
    variant: string;
    explanation: string;
  }[];
  historicalChanges?: {
    change: string;
    whenByWhom: string;
    why: string;
  }[];
  deeperMeaning: string;
}

export default function BibleStudyPage() {
  const [reference, setReference] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TextualAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!reference.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/bible-study/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      if (!res.ok) throw new Error('Failed to analyze');
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error('Bible study error:', e);
      alert('Failed to analyze passage. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2F4731] to-[#1e3020] text-white p-8 border-b-4 border-[#BD6809]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <BookOpen className="w-12 h-12 text-[#BD6809]" />
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Deep Scripture Study
              </h1>
              <p className="text-white/80 mt-1">Original languages. Historical context. Textual truth.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Search Section */}
        <Card className="border-2 border-[#2F4731]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-[#2F4731] mb-4 flex items-center gap-2">
              <Search className="w-6 h-6" />
              Enter a Passage
            </h2>
            <p className="text-sm text-[#2F4731]/70 mb-4">
              Enter any Bible reference (e.g., "John 3:16", "Genesis 1:1-3", "Psalm 23") and Adeline will analyze the original Hebrew or Greek text, show you what traditional translations might miss, and reveal any historical changes to the text.
            </p>
            <div className="flex gap-3">
              <Input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="e.g., John 3:16, Genesis 1:1, Matthew 5:1-12"
                className="flex-1 border-2 border-[#E7DAC3] focus:border-[#BD6809]"
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !reference.trim()}
                className="bg-[#2F4731] hover:bg-[#BD6809] px-8"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Passage Display */}
            <Card className="border-2 border-[#BD6809] bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#BD6809]">
                    {analysis.reference}
                  </h3>
                  <BookOpen className="w-5 h-5 text-[#BD6809]" />
                </div>
                <p className="text-lg text-[#2F4731] leading-relaxed italic">
                  "{analysis.passage}"
                </p>
              </CardContent>
            </Card>

            {/* Original Text */}
            {(analysis.originalHebrew || analysis.originalGreek) && (
              <Card className="border-2 border-indigo-200 bg-indigo-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    Original Text
                  </h3>
                  {analysis.originalHebrew && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-indigo-700 mb-1">HEBREW:</p>
                      <p className="text-2xl text-indigo-900 font-serif mb-2" dir="rtl">
                        {analysis.originalHebrew}
                      </p>
                    </div>
                  )}
                  {analysis.originalGreek && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-indigo-700 mb-1">GREEK:</p>
                      <p className="text-2xl text-indigo-900 font-serif mb-2">
                        {analysis.originalGreek}
                      </p>
                    </div>
                  )}
                  <div className="bg-white p-4 rounded border border-indigo-200">
                    <p className="text-xs font-bold text-indigo-700 mb-1">LITERAL TRANSLATION:</p>
                    <p className="text-indigo-900 leading-relaxed">{analysis.literalTranslation}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Original Names */}
            {analysis.originalNames && analysis.originalNames.length > 0 && (
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Original Names & Meanings
                  </h3>
                  <div className="space-y-3">
                    {analysis.originalNames.map((name, i) => (
                      <div key={i} className="bg-white p-4 rounded border border-purple-200">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm text-purple-600 line-through">{name.modern}</span>
                          <span className="text-lg font-bold text-purple-900">{name.original}</span>
                        </div>
                        <p className="text-sm text-purple-800 italic">{name.meaning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cultural Context */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historical & Cultural Context
                </h3>
                <p className="text-green-900 leading-relaxed">{analysis.culturalContext}</p>
              </CardContent>
            </Card>

            {/* Textual Variants */}
            {analysis.textualVariants && analysis.textualVariants.length > 0 && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Manuscript Variations
                  </h3>
                  <p className="text-sm text-orange-800 mb-4">
                    Different ancient manuscripts contain slight variations. Here's what scholars have found:
                  </p>
                  <div className="space-y-3">
                    {analysis.textualVariants.map((variant, i) => (
                      <div key={i} className="bg-white p-4 rounded border border-orange-200">
                        <p className="text-xs font-bold text-orange-700 mb-1">{variant.manuscript}</p>
                        <p className="text-sm text-orange-900 mb-2 italic">"{variant.variant}"</p>
                        <p className="text-sm text-orange-800">{variant.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historical Changes */}
            {analysis.historicalChanges && analysis.historicalChanges.length > 0 && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    How This Text Has Been Changed
                  </h3>
                  <p className="text-sm text-red-800 mb-4">
                    Throughout history, translators and copyists have made changes. Here's what happened:
                  </p>
                  <div className="space-y-3">
                    {analysis.historicalChanges.map((change, i) => (
                      <div key={i} className="bg-white p-4 rounded border border-red-200">
                        <p className="text-sm font-bold text-red-900 mb-2">{change.change}</p>
                        <p className="text-xs text-red-700 mb-1">
                          <strong>When & By Whom:</strong> {change.whenByWhom}
                        </p>
                        <p className="text-xs text-red-700">
                          <strong>Why:</strong> {change.why}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deeper Meaning */}
            <Card className="border-2 border-[#2F4731] bg-gradient-to-br from-[#2F4731] to-[#1e3020] text-white">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  What You Might Miss
                </h3>
                <p className="leading-relaxed">{analysis.deeperMeaning}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Card */}
        {!analysis && !isAnalyzing && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-blue-900 mb-3">What This Tool Does</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Original Languages:</strong> See the actual Hebrew or Greek text, not just English translations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Literal Translation:</strong> Word-for-word translation showing what the original actually says</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Original Names:</strong> Uses YHWH, Yeshua, etc. instead of anglicized versions, with meanings explained</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Cultural Context:</strong> Understand what this meant to the original audience in their time and place</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Manuscript Variations:</strong> See where different ancient manuscripts differ and why</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Historical Changes:</strong> Learn when, how, and why translators changed the text over time</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
