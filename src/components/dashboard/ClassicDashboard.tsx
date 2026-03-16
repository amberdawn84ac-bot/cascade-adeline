'use client';

import { useState } from 'react';
import { BookOpen, Calculator, Beaker, Globe, Printer, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClassicLesson {
  subject: string;
  title: string;
  gradeLevel: string;
  objectives: string[];
  lessonContent: string;
  keyTerms: { term: string; definition: string }[];
  worksheet: {
    instructions: string;
    questions: {
      number: number;
      type: 'multiple-choice' | 'fill-in-blank' | 'short-answer';
      question: string;
      options?: string[];
      answer?: string;
    }[];
  };
}

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Calculator, color: 'bg-blue-500', borderColor: 'border-blue-200', hoverColor: 'hover:border-blue-400' },
  { id: 'science', name: 'Science', icon: Beaker, color: 'bg-green-500', borderColor: 'border-green-200', hoverColor: 'hover:border-green-400' },
  { id: 'ela', name: 'Language Arts', icon: BookOpen, color: 'bg-rose-500', borderColor: 'border-rose-200', hoverColor: 'hover:border-rose-400' },
  { id: 'history', name: 'History', icon: Globe, color: 'bg-indigo-500', borderColor: 'border-indigo-200', hoverColor: 'hover:border-indigo-400' },
];

export function ClassicDashboard() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [lesson, setLesson] = useState<ClassicLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLesson = async (subjectId: string) => {
    setActiveSubject(subjectId);
    setLesson(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/classic/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subjectId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setLesson(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lesson');
    } finally {
      setLoading(false);
    }
  };

  const printWorksheet = () => {
    if (!lesson) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${lesson.subject} Worksheet - ${lesson.title}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; }
            }
            body { font-family: 'Times New Roman', serif; max-width: 8.5in; margin: 0 auto; padding: 20px; }
            h1 { font-size: 18pt; text-align: center; margin-bottom: 5px; }
            h2 { font-size: 14pt; text-align: center; margin-top: 0; margin-bottom: 20px; color: #555; }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .name-line { margin: 10px 0; }
            .name-line span { display: inline-block; width: 150px; }
            .name-line .line { border-bottom: 1px solid #000; display: inline-block; width: 300px; }
            .instructions { margin: 20px 0; padding: 10px; background: #f5f5f5; border: 1px solid #ccc; }
            .question { margin: 20px 0; page-break-inside: avoid; }
            .question-number { font-weight: bold; margin-bottom: 5px; }
            .question-text { margin-bottom: 10px; line-height: 1.6; }
            .options { margin-left: 20px; }
            .option { margin: 5px 0; }
            .answer-line { border-bottom: 1px solid #000; display: inline-block; min-width: 400px; margin: 10px 0; }
            .answer-space { margin: 10px 0 30px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${lesson.subject}: ${lesson.title}</h1>
            <h2>Grade ${lesson.gradeLevel}</h2>
            <div class="name-line">
              <span>Name:</span>
              <span class="line"></span>
            </div>
            <div class="name-line">
              <span>Date:</span>
              <span class="line"></span>
            </div>
          </div>
          
          <div class="instructions">
            <strong>Instructions:</strong> ${lesson.worksheet.instructions}
          </div>

          ${lesson.worksheet.questions.map(q => `
            <div class="question">
              <div class="question-number">${q.number}.</div>
              <div class="question-text">${q.question}</div>
              ${q.type === 'multiple-choice' && q.options ? `
                <div class="options">
                  ${q.options.map((opt, i) => `
                    <div class="option">
                      <input type="radio" name="q${q.number}" id="q${q.number}_${i}">
                      <label for="q${q.number}_${i}">${String.fromCharCode(65 + i)}. ${opt}</label>
                    </div>
                  `).join('')}
                </div>
              ` : q.type === 'fill-in-blank' ? `
                <div class="answer-space">
                  Answer: <span class="answer-line"></span>
                </div>
              ` : `
                <div class="answer-space">
                  <div class="answer-line"></div>
                  <div class="answer-line"></div>
                  <div class="answer-line"></div>
                </div>
              `}
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Classic Lessons
          </h1>
          <p className="text-[#2F4731]/70 text-lg">
            Traditional, structured lessons with printable worksheets
          </p>
        </div>

        {/* Subject Selection Grid */}
        {!activeSubject && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBJECTS.map(subject => {
              const Icon = subject.icon;
              return (
                <Card
                  key={subject.id}
                  className={`border-2 ${subject.borderColor} ${subject.hoverColor} transition-all cursor-pointer hover:shadow-lg`}
                  onClick={() => generateLesson(subject.id)}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-16 h-16 ${subject.color} rounded-2xl mx-auto flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2F4731]">{subject.name}</h3>
                    <Button className="w-full bg-[#2F4731] hover:bg-[#BD6809] text-white">
                      Start Today's Lesson
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#BD6809] mx-auto" />
              <p className="text-[#2F4731]/60 italic">Adeline is preparing your lesson...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-red-700 font-bold">{error}</p>
              <Button onClick={() => setActiveSubject(null)} variant="outline" className="border-2 border-red-300">
                ← Back to Subjects
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lesson Display */}
        {lesson && !loading && (
          <div className="space-y-6">
            {/* Lesson Header */}
            <Card className="border-2 border-[#2F4731]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                      {lesson.title}
                    </h2>
                    <div className="flex gap-3 text-sm">
                      <span className="px-3 py-1 bg-[#2F4731]/10 text-[#2F4731] rounded-full font-bold">{lesson.subject}</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">Grade {lesson.gradeLevel}</span>
                    </div>
                  </div>
                  <Button onClick={() => setActiveSubject(null)} variant="outline" className="border-2 border-[#E7DAC3]">
                    ← Change Subject
                  </Button>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-blue-900 mb-2 text-sm uppercase tracking-wide">Learning Objectives</h3>
                  <ul className="space-y-1">
                    {lesson.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-blue-900 text-sm">
                        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button onClick={printWorksheet} className="bg-[#2F4731] hover:bg-[#BD6809] text-white gap-2 flex-1">
                    <Printer className="w-4 h-4" /> Print Worksheet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Content */}
            <Card className="border-2 border-amber-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-[#2F4731] mb-3">Today's Lesson</h3>
                <div className="prose prose-sm max-w-none text-[#2F4731] leading-relaxed space-y-3">
                  {lesson.lessonContent.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Terms */}
            {lesson.keyTerms.length > 0 && (
              <Card className="border-2 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Key Terms</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {lesson.keyTerms.map((term, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="font-bold text-green-900 mb-1">{term.term}</h4>
                        <p className="text-sm text-green-800">{term.definition}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Worksheet Preview */}
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-indigo-900">Practice Worksheet</h3>
                  <Button onClick={printWorksheet} variant="outline" className="border-2 border-indigo-300 text-indigo-700 gap-2">
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-indigo-900"><strong>Instructions:</strong> {lesson.worksheet.instructions}</p>
                </div>
                <div className="space-y-4">
                  {lesson.worksheet.questions.map((q, i) => (
                    <div key={i} className="bg-white border border-indigo-200 rounded-lg p-4">
                      <p className="font-bold text-indigo-900 mb-2">{q.number}. {q.question}</p>
                      {q.type === 'multiple-choice' && q.options && (
                        <div className="ml-4 space-y-1">
                          {q.options.map((opt, j) => (
                            <p key={j} className="text-sm text-indigo-800">
                              {String.fromCharCode(65 + j)}. {opt}
                            </p>
                          ))}
                        </div>
                      )}
                      {q.type === 'fill-in-blank' && (
                        <p className="text-sm text-indigo-600 italic ml-4">Answer: _______________</p>
                      )}
                      {q.type === 'short-answer' && (
                        <div className="ml-4 space-y-1">
                          <p className="text-sm text-indigo-600 italic">_________________________________</p>
                          <p className="text-sm text-indigo-600 italic">_________________________________</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
