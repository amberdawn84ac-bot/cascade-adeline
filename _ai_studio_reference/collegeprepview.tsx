import React, { useState } from 'react';
import { TestPrepQuestion, Scholarship, ProposedCredit, SubjectArea } from '../types';
import { MortarboardIcon, ColumnIcon, RoseMinimal, DividerFlower } from './FloralIcons';
import { generateTestPrepQuestion, generateScholarships } from '../services/geminiService';

interface Props {
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  credits: ProposedCredit[];
}

export const CollegePrepView: React.FC<Props> = ({ isLoading, setGlobalLoading, credits }) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'transcript' | 'bursary' | 'applications'>('exams');
  
  // Test Prep State
  const [subject, setSubject] = useState<'Math' | 'English' | 'Science'>('Math');
  const [currentQuestion, setCurrentQuestion] = useState<TestPrepQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Scholarship State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [profileInput, setProfileInput] = useState('');

  const handleGenerateQuestion = async () => {
    setGlobalLoading(true);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setShowExplanation(false);
    try {
      const q = await generateTestPrepQuestion(subject);
      setCurrentQuestion(q);
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleFindScholarships = async () => {
    if (!profileInput.trim()) return;
    setGlobalLoading(true);
    try {
      const s = await generateScholarships(profileInput);
      setScholarships(s);
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Group credits by subject for transcript
  const groupedCredits = credits.reduce((acc, credit) => {
    if (!acc[credit.subjectArea]) acc[credit.subjectArea] = [];
    acc[credit.subjectArea].push(credit);
    return acc;
  }, {} as Record<SubjectArea, ProposedCredit[]>);

  const totalCredits = credits.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/p5.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center relative">
        <div>
           <h2 className="font-display text-3xl text-ink">University Hall</h2>
           <p className="text-sm italic text-sage-dark mt-1">"Education is the passport to the future."</p>
        </div>
        <div className="flex gap-2 text-sage opacity-50">
            <ColumnIcon className="w-6 h-6" />
            <MortarboardIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gold/20 bg-white/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('exams')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'exams' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Entrance Exams
          </button>
          <button 
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'transcript' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Transcript
          </button>
          <button 
            onClick={() => setActiveTab('bursary')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'bursary' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            The Bursary
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex-1 min-w-[100px] py-3 text-sm uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${activeTab === 'applications' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Applications
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar p-4 md:p-8">

          {/* --- EXAMS TAB --- */}
          {activeTab === 'exams' && (
              <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                      <h3 className="font-display text-xl text-ink">ACT/SAT Preparation</h3>
                      <p className="text-sm italic text-ink/60">Practice makes progress.</p>
                  </div>

                  <div className="flex justify-center gap-4 mb-8">
                      {(['Math', 'English', 'Science'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setSubject(s)}
                            className={`px-4 py-2 border text-xs uppercase tracking-widest transition-colors ${subject === s ? 'bg-sage-dark text-white border-sage-dark' : 'border-gold/40 text-ink/60 hover:border-sage'}`}
                          >
                              {s}
                          </button>
                      ))}
                  </div>

                  {!currentQuestion ? (
                      <div className="text-center py-12 border-2 border-dashed border-gold/30 rounded opacity-60">
                          <MortarboardIcon className="w-16 h-16 mx-auto mb-4 text-gold" />
                          <button 
                            onClick={handleGenerateQuestion}
                            disabled={isLoading}
                            className="bg-sage text-white px-6 py-3 rounded-sm uppercase tracking-widest text-xs font-bold hover:bg-sage-dark transition-colors"
                          >
                              {isLoading ? 'Loading...' : 'Start Practice Question'}
                          </button>
                      </div>
                  ) : (
                      <div className="bg-white p-8 border border-gold/30 shadow-md animate-in fade-in slide-in-from-bottom-4">
                          <span className="text-[10px] uppercase tracking-widest bg-sepia px-2 py-1 rounded text-sage-dark font-bold mb-4 inline-block">
                              {currentQuestion.subject} Question
                          </span>
                          <p className="font-serif text-lg text-ink mb-6 leading-relaxed">
                              {currentQuestion.question}
                          </p>

                          <div className="space-y-3 mb-6">
                              {currentQuestion.options.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedOption(idx)}
                                    disabled={showExplanation}
                                    className={`
                                        w-full text-left p-3 border rounded transition-colors flex items-center gap-3
                                        ${showExplanation && idx === currentQuestion.correctIndex ? 'bg-green-50 border-green-200' : ''}
                                        ${showExplanation && idx === selectedOption && idx !== currentQuestion.correctIndex ? 'bg-red-50 border-red-200' : ''}
                                        ${!showExplanation && selectedOption === idx ? 'bg-sepia border-sage' : 'border-gold/20 hover:bg-gray-50'}
                                    `}
                                  >
                                      <span className="font-bold font-mono text-ink/50">{String.fromCharCode(65 + idx)}.</span>
                                      {opt}
                                  </button>
                              ))}
                          </div>

                          {selectedOption !== null && !showExplanation && (
                              <button 
                                onClick={() => setShowExplanation(true)}
                                className="w-full bg-sage text-white py-2 uppercase text-xs font-bold tracking-widest hover:bg-sage-dark"
                              >
                                  Check Answer
                              </button>
                          )}

                          {showExplanation && (
                              <div className="bg-[#F3F0EB] p-4 border-l-4 border-sage animate-in zoom-in-95">
                                  <h4 className="font-bold text-xs uppercase text-sage-dark mb-2">Explanation</h4>
                                  <p className="text-sm text-ink/80 italic">{currentQuestion.explanation}</p>
                                  <div className="mt-4 text-center">
                                      <button 
                                        onClick={handleGenerateQuestion}
                                        className="text-xs uppercase font-bold text-sage-dark hover:underline"
                                      >
                                          Next Question →
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}

          {/* --- TRANSCRIPT TAB --- */}
          {activeTab === 'transcript' && (
              <div className="max-w-3xl mx-auto bg-white border-2 border-double border-gold/40 p-8 shadow-sm print:shadow-none">
                  <div className="text-center border-b-2 border-gold/20 pb-6 mb-6">
                      <ColumnIcon className="w-12 h-12 mx-auto text-sage mb-2 opacity-50" />
                      <h2 className="font-display text-3xl text-ink uppercase tracking-wide">Official Homeschool Transcript</h2>
                      <p className="text-xs uppercase tracking-widest text-ink/40 mt-2">Verified by Adeline AI</p>
                  </div>

                  <div className="mb-8 flex justify-between items-end">
                      <div>
                          <h4 className="font-bold text-sm text-ink uppercase">Student Record</h4>
                          <p className="text-sm text-ink/60">Cumulative GPA: 4.0 (Estimated)</p>
                      </div>
                      <div className="text-right">
                          <span className="text-4xl font-display text-sage-dark">{totalCredits.toFixed(2)}</span>
                          <span className="block text-[10px] uppercase tracking-widest text-ink/40">Total Credits</span>
                      </div>
                  </div>

                  <div className="space-y-6">
                      {(Object.keys(groupedCredits) as SubjectArea[]).map(subject => (
                          <div key={subject}>
                              <h4 className="bg-sepia px-3 py-1 text-xs font-bold uppercase tracking-widest text-sage-dark mb-2">{subject}</h4>
                              <table className="w-full text-sm">
                                  <thead>
                                      <tr className="text-left text-[10px] uppercase text-ink/40 border-b border-gold/20">
                                          <th className="pb-1 pl-2">Course Title</th>
                                          <th className="pb-1 text-right pr-2">Credits</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {groupedCredits[subject].map(credit => (
                                          <tr key={credit.id} className="border-b border-gold/10">
                                              <td className="py-2 pl-2 text-ink/80">{credit.courseTitle}</td>
                                              <td className="py-2 pr-2 text-right font-mono text-ink/60">{credit.credits.toFixed(2)}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ))}
                  </div>

                  <div className="mt-12 text-center text-[10px] text-ink/30 italic">
                      This document is a generated summary of learning experiences assessed by the Adeline Learning Concierge.
                  </div>
              </div>
          )}

          {/* --- BURSARY TAB --- */}
          {activeTab === 'bursary' && (
              <div className="max-w-3xl mx-auto">
                  <div className="bg-[#FFFDF5] border border-gold/30 p-6 mb-8 text-center">
                      <h3 className="font-display text-xl text-ink mb-2">Scholarship Search</h3>
                      <p className="text-sm text-ink/60 mb-4">Find funding opportunities tailored to your unique profile.</p>
                      <div className="flex gap-2">
                          <input 
                            type="text"
                            value={profileInput}
                            onChange={(e) => setProfileInput(e.target.value)}
                            placeholder="E.g. Female engineer, artist, first-gen student..."
                            className="flex-1 p-2 border border-gold/30 outline-none focus:border-sage font-serif"
                          />
                          <button 
                            onClick={handleFindScholarships}
                            disabled={isLoading || !profileInput.trim()}
                            className="bg-sage text-white px-4 py-2 uppercase text-xs font-bold tracking-widest hover:bg-sage-dark"
                          >
                              Search
                          </button>
                      </div>
                  </div>

                  <div className="grid gap-4">
                      {scholarships.length > 0 ? scholarships.map(scholarship => (
                          <div key={scholarship.id} className="bg-white p-5 border border-gold/20 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-sage"></div>
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-lg text-ink">{scholarship.name}</h4>
                                  <span className="bg-green-50 text-green-700 px-2 py-1 text-xs font-bold rounded border border-green-100">{scholarship.amount}</span>
                              </div>
                              <p className="text-sm text-ink/70 mb-3">{scholarship.requirements}</p>
                              <div className="flex justify-between items-center text-xs uppercase tracking-widest text-ink/40">
                                  <span>{scholarship.category}</span>
                                  <span className="text-red-400 font-bold">Due: {scholarship.deadline}</span>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-12 opacity-40">
                              <p className="italic">Enter your profile above to discover opportunities.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* --- APPLICATIONS TAB --- */}
          {activeTab === 'applications' && (
              <div className="max-w-3xl mx-auto space-y-6">
                  <div className="bg-white p-6 border-l-4 border-sage shadow-sm">
                      <h3 className="font-display text-xl text-ink mb-2">The Common App Checklist</h3>
                      <ul className="space-y-3">
                          {[
                              "Draft Personal Statement (650 words)",
                              "Request Teacher Recommendations",
                              "Compile Extracurricular Activities List",
                              "Finalize School List",
                              "Complete FAFSA"
                          ].map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-ink/80 p-2 hover:bg-gray-50 rounded cursor-pointer group">
                                  <div className="w-4 h-4 border-2 border-gold/50 rounded-sm group-hover:border-sage transition-colors"></div>
                                  {item}
                              </li>
                          ))}
                      </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-[#FAF8F2] p-6 border border-gold/20">
                          <h4 className="font-bold text-sm uppercase text-sage-dark mb-2">Essay Tips</h4>
                          <p className="text-xs text-ink/70 leading-relaxed mb-4">
                              "Show, don't tell." Use vivid imagery to describe a moment of personal growth. Avoid clichés like "I learned the value of hard work."
                          </p>
                          <button className="text-xs font-bold text-sage hover:underline">Ask Adeline to brainstorm →</button>
                      </div>
                      <div className="bg-[#FAF8F2] p-6 border border-gold/20">
                          <h4 className="font-bold text-sm uppercase text-sage-dark mb-2">Deadlines</h4>
                          <ul className="text-xs text-ink/70 space-y-1">
                              <li><strong>Early Decision:</strong> Nov 1</li>
                              <li><strong>Early Action:</strong> Nov 1 / Nov 15</li>
                              <li><strong>Regular Decision:</strong> Jan 1 / Jan 15</li>
                          </ul>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};