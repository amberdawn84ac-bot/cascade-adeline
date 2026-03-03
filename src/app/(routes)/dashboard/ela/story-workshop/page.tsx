import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PenTool, BookOpen, Lightbulb, Users } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';

export default async function StoryWorkshopPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'reading', 'story-workshop');
  
  // Get user data for grade level
  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { gradeLevel: true }
  });
  
  const attentionSpan = getAttentionSpanForGrade(userData?.gradeLevel || '3');
  const interactiveType = getInteractiveTypeForGrade(userData?.gradeLevel || '3');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-rose-100 rounded-xl text-rose-700">
            <PenTool size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-rose-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Story Workshop
            </h1>
            <p className="text-rose-800/70 text-lg">
              {adaptiveContent.description}
            </p>
            <div className="text-sm text-rose-600 mt-2">
              Grade Level: {userData?.gradeLevel || 'Default'} • Difficulty: {adaptiveContent.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Story Elements */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Character Development */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-purple-800 mb-2">Character Development</h3>
          <p className="text-sm text-slate-600">
            Create compelling characters with unique personalities, motivations, and growth arcs.
          </p>
        </div>

        {/* Plot Structure */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700">
            <BookOpen size={24} />
          </div>
          <h3 className="font-bold text-blue-800 mb-2">Plot Structure</h3>
          <p className="text-sm text-slate-600">
            Learn story arcs, conflict development, and narrative pacing techniques.
          </p>
        </div>

        {/* Setting & World */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700">
            <Lightbulb size={24} />
          </div>
          <h3 className="font-bold text-green-800 mb-2">Setting & World</h3>
          <p className="text-sm text-slate-600">
            Build immersive worlds and settings that bring your stories to life.
          </p>
        </div>

        {/* Dialogue */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-amber-100 rounded-xl w-fit text-amber-700">
            <PenTool size={24} />
          </div>
          <h3 className="font-bold text-amber-800 mb-2">Dialogue</h3>
          <p className="text-sm text-slate-600">
            Master natural conversation and character voice through dialogue writing.
          </p>
        </div>
      </div>

      {/* Interactive Writing Studio */}
      <div className="bg-white p-8 rounded-[2rem] border-2 border-rose-100">
        <h2 className="text-2xl font-bold text-rose-900 mb-6">Interactive Writing Studio</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Story Prompts */}
          <div>
            <h3 className="text-lg font-semibold text-rose-800 mb-4">Today's Story Prompts</h3>
            <div className="space-y-3">
              {adaptiveContent.examples.map((example, index) => (
                <div key={index} className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-sm text-rose-800">{example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Writing Challenges */}
          <div>
            <h3 className="text-lg font-semibold text-rose-800 mb-4">Writing Challenges</h3>
            <div className="space-y-3">
              {adaptiveContent.challenges.map((challenge, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-800">{challenge}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-8 rounded-[2rem] border border-rose-200">
        <h2 className="text-2xl font-bold text-rose-900 mb-6">What You'll Learn</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold mb-3 mx-auto">
              1
            </div>
            <h3 className="font-bold text-rose-800 mb-2">Story Structure</h3>
            <p className="text-sm text-slate-600">Master the elements of compelling storytelling</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mb-3 mx-auto">
              2
            </div>
            <h3 className="font-bold text-purple-800 mb-2">Character Voice</h3>
            <p className="text-sm text-slate-600">Develop unique character personalities and dialogue</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3 mx-auto">
              3
            </div>
            <h3 className="font-bold text-blue-800 mb-2">Creative Expression</h3>
            <p className="text-sm text-slate-600">Find your unique writing style and voice</p>
          </div>
        </div>
      </div>

      {/* ZPD Personalized Recommendations */}
      <ZPDRecommendations 
        userId={session.userId} 
        subjectArea="ela" 
        limit={3} 
      />

      {/* Back Navigation */}
      <div className="text-center">
        <Link 
          href="/dashboard/ela"
          className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
        >
          ← Back to ELA Hub
        </Link>
      </div>
    </div>);
}
