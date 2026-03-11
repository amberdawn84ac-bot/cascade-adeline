'use client';

import { useState, useRef, useEffect } from 'react';
import { Gamepad2, Loader2, Send, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #111; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; color: #eee; font-family: monospace; }
    canvas { border: 2px solid #444; background: #000; }
    p { margin-top: 12px; font-size: 13px; opacity: 0.6; }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="400" height="300"></canvas>
  <p>Ask Adeline to build a game above!</p>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#555';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Your game will appear here', 200, 150);
  </script>
</body>
</html>`;

export default function GameDesignPage() {
  const [currentCode, setCurrentCode] = useState(DEFAULT_CODE);
  const [instruction, setInstruction] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ approved: boolean; feedback: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = currentCode;
    }
  }, [currentCode]);

  const handleBuild = async () => {
    if (!instruction.trim()) return;
    setIsBuilding(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/arcade/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, currentCode }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCurrentCode(data.code);
      setFeedback(data.explanation);
      setInstruction('');
      setReviewResult(null);
      setSaveSuccess(false);
    } catch (e) {
      setFeedback('Sorry, I had trouble processing that. Please try again!');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleReview = async () => {
    setIsReviewing(true);
    setReviewResult(null);
    try {
      const res = await fetch('/api/arcade/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setReviewResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/arcade/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode, title: 'My Game', type: 'game' }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-violet-50 rounded-[2rem] p-6 border border-violet-100 flex items-center gap-4">
        <div className="p-3 bg-violet-100 rounded-xl text-violet-700">
          <Gamepad2 size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-violet-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            The Automaton Arcade — Game Lab
          </h1>
          <p className="text-violet-700/70 text-sm">Tell Adeline what to build. Watch it come to life.</p>
        </div>
      </div>

      {/* Split-Pane Editor */}
      <div className="grid md:grid-cols-2 gap-4 min-h-[520px]">
        {/* Left: Code + Chat */}
        <div className="flex flex-col rounded-[1.5rem] border-2 border-violet-100 overflow-hidden bg-white">
          {/* Code Area */}
          <div className="flex-1 p-3 bg-[#1e1e1e] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Blueprint (HTML/JS)</span>
              <span className="text-[10px] text-violet-400 italic">Adeline is watching...</span>
            </div>
            <textarea
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="flex-1 w-full font-mono text-xs bg-[#1e1e1e] text-[#9cdcfe] p-2 outline-none resize-none rounded"
              spellCheck={false}
              rows={18}
            />
          </div>

          {/* Adeline Input */}
          <div className="p-4 bg-violet-50 border-t border-violet-100 space-y-3">
            {feedback && (
              <div className="p-3 bg-white border-l-4 border-violet-400 text-sm text-slate-700 rounded-r-lg italic">
                <span className="font-bold text-violet-700 not-italic">Adeline: </span>{feedback}
              </div>
            )}
            {reviewResult && (
              <div className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${reviewResult.approved ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                {reviewResult.approved ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span><strong>{reviewResult.approved ? 'Approved!' : 'Revision Needed:'}</strong> {reviewResult.feedback}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuild()}
                placeholder='Ask Adeline: "Make a pong game", "Add a score counter"...'
                disabled={isBuilding}
                className="flex-1 text-sm"
              />
              <Button onClick={handleBuild} disabled={isBuilding || !instruction.trim()} className="bg-violet-600 hover:bg-violet-700 px-3">
                {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReview} disabled={isReviewing || isBuilding} variant="outline" className="flex-1 text-xs border-violet-200 text-violet-700 hover:bg-violet-50">
                {isReviewing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Reviewing...</> : '🔍 Submit for Review'}
              </Button>
              {reviewResult?.approved && (
                <Button onClick={handleSave} disabled={isSaving || saveSuccess} className="flex-1 text-xs bg-[#2F4731] hover:bg-[#BD6809]">
                  {isSaving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Saving...</> : saveSuccess ? '✨ Saved!' : '🌿 Mint to Portfolio'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex flex-col rounded-[1.5rem] border-2 border-slate-200 overflow-hidden bg-[#111]">
          <div className="bg-[#222] px-4 py-2 text-xs text-slate-400 border-b border-[#333] font-mono">
            ▶ Simulation Window
          </div>
          <iframe
            ref={iframeRef}
            title="Game Preview"
            className="flex-1 w-full border-none bg-white"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}

