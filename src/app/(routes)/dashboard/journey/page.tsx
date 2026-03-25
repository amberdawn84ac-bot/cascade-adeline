'use client';

import { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

interface LessonSuggestion {
  id: string;
  title: string;
  subject: string;
  description: string;
  emoji: string;
}

export default function JourneyPage() {
  const [lessonSuggestions] = useState<LessonSuggestion[]>([
    { id: '1', title: 'Butterflies of North America', subject: 'Science', description: 'Investigate butterfly life cycles and adaptations', emoji: '🦋' },
    { id: '2', title: 'The American Revolution', subject: 'History', description: 'Primary sources from the founding era', emoji: '🏛️' },
    { id: '3', title: 'Water Cycle Investigation', subject: 'Science', description: 'Hands-on experiments with evaporation and condensation', emoji: '💧' },
    { id: '4', title: 'Scripture Study: Psalms', subject: 'Bible', description: 'Hebrew poetry and original meanings', emoji: '📖' },
  ]);

  const handleStartLesson = async (suggestion: LessonSuggestion) => {
    // This will be handled by FloatingBeeBubble / LessonSystemWrapper
    console.log('Starting lesson:', suggestion.title);
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white border-b-2 border-[#E7DAC3] p-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            My Learning Plan
          </h1>
          <p className="text-[#2F4731]/60 mt-2">
            Choose a lesson to start, or ask Adeline in the chat bubble!
          </p>
        </div>
      </header>

      {/* Lesson Suggestions */}
      <main className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-4">
          {lessonSuggestions.map(suggestion => (
            <button
              key={suggestion.id}
              onClick={() => handleStartLesson(suggestion)}
              className="text-left p-6 rounded-2xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:shadow-lg transition-all bg-white group"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{suggestion.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#2F4731] mb-1 group-hover:text-[#BD6809] transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-[#2F4731]/60 mb-2">{suggestion.description}</p>
                  <span className="inline-block px-3 py-1 bg-[#2F4731]/10 text-[#2F4731] text-xs font-bold rounded-full">
                    {suggestion.subject}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
