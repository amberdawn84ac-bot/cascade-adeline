"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { GraduationCap, Wrench, Building2, Shield, Loader2, Send, ChevronRight, BookOpen, Calendar, Plus, Trash2 } from 'lucide-react';
import TranscriptTab from '@/components/college-prep/TranscriptTab';

const ADELINE_SYSTEM_PROMPT = `You are Adeline, the student's relentless graduation coach. Your ONLY job in this room is to drive them toward a real, defensible graduation.

STRICT RULES — NEVER break these:
1. ALWAYS initiate. Never wait for the student to lead. Open every conversation with a hard, specific question about their goals, progress, or character.
2. Ask uncomfortable questions: "What have you actually built this month?", "What skill can you demonstrate right now?", "What would your portfolio show a potential employer or client today?"
3. Call out vagueness and piddling. If they give a vague answer, push harder: "That's not a plan, that's a wish. What is the next concrete step and when will it be done?"
4. Connect everything to the four pillars: Trade/Apprenticeship, Business, Graduation Defense, and External College Credits (CLEP/Dual Enrollment).
5. A graduation defense is not a test — it is a public demonstration of real-world competence. Hold them to that standard.
6. Be warm but relentless. You care about them deeply, which is exactly why you will not let them coast.
7. CLEP & DUAL ENROLLMENT RULE: You are an elite academic coach. You do NOT grant college credit yourself. Your job is to rigorously prepare the student to pass official CLEP exams or succeed in their external Dual Enrollment community college classes. Hold them to university-level standards. CLEP exams test 50th-percentile college-sophomore mastery — act accordingly.`;

type Tab = 'transcript' | 'trade' | 'business' | 'defense' | 'clep';

const CLEP_EXAMS = [
  { category: 'Composition & Literature', exams: ['College Composition', 'Analyzing and Interpreting Literature', 'American Literature', 'English Literature'] },
  { category: 'History & Social Sciences', exams: ['American Government', 'History of the United States I', 'History of the United States II', 'Western Civilization I', 'Western Civilization II', 'Introductory Psychology', 'Introductory Sociology', 'Human Growth and Development'] },
  { category: 'Sciences & Mathematics', exams: ['Biology', 'Chemistry', 'Natural Sciences', 'College Algebra', 'Pre-calculus', 'Calculus', 'College Mathematics'] },
  { category: 'Business', exams: ['Financial Accounting', 'Introductory Business Law', 'Principles of Management', 'Principles of Marketing', 'Information Systems'] },
];

interface DualEnrollmentClass {
  id: string;
  courseName: string;
  institution: string;
  credits: string;
  deadline: string;
  status: 'enrolled' | 'in-progress' | 'completed';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AdelineChat({ context }: { context: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initiate = async () => {
    if (hasOpened) return;
    setHasOpened(true);
    setIsLoading(true);
    try {
      const res = await fetch('/api/future-prep/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: ADELINE_SYSTEM_PROMPT,
          context,
          messages: [],
          initiating: true,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages([{ role: 'assistant', content: data.reply }]);
    } catch (e) {
      console.error('Adeline init error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/future-prep/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: ADELINE_SYSTEM_PROMPT,
          context,
          messages: next,
          initiating: false,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      console.error('Adeline send error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-2 border-blue-800 rounded-2xl overflow-hidden">
      <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest">Adeline — Graduation Coach</h3>
          <p className="text-blue-300 text-xs mt-0.5">She will not let you piddle.</p>
        </div>
        {!hasOpened && (
          <Button onClick={initiate} className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-4 py-2 h-auto">
            Start Session <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="h-72 overflow-y-auto bg-blue-950/5 p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-blue-900 text-white rounded-tl-sm'
                  : 'bg-blue-100 text-blue-900 rounded-tr-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-blue-900 text-white px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {hasOpened && (
        <div className="border-t border-blue-200 p-3 flex gap-2 bg-white">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Respond to Adeline..."
            className="resize-none border-blue-200 text-sm"
            rows={2}
          />
          <Button onClick={send} disabled={!input.trim() || isLoading}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function FuturePrepPage() {
  const [activeTab, setActiveTab] = useState<Tab>('transcript');

  const [selectedExam, setSelectedExam] = useState('');
  const [weeksTilExam, setWeeksTilExam] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('minimal');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [studyGuide, setStudyGuide] = useState('');
  const [guideExamName, setGuideExamName] = useState('');

  const [deClasses, setDeClasses] = useState<DualEnrollmentClass[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('de-classes') ?? '[]'); } catch { return []; }
  });
  const [newCourse, setNewCourse] = useState({ courseName: '', institution: '', credits: '', deadline: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const saveDeClasses = (updated: DualEnrollmentClass[]) => {
    setDeClasses(updated);
    if (typeof window !== 'undefined') localStorage.setItem('de-classes', JSON.stringify(updated));
  };

  const addDeClass = () => {
    if (!newCourse.courseName.trim()) return;
    const entry: DualEnrollmentClass = { ...newCourse, id: Date.now().toString(), status: 'enrolled' };
    saveDeClasses([...deClasses, entry]);
    setNewCourse({ courseName: '', institution: '', credits: '', deadline: '' });
    setShowAddForm(false);
  };

  const removeDeClass = (id: string) => saveDeClasses(deClasses.filter(c => c.id !== id));

  const cycleStatus = (id: string) => {
    const order: DualEnrollmentClass['status'][] = ['enrolled', 'in-progress', 'completed'];
    saveDeClasses(deClasses.map(c => c.id === id ? { ...c, status: order[(order.indexOf(c.status) + 1) % 3] } : c));
  };

  const generateGuide = async () => {
    if (!selectedExam) return;
    setIsGeneratingGuide(true);
    setStudyGuide('');
    setGuideExamName(selectedExam);
    try {
      const res = await fetch('/api/future-prep/clep-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName: selectedExam,
          weeksTilExam: weeksTilExam ? parseInt(weeksTilExam) : undefined,
          priorKnowledge,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStudyGuide(data.guide);
    } catch (e) {
      console.error('Guide error:', e);
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'transcript', label: 'Transcript', icon: GraduationCap },
    { id: 'clep', label: 'CLEP & Dual Enrollment', icon: BookOpen },
    { id: 'trade', label: 'Trade & Apprenticeship', icon: Wrench },
    { id: 'business', label: 'Business Incubation', icon: Building2 },
    { id: 'defense', label: 'Graduation Defense', icon: Shield },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F8F9FF]">
      {/* Header */}
      <div className="p-6 border-b border-blue-200 bg-blue-900 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8" /> Future Prep
        </h1>
        <p className="text-blue-300 text-sm mt-1 italic">Trade · Business · Graduation Defense — no coasting allowed.</p>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-blue-100 bg-white px-6 flex gap-1 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-800 text-blue-900'
                  : 'border-transparent text-gray-500 hover:text-blue-800'
              }`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">

        {/* Transcript */}
        {activeTab === 'transcript' && <TranscriptTab />}

        {/* CLEP & Dual Enrollment */}
        {activeTab === 'clep' && (
          <div className="space-y-8">
            {/* Header banner */}
            <Card className="border-2 border-amber-900 bg-amber-900 text-white">
              <CardContent className="p-5">
                <h2 className="text-lg font-black mb-1">⚡ Acceleration Engine</h2>
                <p className="text-amber-200 text-sm leading-relaxed">
                  CLEP and Dual Enrollment are the two fastest legal routes to college credit before graduation. Adeline does not award these credits — official test scores and community college transcripts do. This room is your war room for earning them.
                </p>
              </CardContent>
            </Card>

            {/* CLEP War Room */}
            <div>
              <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs mb-4">⚔ CLEP War Room</h3>
              <Card className="border-2 border-blue-100">
                <CardContent className="p-5 space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-2">Select CLEP Exam</label>
                      <select
                        value={selectedExam}
                        onChange={e => setSelectedExam(e.target.value)}
                        className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-900 bg-white focus:border-blue-400 outline-none"
                      >
                        <option value="">-- Choose an exam --</option>
                        {CLEP_EXAMS.map(group => (
                          <optgroup key={group.category} label={group.category}>
                            {group.exams.map(exam => (
                              <option key={exam} value={exam}>{exam}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-2">Weeks Until Exam</label>
                        <Input
                          type="number" min="1" max="52"
                          value={weeksTilExam}
                          onChange={e => setWeeksTilExam(e.target.value)}
                          placeholder="e.g. 8"
                          className="border-2 border-blue-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-2">Prior Knowledge</label>
                        <select
                          value={priorKnowledge}
                          onChange={e => setPriorKnowledge(e.target.value)}
                          className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-900 bg-white focus:border-blue-400 outline-none h-10"
                        >
                          <option value="minimal">Minimal</option>
                          <option value="some">Some background</option>
                          <option value="solid">Solid foundation</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={generateGuide}
                    disabled={!selectedExam || isGeneratingGuide}
                    className="bg-amber-900 hover:bg-amber-800 text-white font-black uppercase tracking-wider"
                  >
                    {isGeneratingGuide ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating War Room...</> : '⚔ Generate Adeline Study Guide'}
                  </Button>

                  {studyGuide && (
                    <div className="mt-2 border-t-2 border-blue-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black text-blue-900 text-sm">{guideExamName} — Study Guide</h4>
                        <span className="text-xs text-amber-700 font-bold uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">University Level</span>
                      </div>
                      <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-900 leading-relaxed whitespace-pre-wrap font-mono text-xs max-h-[480px] overflow-y-auto">
                        {studyGuide}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dual Enrollment Tracker */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs">🎓 Dual Enrollment Tracker</h3>
                <Button
                  onClick={() => setShowAddForm(v => !v)}
                  variant="outline"
                  className="border-2 border-blue-200 text-blue-900 text-xs font-bold h-8 px-3"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Class
                </Button>
              </div>

              {showAddForm && (
                <Card className="border-2 border-blue-200 mb-4">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-1">Course Name</label>
                        <Input value={newCourse.courseName} onChange={e => setNewCourse(p => ({ ...p, courseName: e.target.value }))} placeholder="College Algebra 101" className="border-2 border-blue-100 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-1">Institution</label>
                        <Input value={newCourse.institution} onChange={e => setNewCourse(p => ({ ...p, institution: e.target.value }))} placeholder="Pima Community College" className="border-2 border-blue-100 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-1">Credits</label>
                        <Input type="number" value={newCourse.credits} onChange={e => setNewCourse(p => ({ ...p, credits: e.target.value }))} placeholder="3" className="border-2 border-blue-100 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-1">Final Exam / End Date</label>
                        <Input type="date" value={newCourse.deadline} onChange={e => setNewCourse(p => ({ ...p, deadline: e.target.value }))} className="border-2 border-blue-100 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addDeClass} className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-black">Add Course</Button>
                      <Button onClick={() => setShowAddForm(false)} variant="ghost" className="text-xs">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {deClasses.length === 0 ? (
                <Card className="border-2 border-dashed border-blue-100">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-8 h-8 text-blue-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 italic">No dual enrollment classes tracked yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Add a community college class to start tracking deadlines and credits.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {deClasses.map(cls => {
                    const daysLeft = cls.deadline ? Math.ceil((new Date(cls.deadline).getTime() - Date.now()) / 86400000) : null;
                    const urgency = daysLeft !== null && daysLeft <= 14 ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-200';
                    const statusColors = { enrolled: 'bg-gray-100 text-gray-700', 'in-progress': 'bg-amber-100 text-amber-800', completed: 'bg-green-100 text-green-800' };
                    return (
                      <Card key={cls.id} className="border-2 border-blue-100">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-blue-900 text-sm">{cls.courseName}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusColors[cls.status]}`}>{cls.status}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{cls.institution}{cls.credits ? ` · ${cls.credits} credits` : ''}</p>
                          </div>
                          {daysLeft !== null && (
                            <span className={`text-xs font-black px-3 py-1 rounded-full border flex-shrink-0 ${urgency}`}>
                              {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today!' : 'Past'}
                            </span>
                          )}
                          <button onClick={() => cycleStatus(cls.id)} className="text-xs text-blue-500 hover:text-blue-800 flex-shrink-0 font-bold">↻</button>
                          <button onClick={() => removeDeClass(cls.id)} className="text-red-400 hover:text-red-700 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <AdelineChat context="The student is in the Acceleration Engine room. They are either preparing for a CLEP exam or tracking Dual Enrollment community college classes. Ask them which specific exam or course they are working on, what their score target is, and how many hours per week they are actually studying. Hold them to university-level standards." />
          </div>
        )}

        {/* Trade & Apprenticeship */}
        {activeTab === 'trade' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'Electrical', desc: 'IBEW apprenticeship — 4-5 years, ~$60k starting', tag: 'Union Trade' },
                { title: 'Plumbing', desc: 'UA Local programs — journeyman in 5 years', tag: 'Union Trade' },
                { title: 'Welding', desc: 'AWS certification + pipeline work — high demand', tag: 'Certification' },
                { title: 'Carpentry / Millwork', desc: 'Independent shop to union contractor pathway', tag: 'Trade' },
                { title: 'Farrier', desc: 'American Farrier Assoc — certification + apprenticeship', tag: 'Agricultural' },
                { title: 'HVAC/R', desc: 'EPA 608 cert + apprenticeship — $50–80k range', tag: 'Certification' },
              ].map((item, i) => (
                <Card key={i} className="border-2 border-blue-100 hover:border-blue-400 transition-all cursor-default">
                  <CardContent className="p-4">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-500">{item.tag}</span>
                    <h3 className="font-bold text-blue-900 mt-1">{item.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AdelineChat context="The student is exploring trade and apprenticeship pathways as a primary post-graduation route. Ask them which trade they are considering and what concrete steps they have taken toward it." />
          </div>
        )}

        {/* Business Incubation */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="border-2 border-blue-100">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs">LLC Formation Checklist</h3>
                  <ul className="space-y-2">
                    {[
                      'Choose a business name (check state registry)',
                      'File Articles of Organization with your state',
                      'Get an EIN from IRS (free at irs.gov)',
                      'Open a dedicated business checking account',
                      'Draft an Operating Agreement',
                      'Set up bookkeeping (Wave, QuickBooks, or ledger)',
                      'Determine sales tax obligations',
                      'Build a simple product/service price list',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">☐</span>{item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-100">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs">Business Model Canvas</h3>
                  {[
                    { label: 'Product / Service', hint: 'What are you selling? Walnut cutting boards? Eggs? Farrier services?' },
                    { label: 'Target Customer', hint: 'Who pays you? Local families, restaurants, horse owners?' },
                    { label: 'Revenue Stream', hint: 'Direct sales, farmers market, online, repeat contracts?' },
                    { label: 'Key Cost', hint: 'Materials, time, tools, marketing?' },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-wider">{f.label}</p>
                      <p className="text-xs text-gray-400 italic mb-1">{f.hint}</p>
                      <div className="h-8 border-b-2 border-blue-100" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <AdelineChat context="The student is working on building a real business as part of their graduation requirements. They may be starting a walnut woodworking shop, selling homestead products, or pursuing another venture. Ask them what their business idea is and what revenue they have generated so far." />
          </div>
        )}

        {/* Graduation Defense */}
        {activeTab === 'defense' && (
          <div className="space-y-6">
            <Card className="border-2 border-blue-900 bg-blue-900 text-white">
              <CardContent className="p-6">
                <h2 className="text-xl font-black mb-2">What Is a Graduation Defense?</h2>
                <p className="text-blue-200 text-sm leading-relaxed">
                  A graduation defense is not a test — it is a public demonstration of real-world competence. You present a portfolio of actual work, defend your choices, explain your failures, and demonstrate the skills you have built. Think of it as a job interview, a business pitch, and a personal testimony in one.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-5">
              <Card className="border-2 border-blue-100">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs">Portfolio Pillars</h3>
                  {[
                    { icon: '🛠', label: 'Skilled Work', desc: 'Document 3+ real projects with photos, measurements, and outcomes' },
                    { icon: '💰', label: 'Financial Literacy', desc: 'Show a budget, P&L, or business ledger you actually maintained' },
                    { icon: '🌱', label: 'Homestead Contribution', desc: 'Document your role in food production, livestock, or greenhouse' },
                    { icon: '📖', label: 'Reading & Writing', desc: '5+ book narrations, 2+ essays defending a position' },
                    { icon: '🤝', label: 'Character Evidence', desc: 'Letters of reference + a written character self-assessment' },
                    { icon: '🎯', label: 'Future Plan', desc: 'A written 1-year post-graduation plan with real milestones' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50">
                      <span className="text-2xl">{item.icon}</span>
                      <div><p className="font-bold text-blue-900 text-sm">{item.label}</p><p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p></div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs">Defense Day Format</h3>
                  <ol className="space-y-3">
                    {[
                      '10 min — Personal introduction and faith statement',
                      '15 min — Portfolio walkthrough: projects, work, evidence',
                      '10 min — Business/trade plan presentation',
                      '15 min — Q&A with panel (parents, mentors, community)',
                      '5 min — Closing statement: who are you and what will you do?',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-blue-900">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            <AdelineChat context="The student is preparing for their graduation defense — a public demonstration of real-world competence. Ask them what is currently IN their portfolio and what the weakest pillar is. Do not let them be vague." />
          </div>
        )}
      </div>
    </div>
  );
}

