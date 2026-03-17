'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { FileText, Scale, MapPin, Lightbulb, Send } from 'lucide-react';

interface HistoryEvidenceBoardProps {
  topic: string;
  standardNarrative: string;
  primaryEvidence: string;
  primarySourceCitation: string;
  localConnection: string;
  detectiveQuestion: string;
  onSubmitAnswer?: (answer: string) => void;
}

export function HistoryEvidenceBoard({
  topic,
  standardNarrative,
  primaryEvidence,
  primarySourceCitation,
  localConnection,
  detectiveQuestion,
  onSubmitAnswer,
}: HistoryEvidenceBoardProps) {
  const [detectiveAnswer, setDetectiveAnswer] = useState('');

  const handleSubmit = () => {
    if (onSubmitAnswer && detectiveAnswer.trim()) {
      onSubmitAnswer(detectiveAnswer);
      setDetectiveAnswer('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b-2 border-amber-800 pb-4">
        <h2 className="text-3xl font-bold text-amber-900 mb-2">📜 Evidence Board</h2>
        <h3 className="text-xl text-amber-700 italic">{topic}</h3>
        <p className="text-sm text-amber-600 mt-2">Investigating the gap between textbook narratives and primary source evidence</p>
      </div>

      {/* Split Screen: Standard Narrative vs Primary Evidence */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Standard Textbook Narrative */}
        <Card className="border-2 border-blue-300 bg-blue-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-blue-700" />
              <h4 className="text-lg font-bold text-blue-900 uppercase tracking-wide">
                Standard Textbook Version
              </h4>
            </div>
            <div className="bg-white rounded-lg p-5 border-2 border-blue-200">
              <p className="text-blue-900 leading-relaxed font-sans">
                {standardNarrative}
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-3 italic">
              This is what most history books say happened.
            </p>
          </CardContent>
        </Card>

        {/* Right: Primary Source Evidence */}
        <Card className="border-2 border-amber-400 bg-amber-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-6 h-6 text-amber-800" />
              <h4 className="text-lg font-bold text-amber-900 uppercase tracking-wide">
                Primary Source Evidence
              </h4>
            </div>
            <div className="bg-[#FFFEF5] rounded-lg p-5 border-2 border-amber-300 shadow-inner">
              <p className="text-amber-950 leading-relaxed font-serif whitespace-pre-line text-sm">
                {primaryEvidence}
              </p>
            </div>
            <p className="text-xs text-amber-700 mt-3 font-medium">
              📄 Source: {primarySourceCitation}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Oklahoma Local Connection */}
      <Card className="border-2 border-emerald-300 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-emerald-700" />
            <h4 className="text-lg font-bold text-emerald-900 uppercase tracking-wide">
              Oklahoma Connection
            </h4>
          </div>
          <div className="bg-white rounded-lg p-5 border-2 border-emerald-200">
            <p className="text-emerald-900 leading-relaxed">
              {localConnection}
            </p>
          </div>
          <p className="text-xs text-emerald-600 mt-3 italic">
            How this event impacted the land, laws, and people right here in Oklahoma.
          </p>
        </CardContent>
      </Card>

      {/* Detective Question & Answer */}
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-purple-700" />
            <h4 className="text-lg font-bold text-purple-900 uppercase tracking-wide">
              Detective Question
            </h4>
          </div>
          <div className="bg-white rounded-lg p-5 border-2 border-purple-200 mb-4">
            <p className="text-purple-900 font-semibold text-lg">
              {detectiveQuestion}
            </p>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-purple-800 uppercase tracking-wide">
              Your Investigation:
            </label>
            <textarea
              value={detectiveAnswer}
              onChange={(e) => setDetectiveAnswer(e.target.value)}
              placeholder="Compare the two narratives. What's different? What's missing? Whose perspective is centered in each version?"
              className="w-full min-h-[150px] p-4 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none resize-y text-purple-900 bg-white"
              rows={6}
            />
            <p className="text-xs text-purple-600 italic">
              {detectiveAnswer.split(/\s+/).filter(w => w.length > 0).length} words written
            </p>
            {onSubmitAnswer && (
              <Button
                onClick={handleSubmit}
                disabled={!detectiveAnswer.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Investigation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
