import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Cpu, Zap, Puzzle, Brain, Trophy } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';

export default async function LogicPuzzlesPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'arcade', 'logic-puzzles');
  
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
            <Cpu size={32} />
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

      {/* Puzzle Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Beginner */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-emerald-100 rounded-xl w-fit text-emerald-700">
            <Brain size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Basic Circuits</h3>
          <p className="text-slate-600 text-sm mb-4">
            Learn the fundamentals of logic gates and simple circuits.
          </p>
          <div className="space-y-2">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-emerald-800 text-sm font-medium">✅ AND Gates</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-emerald-800 text-sm font-medium">✅ OR Gates</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-emerald-800 text-sm font-medium">✅ NOT Gates</p>
            </div>
          </div>
        </div>

        {/* Intermediate */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Complex Logic</h3>
          <p className="text-slate-600 text-sm mb-4">
            Combine multiple gates to solve more challenging puzzles.
          </p>
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">🔄 XOR Gates</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">🔄 NAND Gates</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">🔄 Circuit Design</p>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
            <Trophy size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Master Challenges</h3>
          <p className="text-slate-600 text-sm mb-4">
            Build real computer components like adders and memory.
          </p>
          <div className="space-y-2">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">⏳ Binary Adder</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">⏳ Memory Cells</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">⏳ CPU Design</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Circuit Simulator */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-[2rem] p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Circuit Simulator</h2>
        
        {/* Simple AND Gate Example */}
        <div className="bg-white p-6 rounded-xl mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">AND Gate Example</h3>
          <div className="flex items-center justify-center gap-8">
            {/* Input A */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-emerald-800 font-bold">A</span>
              </div>
              <div className="bg-gray-200 rounded px-3 py-1">
                <span className="text-sm">0</span>
              </div>
            </div>
            
            {/* AND Gate */}
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">
              AND
            </div>
            
            {/* Output */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-800 font-bold">Q</span>
              </div>
              <div className="bg-gray-200 rounded px-3 py-1">
                <span className="text-sm">0</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-600">
            <p>Both inputs must be 1 for the output to be 1</p>
          </div>
        </div>

        {/* Truth Table */}
        <div className="bg-white p-6 rounded-xl">
          <h3 className="font-bold text-blue-800 mb-4">Truth Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-2 border">Input A</th>
                  <th className="p-2 border">Input B</th>
                  <th className="p-2 border">Output Q</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">0</td>
                  <td className="p-2 border">0</td>
                  <td className="p-2 border bg-red-50">0</td>
                </tr>
                <tr>
                  <td className="p-2 border">0</td>
                  <td className="p-2 border">1</td>
                  <td className="p-2 border bg-red-50">0</td>
                </tr>
                <tr>
                  <td className="p-2 border">1</td>
                  <td className="p-2 border">0</td>
                  <td className="p-2 border bg-red-50">0</td>
                </tr>
                <tr>
                  <td className="p-2 border">1</td>
                  <td className="p-2 border">1</td>
                  <td className="p-2 border bg-green-50">1</td>
                </tr>
              </tbody>
            </table>
          </div>
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

