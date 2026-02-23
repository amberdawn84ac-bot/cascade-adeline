import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Code, Terminal, Zap, Play } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';

export default async function CodingPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'arcade', 'coding');
  
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
      <div className="bg-violet-50 rounded-[2rem] p-8 border border-violet-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-violet-100 rounded-xl text-violet-700">
            <Code size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-purple-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              {adaptiveContent.title}
            </h1>
            <p className="text-purple-800/70 text-lg">
              {adaptiveContent.description}
            </p>
            <div className="text-sm text-purple-600 mt-2">
              Grade Level: {userData?.gradeLevel || 'Default'} • Difficulty: {adaptiveContent.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Beginner */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700">
            <Terminal size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Hello World</h3>
          <p className="text-slate-600 text-sm mb-4">
            Start your coding journey with the basics. Learn variables, loops, and functions.
          </p>
          <div className="space-y-2">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm font-medium">✅ Python Basics</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">🔄 JavaScript Fundamentals</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Web Development</p>
            </div>
          </div>
        </div>

        {/* Intermediate */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-yellow-100 rounded-xl w-fit text-yellow-700">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Problem Solving</h3>
          <p className="text-slate-600 text-sm mb-4">
            Level up your skills with algorithms and data structures.
          </p>
          <div className="space-y-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Data Structures</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Algorithms</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Problem Solving</p>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
            <Play size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Build Projects</h3>
          <p className="text-slate-600 text-sm mb-4">
            Create real applications and games that people can use.
          </p>
          <div className="space-y-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Web Apps</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Mobile Apps</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm font-medium">⏳ Game Development</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Console */}
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-slate-400 text-sm ml-4">Python Console</span>
        </div>
        <div className="font-mono text-green-400 space-y-2">
          <div>&gt;&gt;&gt; print("Hello, World!")</div>
          <div>Hello, World!</div>
          <div>&gt;&gt;&gt; </div>
          <div className="animate-pulse">_</div>
        </div>
      </div>

      {/* Back Navigation */}
      <div className="text-center">
        <Link 
          href="/dashboard/arcade"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
        >
          ← Back to Game Arcade
        </Link>
      </div>
    </div>
  );
}
