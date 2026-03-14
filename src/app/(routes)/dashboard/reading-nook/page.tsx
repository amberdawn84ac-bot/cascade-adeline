"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen, Send, Book, RefreshCw, Volume2, Mic, MicOff } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { SubjectLessonsPanel } from '@/components/learning/SubjectLessonsPanel';

interface LivingBook {
  title: string;
  author: string;
  gutenbergId?: number;
  gutenbergUrl?: string;
  coverDescription: string;
  whyYouWillLoveIt: string;
}

interface ReadingEntry {
  id: string;
  date: string;
  bookTitle: string;
  minutes: number;
}

const COVER_COLORS = [
  { bg: '#4A3728', text: '#F5E6C8' },
  { bg: '#2F4731', text: '#E8F5E9' },
  { bg: '#6B2D3E', text: '#FCE4EC' },
  { bg: '#1A3A5C', text: '#E3F2FD' },
];

const BOOK_IT_GOAL = 5;
const BRAUMS_GOAL = 400;

export default function ReadingNookPage() {
  const [activeTab, setActiveTab] = useState<'bookshelf' | 'coach' | 'rewards'>('bookshelf');

  // Bookshelf
  const [books, setBooks] = useState<LivingBook[]>([]);
  const [isCurating, setIsCurating] = useState(false);
  const [bookshelfLoaded, setBookshelfLoaded] = useState(false);

  // Narration
  const [bookTitle, setBookTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [narrationStarted, setNarrationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rewards
  const [readingLog, setReadingLog] = useState<ReadingEntry[]>([]);
  const [logBookTitle, setLogBookTitle] = useState('');
  const [logMinutes, setLogMinutes] = useState('');

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/reading-nook/discuss',
    body: { bookTitle, chapter },
  });

  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<any>(null);

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 1.1;
    
    // Select a natural female voice (Adeline's voice)
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      (v.name.includes('Samantha') || // macOS natural female
       v.name.includes('Karen') ||    // macOS Australian female
       v.name.includes('Fiona') ||    // macOS Scottish female
       v.name.includes('Microsoft Zira') || // Windows female
       v.name.includes('Google US English Female') || // Chrome female
       v.name.includes('female')) && 
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    
    if (femaleVoice) {
      utt.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(utt);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript.trim()); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  const stopListening = () => { recRef.current?.stop(); setIsListening(false); };

  useEffect(() => {
    const saved = localStorage.getItem('adeline-reading-log');
    if (saved) setReadingLog(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (activeTab === 'bookshelf' && !bookshelfLoaded) loadBooks();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadBooks = async () => {
    setIsCurating(true);
    try {
      const res = await fetch('/api/reading-nook/curate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
        setBookshelfLoaded(true);
      }
    } catch (e) {
      console.error('Failed to curate books:', e);
    } finally {
      setIsCurating(false);
    }
  };

  const startNarration = () => {
    if (!bookTitle.trim()) return;
    const opener = `Excellent. You've been reading "${bookTitle}"${chapter ? ` — ${chapter}` : ''}. Tell me in your own words what happened, and what you thought of the main character's choices.`;
    setMessages([{ id: 'adeline-open', role: 'assistant', content: opener, parts: [{ type: 'text', text: opener }] }]);
    setNarrationStarted(true);
    setTimeout(() => speak(opener), 300);
  };

  const logReading = () => {
    if (!logBookTitle.trim() || !logMinutes.trim()) return;
    const entry: ReadingEntry = { id: Date.now().toString(), date: new Date().toLocaleDateString(), bookTitle: logBookTitle, minutes: parseInt(logMinutes) };
    const updated = [...readingLog, entry];
    setReadingLog(updated);
    localStorage.setItem('adeline-reading-log', JSON.stringify(updated));
    setLogBookTitle('');
    setLogMinutes('');
  };

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthEntries = readingLog.filter(e => new Date(e.date).getMonth() === currentMonthIndex);
  const uniqueBooks = [...new Set(monthEntries.map(e => e.bookTitle))];
  const totalMinutes = monthEntries.reduce((sum, e) => sum + e.minutes, 0);
  const bookItProgress = Math.min(uniqueBooks.length / BOOK_IT_GOAL, 1);
  const braamsProgress = Math.min(totalMinutes / BRAUMS_GOAL, 1);
  const bookItDone = uniqueBooks.length >= BOOK_IT_GOAL;
  const braamsDone = totalMinutes >= BRAUMS_GOAL;

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2]">
      {/* Header */}
      <div className="p-6 border-b border-amber-200 bg-amber-50/60 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8" /> The Reading Nook
          </h1>
          <p className="text-amber-700 text-sm mt-1 italic">Books that breathe. Stories that stay with you.</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-amber-200 bg-amber-50/40">
        {(['bookshelf', 'coach', 'rewards'] as const).map((tab) => {
          const labels = { bookshelf: 'My Bookshelf', coach: 'Reading Coach', rewards: 'Reading Rewards' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-amber-700 text-white' : 'text-amber-700/60 hover:bg-amber-100'}`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── MY BOOKSHELF ── */}
        {activeTab === 'bookshelf' && (
          <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Today's Reading Lessons from Learning Plan */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-800 mb-4">Today's Reading Lessons</h2>
              <SubjectLessonsPanel
                subject="Reading & Literature"
                keywords={['reading', 'literature', 'english', 'language arts', 'ela', 'writing', 'composition', 'grammar', 'creative writing', 'poetry', 'journalism', 'speech', 'communications', 'rhetoric', 'vocabulary', 'phonics']}
                accentColor="#b45309"
              />
            </div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-900">Your Living Books</h2>
                <p className="text-sm text-amber-700 italic mt-1">Hand-picked by Adeline for your exact interests and grade.</p>
              </div>
              <Button onClick={() => { setBookshelfLoaded(false); setBooks([]); loadBooks(); }} variant="ghost" disabled={isCurating} className="text-xs text-amber-700 uppercase tracking-widest gap-2">
                <RefreshCw className="w-3 h-3" /> New Picks
              </Button>
            </div>

            {isCurating ? (
              <div className="flex flex-col items-center py-24 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-amber-700 italic text-sm">Adeline is browsing the library for you…</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {books.map((book, i) => {
                  const color = COVER_COLORS[i % COVER_COLORS.length];
                  return (
                    <div key={i} className="flex flex-col rounded-xl overflow-hidden shadow-lg border border-amber-100 bg-white hover:shadow-xl transition-shadow">
                      <div className="h-44 flex items-end p-4 relative" style={{ backgroundColor: color.bg }}>
                        <Book className="absolute top-4 right-4 w-6 h-6 opacity-20" style={{ color: color.text }} />
                        <div>
                          <p className="font-bold text-base leading-tight" style={{ color: color.text }}>{book.title}</p>
                          <p className="text-xs mt-1 opacity-75" style={{ color: color.text }}>by {book.author}</p>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col gap-3">
                        <p className="text-xs text-gray-500 leading-relaxed italic">{book.coverDescription}</p>
                        
                        <div className="flex flex-col gap-2">
                          {book.gutenbergUrl && (
                            <a
                              href={book.gutenbergUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-center py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              Read Free (Gutenberg)
                            </a>
                          )}
                          <a
                            href={`https://openlibrary.org/search?q=${encodeURIComponent(book.title + ' ' + book.author)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-600 hover:bg-sky-700 text-white text-center py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            Find on Open Library
                          </a>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' read online free')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-amber-300 hover:bg-amber-50 text-amber-800 text-center py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            Search Online
                          </a>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-auto">
                          <p className="text-xs font-bold text-amber-800 mb-1">Why you&apos;ll love it</p>
                          <p className="text-xs text-amber-700 leading-relaxed">{book.whyYouWillLoveIt}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── READING COACH ── */}
        {activeTab === 'coach' && (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-1">Reading Coach</h2>
            <p className="text-sm text-amber-700 italic mb-6">Read aloud to Adeline. She&apos;ll listen and help you with real-time feedback.</p>

            {!narrationStarted ? (
              <Card className="border-2 border-amber-200">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-amber-800 block mb-1">What book are you reading?</label>
                    <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="e.g. Charlotte's Web" className="border-amber-200 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-amber-800 block mb-1">Chapter or section <span className="font-normal text-amber-600">(optional)</span></label>
                    <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Chapter 4 — In the Barn" className="border-amber-200 focus:border-amber-500" />
                  </div>
                  <Button onClick={startNarration} disabled={!bookTitle.trim()} className="w-full bg-amber-700 hover:bg-amber-800 text-white uppercase tracking-widest text-sm py-6">
                    Start Reading Coach
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col" style={{ height: 'calc(100vh - 22rem)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-bold text-amber-900">{bookTitle}</span>
                    {chapter && <span className="text-xs text-amber-500">— {chapter}</span>}
                  </div>
                  <button onClick={() => { setNarrationStarted(false); setMessages([]); setBookTitle(''); setChapter(''); }} className="text-xs text-amber-400 hover:text-amber-700 uppercase tracking-wider">
                    ← New Session
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-white rounded-xl border-2 border-amber-100 p-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-amber-700 text-white' : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Adeline</p>
                            <button onClick={() => speak(msg.content)} className="text-amber-400 hover:text-amber-600 ml-3" title="Read aloud">
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input value={input} onChange={handleInputChange} placeholder="Tell Adeline what happened…" disabled={isLoading} className="flex-1 border-amber-200 focus:border-amber-500" />
                  <button
                    type="button"
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    disabled={isLoading}
                    className={`px-3 rounded-xl border-2 transition-all ${isListening ? 'border-red-400 bg-red-50 text-red-500 animate-pulse' : 'border-amber-200 text-amber-500 hover:border-amber-400'}`}
                    title="Hold to speak"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <Button type="submit" disabled={isLoading} className="bg-amber-700 hover:bg-amber-800">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── READING REWARDS ── */}
        {activeTab === 'rewards' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-1">Reading Rewards</h2>
            <p className="text-sm text-amber-700 italic mb-6">Track your reading. Earn real-world prizes. <span className="font-semibold">{currentMonthName}</span></p>

            {/* Log Form */}
            <Card className="border-2 border-amber-200 mb-8">
              <CardContent className="p-5">
                <h3 className="font-bold text-amber-900 mb-3">Log Today&apos;s Reading</h3>
                <div className="flex gap-3 flex-wrap">
                  <Input value={logBookTitle} onChange={(e) => setLogBookTitle(e.target.value)} placeholder="Book title" className="flex-1 min-w-[180px] border-amber-200" />
                  <Input value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} type="number" min="1" placeholder="Minutes" className="w-32 border-amber-200" />
                  <Button onClick={logReading} disabled={!logBookTitle.trim() || !logMinutes.trim()} className="bg-amber-700 hover:bg-amber-800 text-white">
                    + Log It
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Punch Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">

              {/* Pizza Hut BOOK IT! */}
              <div className={`rounded-2xl p-6 border-4 transition-all ${bookItDone ? 'border-red-500 bg-red-50' : 'border-red-200 bg-white'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-2xl font-black text-red-700 uppercase tracking-tight leading-none">Pizza Hut</p>
                    <p className="text-base font-bold text-red-600 mt-0.5">BOOK IT! Program</p>
                    <p className="text-xs text-red-400 mt-1">Read {BOOK_IT_GOAL} different books → Free personal pan pizza</p>
                  </div>
                  <span className="text-4xl">🍕</span>
                </div>
                <div className="flex gap-2 mb-4">
                  {Array.from({ length: BOOK_IT_GOAL }).map((_, i) => (
                    <div key={i} className={`flex-1 h-12 rounded-lg flex items-center justify-center text-lg border-2 transition-all ${i < uniqueBooks.length ? 'bg-red-500 border-red-600 shadow-inner' : 'bg-gray-100 border-gray-200'}`}>
                      {i < uniqueBooks.length ? '⭐' : ''}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-red-700">{uniqueBooks.length} / {BOOK_IT_GOAL} books</span>
                  <span className="text-red-400">{Math.round(bookItProgress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${bookItProgress * 100}%` }} />
                </div>
                {bookItDone && (
                  <div className="mt-4 bg-red-100 border border-red-300 rounded-xl p-4 text-center">
                    <p className="text-2xl mb-1">🎉</p>
                    <p className="font-black text-red-700 text-lg">Goal Complete!</p>
                    <p className="text-sm text-red-600 mt-1">Parent: Visit <strong>bookitprogram.com</strong> to print the certificate and claim your free pizza!</p>
                  </div>
                )}
              </div>

              {/* Braum's Book Buddy */}
              <div className={`rounded-2xl p-6 border-4 transition-all ${braamsDone ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-white'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-2xl font-black text-blue-700 uppercase tracking-tight leading-none">Braum&apos;s</p>
                    <p className="text-base font-bold text-blue-600 mt-0.5">Book Buddy Program</p>
                    <p className="text-xs text-blue-400 mt-1">Read {BRAUMS_GOAL} minutes this month → Free ice cream</p>
                  </div>
                  <span className="text-4xl">🍦</span>
                </div>
                <div className="flex gap-2 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const threshold = (i + 1) * (BRAUMS_GOAL / 5);
                    const filled = totalMinutes >= threshold;
                    return (
                      <div key={i} className={`flex-1 h-12 rounded-lg flex items-center justify-center text-lg border-2 transition-all ${filled ? 'bg-blue-500 border-blue-600 shadow-inner' : 'bg-gray-100 border-gray-200'}`}>
                        {filled ? '⭐' : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-blue-700">{totalMinutes} / {BRAUMS_GOAL} min</span>
                  <span className="text-blue-400">{Math.round(braamsProgress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${braamsProgress * 100}%` }} />
                </div>
                {braamsDone && (
                  <div className="mt-4 bg-blue-100 border border-blue-300 rounded-xl p-4 text-center">
                    <p className="text-2xl mb-1">🎉</p>
                    <p className="font-black text-blue-700 text-lg">Goal Complete!</p>
                    <p className="text-sm text-blue-600 mt-1">Parent: Take this student to <strong>Braum&apos;s</strong> — they&apos;ve earned a free ice cream!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Log history */}
            {monthEntries.length > 0 && (
              <div>
                <h3 className="font-bold text-amber-900 mb-3">This Month&apos;s Reading Log</h3>
                <div className="space-y-2">
                  {[...monthEntries].reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span className="font-medium text-amber-900 text-sm">{entry.bookTitle}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-400">{entry.date}</span>
                        <span className="text-sm font-bold text-amber-700">{entry.minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

