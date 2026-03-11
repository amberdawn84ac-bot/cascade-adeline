"use client";

import { useState } from 'react';
import { GraduationCap, FileText, DollarSign, Clipboard } from 'lucide-react';

interface TestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Scholarship {
  name: string;
  amount: string;
  requirements: string;
  category: string;
  deadline: string;
}

interface ClientCollegePrepProps {
  TranscriptTabComponent: React.ComponentType;
}

export function ClientCollegePrep({ TranscriptTabComponent }: ClientCollegePrepProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'transcript' | 'scholarships' | 'applications'>('exams');
  
  // Test Prep State
  const [subject, setSubject] = useState<'Math' | 'English' | 'Science'>('Math');
  const [currentQuestion, setCurrentQuestion] = useState<TestQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Scholarship State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [profileInput, setProfileInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleGenerateQuestion = async () => {
    setIsLoading(true);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setShowExplanation(false);
    
    try {
      const response = await fetch('/api/college-prep/test-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });
      
      if (!response.ok) throw new Error('Failed to generate question');
      
      const question = await response.json();
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindScholarships = async () => {
    if (!profileInput.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/college-prep/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileInput }),
      });
      
      if (!response.ok) throw new Error('Failed to find scholarships');
      
      const data = await response.json();
      setScholarships(data.scholarships);
    } catch (error) {
      console.error('Error finding scholarships:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">College Prep</h1>
            <p className="text-sm text-gray-600">Prepare for your future with test prep, scholarships, and more</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'exams', label: 'Entrance Exams', icon: FileText },
            { id: 'transcript', label: 'Transcript', icon: Clipboard },
            { id: 'scholarships', label: 'Scholarships', icon: DollarSign },
            { id: 'applications', label: 'Applications', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">ACT/SAT Preparation</h2>
              <p className="text-gray-600">Practice makes progress. Choose a subject and start practicing.</p>
            </div>

            {/* Subject Selection */}
            <div className="flex justify-center gap-4">
              {(['Math', 'English', 'Science'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    subject === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Question Display */}
            {!currentQuestion ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <GraduationCap size={48} className="mx-auto mb-4 text-gray-400" />
                <button
                  onClick={handleGenerateQuestion}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Start Practice Question'}
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="mb-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {subject} Question
                  </span>
                </div>
                
                <p className="text-lg font-medium text-gray-900 mb-6">
                  {currentQuestion.question}
                </p>

                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      disabled={showExplanation}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        showExplanation && index === currentQuestion.correctIndex
                          ? 'bg-green-50 border-green-200'
                          : showExplanation && index === selectedOption && index !== currentQuestion.correctIndex
                          ? 'bg-red-50 border-red-200'
                          : selectedOption === index
                          ? 'bg-blue-50 border-blue-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium text-gray-500 mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                {selectedOption !== null && !showExplanation && (
                  <button
                    onClick={() => setShowExplanation(true)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Check Answer
                  </button>
                )}

                {showExplanation && (
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-200">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2">Explanation</h4>
                    <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleGenerateQuestion}
                        className="text-blue-600 font-medium hover:underline"
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

        {/* Transcript Tab */}
        {activeTab === 'transcript' && <TranscriptTabComponent />}

        {/* Scholarships Tab */}
        {activeTab === 'scholarships' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scholarship Search</h3>
              <p className="text-gray-600 mb-4">Find funding opportunities tailored to your unique profile.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  placeholder="E.g. Female engineer, artist, first-gen student..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleFindScholarships}
                  disabled={isSearching || !profileInput.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {scholarships.length > 0 ? (
                scholarships.map((scholarship, index) => (
                  <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">{scholarship.name}</h4>
                      <span className="bg-green-100 text-green-700 px-2 py-1 text-xs font-medium rounded">
                        {scholarship.amount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{scholarship.requirements}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="uppercase tracking-wide">{scholarship.category}</span>
                      <span className="text-red-600 font-medium">Due: {scholarship.deadline}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign size={48} className="mx-auto mb-4" />
                  <p className="italic">Enter your profile above to discover opportunities.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">The Common App Checklist</h3>
              <ul className="space-y-3">
                {[
                  "Draft Personal Statement (650 words)",
                  "Request Teacher Recommendations",
                  "Compile Extracurricular Activities List",
                  "Finalize School List",
                  "Complete FAFSA"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-gray-700 p-2 hover:bg-gray-50 rounded">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Essay Tips</h4>
                <p className="text-sm text-gray-600 mb-4">
                  "Show, don't tell." Use vivid imagery to describe a moment of personal growth. Avoid clichés like "I learned the value of hard work."
                </p>
                <button className="text-blue-600 font-medium hover:underline">Ask Adeline to brainstorm →</button>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Deadlines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
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
}

