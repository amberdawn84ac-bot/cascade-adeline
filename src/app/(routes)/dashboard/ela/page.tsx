import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Feather, BookOpen, PenTool, MessageSquare, FileText } from 'lucide-react';
import { DottedArrow } from '@/components/illustrations';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';

export default async function ElaPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'reading', 'ela');
  
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
            <Feather size={32} />
          </div>
          <h1 className="text-3xl font-bold text-rose-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Deep Dives
          </h1>
        </div>
        <p className="text-rose-800/70 text-lg max-w-2xl">
          Welcome to the literary exploration zone! Here you can analyze texts, develop your writing voice,
          and build a portfolio of your best work.
        </p>
      </div>

      {/* Activities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Story Writing */}
        <Link href="/dashboard/ela/story-workshop" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg cursor-pointer">
            <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <PenTool size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Story Workshop</h3>
            <p className="text-slate-600 text-sm mb-4">
              Craft compelling narratives with AI guidance. Develop characters, plot, and dialogue.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-rose-600">
              Start Writing <DottedArrow size={24} className="ml-2 rotate-180" />
            </div>
          </div>
        </Link>

        {/* Text Analysis */}
        <Link href="/dashboard/ela/text-analysis" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg cursor-pointer">
            <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Text Analysis</h3>
            <p className="text-slate-600 text-sm mb-4">
              Deconstruct literature with AI assistance. Identify themes, symbols, and literary devices.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-rose-600">
              Analyze Text <DottedArrow size={24} className="ml-2 rotate-180" />
            </div>
          </div>
        </Link>

        {/* Portfolio Builder */}
        <Link href="/dashboard/ela/portfolio" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg cursor-pointer">
            <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Portfolio Builder</h3>
            <p className="text-slate-600 text-sm mb-4">
              Compile your best work into a professional portfolio. Track your writing progress.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-rose-600">
              Build Portfolio <DottedArrow size={24} className="ml-2 rotate-180" />
            </div>
          </div>
        </Link>
      </div>

      {/* Writing Skills Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-rose-100">
        <h2 className="text-2xl font-bold text-rose-900 mb-6">Core Writing Skills</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { skill: "Narrative", desc: "Story structure and pacing", level: "Foundation" },
            { skill: "Character", desc: "Development and dialogue", level: "Intermediate" },
            { skill: "Theme", desc: "Symbolism and meaning", level: "Advanced" },
            { skill: "Voice", desc: "Personal writing style", level: "Mastery" }
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-rose-50 rounded-xl">
              <div className="w-12 h-12 bg-rose-200 rounded-full flex items-center justify-center text-rose-700 font-bold mx-auto mb-3">
                {item.skill[0]}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{item.skill}</h3>
              <p className="text-sm text-slate-600 mb-2">{item.desc}</p>
              <span className="text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Works */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-[2rem] p-8 border border-rose-100">
        <h2 className="text-2xl font-bold text-rose-900 mb-6">Literary Explorations</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-bold text-slate-800 mb-2">Classic Literature</h3>
            <p className="text-sm text-slate-600">Analyze timeless works and universal themes</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-bold text-slate-800 mb-2">Creative Writing</h3>
            <p className="text-sm text-slate-600">Express your unique voice and perspective</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🎭</div>
            <h3 className="font-bold text-slate-800 mb-2">Dramatic Arts</h3>
            <p className="text-sm text-slate-600">Explore dialogue and character motivation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

