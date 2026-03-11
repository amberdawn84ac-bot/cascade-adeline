'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Loader2, Heart, Star, ChevronLeft, Check, X, Trophy, Keyboard, Code2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Typing Game Passages ─────────────────────────────────────────────────────
const PASSAGES = {
  easy: [
    "The cat sat on the warm mat by the fire. The dog curled up beside it. They slept all afternoon.",
    "She picked red apples from the old tree. They were sweet and crisp. She shared them with her friends.",
    "The little bird sang in the morning light. It flew from branch to branch. Its song filled the quiet yard.",
  ],
  medium: [
    "Homeschooling gives families the freedom to learn together at their own pace. Lessons connect to real life, and learning becomes an adventure rather than a chore.",
    "The barn owl hunts silently through the night. Its wide eyes detect movement in the dark. With razor-sharp talons, it swoops on its prey without a sound.",
    "A great garden begins with healthy soil. Compost adds nutrients and improves drainage. With patience and care, seeds grow into food that nourishes the whole family.",
  ],
  hard: [
    "The scientific method transforms curiosity into knowledge through careful observation, hypothesis formation, and controlled experimentation. Each discovery builds upon the last, expanding our understanding of the natural world.",
    "Classical literature challenges readers to examine the human condition across centuries. The works of Homer, Shakespeare, and Austen reveal timeless truths about courage, love, and redemption that remain relevant in every age.",
    "Entrepreneurship requires creativity, resilience, and analytical thinking working in harmony. Successful ventures begin not with capital, but with a compelling solution to a genuine problem experienced in daily life.",
  ],
};

// ─── Spelling Bee ─────────────────────────────────────────────────────────────
interface SpellingWord {
  word: string;
  definition: string;
  usedInSentence: string;
  partOfSpeech: string;
  origin: string;
  hint: string;
}

function SpellingBee({ onBack }: { onBack: () => void }) {
  const [word, setWord] = useState<SpellingWord | null>(null);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<'loading' | 'read' | 'type' | 'result'>('loading');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchWord = useCallback(async () => {
    setPhase('loading');
    setInput('');
    setCorrect(null);
    try {
      const res = await fetch('/api/arcade/spelling', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      setWord(await res.json());
      setPhase('read');
    } catch { setPhase('read'); }
  }, []);

  useEffect(() => { fetchWord(); }, [fetchWord]);

  const awardSpellingCredits = (w: string, isCorrect: boolean) => {
    fetch('/api/arcade/award-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'spelling', result: { word: w, correct: isCorrect } }),
    }).catch(console.error);
  };

  const handleSubmit = () => {
    if (!word || !input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === word.word.toLowerCase();
    setCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 10);
    else setLives(l => l - 1);
    setPhase('result');
    awardSpellingCredits(word.word, isCorrect);
  };

  const handleNext = () => { setRound(r => r + 1); fetchWord(); };

  if (lives <= 0) return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2F4731]/60 hover:text-[#2F4731]"><ChevronLeft className="w-4 h-4" /> Back</button>
      <Card className="border-2 border-[#E7DAC3] text-center py-10"><CardContent>
        <Trophy className="w-16 h-16 text-[#BD6809] mx-auto mb-4" />
        <h2 className="text-3xl font-black text-[#2F4731] mb-2">Game Over!</h2>
        <p className="text-[#2F4731]/70 mb-1">You reached round {round}</p>
        <p className="text-2xl font-black text-[#BD6809] mb-6">{score} points</p>
        <Button onClick={() => { setLives(3); setScore(0); setRound(1); fetchWord(); }} className="bg-[#2F4731] text-white px-8">Play Again</Button>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2F4731]/60 hover:text-[#2F4731]"><ChevronLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">{Array.from({ length: 3 }).map((_, i) => <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-200'}`} />)}</div>
          <div className="flex items-center gap-1 font-black text-[#BD6809] text-lg"><Star className="w-5 h-5 fill-[#BD6809]" /> {score}</div>
        </div>
      </div>
      <div className="bg-amber-50 rounded-2xl p-2 text-center text-xs font-bold uppercase tracking-widest text-amber-700">Spelling Bee · Round {round}</div>

      {phase === 'loading' && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}

      {phase === 'read' && word && (
        <Card className="border-2 border-amber-200"><CardContent className="p-6 space-y-4">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Part of Speech</p><p className="italic text-[#2F4731]/70 text-sm">{word.partOfSpeech}</p></div>
          <div className="bg-white rounded-xl p-4 border border-amber-100"><p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Definition</p><p className="text-[#2F4731]">{word.definition}</p></div>
          <div className="bg-white rounded-xl p-4 border border-amber-100"><p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Used in a Sentence</p><p className="text-[#2F4731] italic">"{word.usedInSentence}"</p></div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-sm text-amber-800">💡 <strong>Origin:</strong> {word.origin}</div>
          <Button onClick={() => { setPhase('type'); setTimeout(() => inputRef.current?.focus(), 100); }} className="w-full bg-amber-500 hover:bg-amber-600 text-white text-lg py-6 rounded-2xl">I&apos;m Ready to Spell It!</Button>
        </CardContent></Card>
      )}

      {phase === 'type' && (
        <Card className="border-2 border-amber-200"><CardContent className="p-6 space-y-4 text-center">
          <p className="text-[#2F4731]/70">Type the spelling of the word you just studied:</p>
          <p className="text-xs text-[#2F4731]/50 italic">{word?.definition}</p>
          <div className="flex gap-2">
            <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Type the word..." className="text-lg text-center font-mono border-2 border-amber-300 focus:border-amber-500" autoComplete="off" autoCapitalize="none" />
            <Button onClick={handleSubmit} disabled={!input.trim()} className="bg-amber-500 hover:bg-amber-600 text-white px-6">Submit</Button>
          </div>
          <button onClick={() => setPhase('read')} className="text-xs text-amber-600 hover:underline">← Review the word again</button>
        </CardContent></Card>
      )}

      {phase === 'result' && word && (
        <Card className={`border-2 ${correct ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}><CardContent className="p-6 text-center space-y-4">
          {correct ? <Check className="w-16 h-16 text-green-500 mx-auto" /> : <X className="w-16 h-16 text-red-400 mx-auto" />}
          <h3 className={`text-2xl font-black ${correct ? 'text-green-700' : 'text-red-600'}`}>{correct ? 'Correct! +10 pts' : 'Not quite...'}</h3>
          <p className="text-3xl font-black text-[#2F4731] tracking-widest">{word.word}</p>
          <div className="bg-white rounded-xl p-3 border text-sm text-[#2F4731]/70">{word.hint}</div>
          <Button onClick={handleNext} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 py-3 rounded-2xl">Next Word →</Button>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Typing Racer ─────────────────────────────────────────────────────────────
function TypingRacer({ onBack }: { onBack: () => void }) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [now, setNow] = useState(Date.now());
  const gameRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameActive && !finished) { timerRef.current = setInterval(() => setNow(Date.now()), 500); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameActive, finished]);

  useEffect(() => {
    if (!finished || !startTime || !finishTimeRef.current) return;
    const elapsedMin = (finishTimeRef.current - startTime) / 60000;
    const typedSnap = typed;
    const passageSnap = passage;
    const finalWpm = elapsedMin > 0.01 ? Math.round((typedSnap.length / 5) / elapsedMin) : 0;
    const correct = typedSnap.split('').filter((c, i) => c === passageSnap[i]).length;
    const finalAcc = typedSnap.length > 0 ? Math.round((correct / typedSnap.length) * 100) : 100;
    fetch('/api/arcade/award-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'typing', result: { difficulty, wpm: finalWpm, accuracy: finalAcc } }),
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const startGame = () => {
    const pool = PASSAGES[difficulty];
    setPassage(pool[Math.floor(Math.random() * pool.length)]);
    setTyped(''); setStartTime(null); setFinished(false); setGameActive(true);
    setTimeout(() => gameRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (finished || !passage) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    if (!startTime) setStartTime(Date.now());
    if (e.key === 'Backspace') {
      setTyped(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setTyped(prev => {
        const next = prev + e.key;
        if (next.length === passage.length) { finishTimeRef.current = Date.now(); setFinished(true); }
        return next;
      });
    }
  };

  const elapsed = startTime ? (now - startTime) / 60000 : 0;
  const wpm = elapsed > 0.01 ? Math.round((typed.length / 5) / elapsed) : 0;
  const correctChars = typed.split('').filter((c, i) => c === passage[i]).length;
  const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2F4731]/60 hover:text-[#2F4731]"><ChevronLeft className="w-4 h-4" /> Back</button>
        {gameActive && !finished && <div className="flex gap-6 text-sm font-bold"><span className="text-blue-600">{wpm} WPM</span><span className={accuracy < 90 ? 'text-red-500' : 'text-green-600'}>{accuracy}% acc</span></div>}
      </div>
      <div className="bg-blue-50 rounded-2xl p-2 text-center text-xs font-bold uppercase tracking-widest text-blue-700">Typing Racer</div>

      {!gameActive ? (
        <Card className="border-2 border-blue-100"><CardContent className="p-8 text-center space-y-6">
          <Keyboard className="w-16 h-16 text-blue-400 mx-auto" />
          <h3 className="text-2xl font-black text-[#2F4731]">Choose Your Challenge</h3>
          <div className="flex justify-center gap-3">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`px-5 py-2 rounded-xl border-2 font-bold capitalize transition-all ${difficulty === d ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-200 text-blue-600 hover:border-blue-400'}`}>{d}</button>
            ))}
          </div>
          <p className="text-[#2F4731]/60 text-sm">{difficulty === 'easy' ? 'Short simple sentences · Great for beginners' : difficulty === 'medium' ? 'Longer paragraphs · For developing typists' : 'Advanced vocabulary · Challenge yourself'}</p>
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-10 py-6 rounded-2xl">Start Typing!</Button>
        </CardContent></Card>
      ) : finished ? (
        <Card className="border-2 border-green-300 bg-green-50"><CardContent className="p-8 text-center space-y-4">
          <Trophy className="w-16 h-16 text-[#BD6809] mx-auto" />
          <h2 className="text-3xl font-black text-[#2F4731]">Finished!</h2>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-white rounded-xl p-4 border border-green-200"><p className="text-xs uppercase tracking-widest text-green-600 font-bold mb-1">Speed</p><p className="text-3xl font-black text-[#2F4731]">{wpm}</p><p className="text-xs text-[#2F4731]/50">words/min</p></div>
            <div className="bg-white rounded-xl p-4 border border-green-200"><p className="text-xs uppercase tracking-widest text-green-600 font-bold mb-1">Accuracy</p><p className="text-3xl font-black text-[#2F4731]">{accuracy}%</p><p className="text-xs text-[#2F4731]/50">correct</p></div>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button onClick={startGame} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 rounded-2xl">Try Again</Button>
            <Button onClick={() => setGameActive(false)} variant="outline" className="border-2 border-[#E7DAC3] px-6 rounded-2xl">Change Level</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Card className="border-2 border-blue-100"><CardContent className="p-6 space-y-4">
          <p className="text-xs text-[#2F4731]/50 text-center">Click the text box and start typing</p>
          <div ref={gameRef} tabIndex={0} onKeyDown={handleKeyDown} className="p-5 bg-[#FFFEF7] border-2 border-blue-200 rounded-xl font-mono text-lg leading-relaxed focus:outline-none focus:border-blue-400 cursor-text select-none">
            {passage.split('').map((char, i) => {
              let cls = 'text-gray-300';
              if (i < typed.length) cls = typed[i] === char ? 'text-[#2F4731]' : 'text-red-500 bg-red-100 rounded';
              else if (i === typed.length) cls = 'border-b-2 border-blue-500 text-gray-500';
              return <span key={i} className={cls}>{char}</span>;
            })}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(typed.length / passage.length) * 100}%` }} /></div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Code Quest ───────────────────────────────────────────────────────────────
interface CodeChallenge {
  concept: string; language: string; codeSnippet: string; question: string;
  options: string[]; correctAnswer: string; explanation: string; difficulty: string;
}

function CodeQuest({ onBack }: { onBack: () => void }) {
  const [language, setLanguage] = useState('Python');
  const [challenge, setChallenge] = useState<CodeChallenge | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const TOTAL = 5;

  const fetchChallenge = async (lang = language) => {
    setIsLoading(true); setSelected(null); setSubmitted(false);
    try {
      const res = await fetch('/api/arcade/coding-quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: lang }) });
      if (!res.ok) throw new Error('Failed');
      setChallenge(await res.json());
    } catch { console.error('Failed to load challenge'); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = () => {
    if (!selected || !challenge) return;
    const isCorrect = selected === challenge.correctAnswer;
    if (isCorrect) setScore(s => s + 20);
    setSubmitted(true);
    fetch('/api/arcade/award-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'coding', result: { correct: isCorrect, concept: challenge.concept, language: challenge.language } }),
    }).catch(console.error);
  };

  const handleNext = () => { if (round >= TOTAL) { setGameOver(true); return; } setRound(r => r + 1); fetchChallenge(); };
  const handleRestart = () => { setScore(0); setRound(1); setGameOver(false); fetchChallenge(); };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2F4731]/60 hover:text-[#2F4731]"><ChevronLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-[#2F4731]/50">Round {round}/{TOTAL}</span>
          <span className="text-[#BD6809] flex items-center gap-1"><Star className="w-4 h-4 fill-[#BD6809]" /> {score}</span>
        </div>
      </div>
      <div className="bg-violet-50 rounded-2xl p-2 text-center text-xs font-bold uppercase tracking-widest text-violet-700">Code Quest · {language}</div>

      {!challenge && !isLoading && !gameOver && (
        <Card className="border-2 border-violet-100"><CardContent className="p-8 text-center space-y-6">
          <Code2 className="w-16 h-16 text-violet-400 mx-auto" />
          <h3 className="text-2xl font-black text-[#2F4731]">Choose Your Language</h3>
          <div className="flex justify-center gap-3 flex-wrap">
            {['Python', 'JavaScript', 'HTML/CSS'].map(l => (
              <button key={l} onClick={() => setLanguage(l)} className={`px-5 py-2 rounded-xl border-2 font-bold transition-all ${language === l ? 'bg-violet-600 text-white border-violet-600' : 'border-violet-200 text-violet-600 hover:border-violet-400'}`}>{l}</button>
            ))}
          </div>
          <Button onClick={() => fetchChallenge(language)} className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-10 py-6 rounded-2xl">Start Code Quest!</Button>
        </CardContent></Card>
      )}

      {gameOver && (
        <Card className="border-2 border-violet-200 bg-violet-50"><CardContent className="p-8 text-center space-y-4">
          <Trophy className="w-16 h-16 text-[#BD6809] mx-auto" />
          <h2 className="text-3xl font-black text-[#2F4731]">Quest Complete!</h2>
          <div className="text-5xl font-black text-[#BD6809]">{score}/{TOTAL * 20}</div>
          <Button onClick={handleRestart} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 rounded-2xl">Play Again</Button>
        </CardContent></Card>
      )}

      {isLoading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}

      {challenge && !isLoading && !gameOver && (
        <div className="space-y-4">
          <Card className="border-2 border-violet-100"><CardContent className="p-0 overflow-hidden rounded-xl">
            <div className="bg-[#1e1e1e] px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" /><div className="w-3 h-3 bg-yellow-500 rounded-full" /><div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-400 ml-2 font-mono">{challenge.language} · {challenge.concept}</span>
            </div>
            <pre className="bg-[#1e1e1e] p-5 font-mono text-sm text-[#9cdcfe] overflow-x-auto whitespace-pre-wrap">{challenge.codeSnippet}</pre>
          </CardContent></Card>

          <Card className="border-2 border-violet-100"><CardContent className="p-5 space-y-4">
            <p className="font-bold text-[#2F4731] text-lg">{challenge.question}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenge.options.map((opt, i) => {
                let cls = 'border-2 border-violet-200 text-[#2F4731] hover:border-violet-400 hover:bg-violet-50';
                if (submitted) {
                  if (opt === challenge.correctAnswer) cls = 'border-2 border-green-400 bg-green-50 text-green-700';
                  else if (opt === selected) cls = 'border-2 border-red-300 bg-red-50 text-red-600';
                  else cls = 'border-2 border-gray-200 text-gray-400';
                } else if (opt === selected) cls = 'border-2 border-violet-500 bg-violet-50 text-violet-700';
                return <button key={i} onClick={() => !submitted && setSelected(opt)} className={`p-3 rounded-xl text-left text-sm font-mono transition-all ${cls}`}><span className="font-bold text-xs mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>{opt}</button>;
              })}
            </div>
            {!submitted ? (
              <Button onClick={handleSubmit} disabled={!selected} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl">Submit Answer</Button>
            ) : (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border-2 ${selected === challenge.correctAnswer ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  <p className="font-bold mb-1">{selected === challenge.correctAnswer ? '✓ Correct! +20 pts' : '✗ Not quite...'}</p>
                  <p className="text-sm">{challenge.explanation}</p>
                </div>
                <Button onClick={handleNext} className="w-full bg-[#2F4731] hover:bg-[#BD6809] text-white py-3 rounded-2xl">{round >= TOTAL ? 'See Results →' : 'Next Challenge →'}</Button>
              </div>
            )}
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}

// ─── Game Hub ─────────────────────────────────────────────────────────────────

export default function ArcadePage() {
  const [activeGame, setActiveGame] = useState<null | 'spelling' | 'typing' | 'coding'>(null);

  const games = [
    { id: 'spelling' as const, emoji: '🐝', title: 'Spelling Bee', desc: 'Study a word — then spell it from memory. Hearts and streaks keep it exciting.', color: 'border-amber-200 hover:border-amber-400', btn: 'bg-amber-500 hover:bg-amber-600' },
    { id: 'typing' as const, emoji: '⌨️', title: 'Typing Racer', desc: 'Type passages as fast and accurately as you can. Track your WPM and accuracy live.', color: 'border-blue-200 hover:border-blue-400', btn: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'coding' as const, emoji: '💻', title: 'Code Quest', desc: 'Read real code and figure out what it does. A quiz game for future programmers.', color: 'border-violet-200 hover:border-violet-400', btn: 'bg-violet-500 hover:bg-violet-600' },
  ];

  if (activeGame === 'spelling') return <div className="p-6 min-h-screen bg-[#FFFEF7]"><SpellingBee onBack={() => setActiveGame(null)} /></div>;
  if (activeGame === 'typing') return <div className="p-6 min-h-screen bg-[#FFFEF7]"><TypingRacer onBack={() => setActiveGame(null)} /></div>;
  if (activeGame === 'coding') return <div className="p-6 min-h-screen bg-[#FFFEF7]"><CodeQuest onBack={() => setActiveGame(null)} /></div>;

  return (
    <div className="flex flex-col min-h-full bg-[#FFFEF7]">
      <div className="p-6 border-b border-[#E7DAC3] bg-[#E7DAC3]/40">
        <h1 className="text-3xl font-bold text-[#2F4731] flex items-center gap-3">
          <Gamepad2 className="w-8 h-8" /> The Arcade
        </h1>
        <p className="text-[#2F4731]/60 text-sm mt-1 italic">Learn by playing. Choose a game to begin.</p>
      </div>
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-6">
          {games.map(g => (
            <Card key={g.id} className={`border-2 transition-all cursor-pointer hover:shadow-lg ${g.color}`} onClick={() => setActiveGame(g.id)}>
              <CardContent className="p-6 space-y-4">
                <div className="text-5xl">{g.emoji}</div>
                <div>
                  <h2 className="text-xl font-black text-[#2F4731]">{g.title}</h2>
                  <p className="text-sm text-[#2F4731]/60 mt-1 leading-relaxed">{g.desc}</p>
                </div>
                <Button className={`w-full text-white rounded-2xl ${g.btn}`}>Play Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


