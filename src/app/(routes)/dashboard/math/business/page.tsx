import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TrendingUp, DollarSign, Calculator, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';

export default async function BusinessMathPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'math', 'business');
  
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
      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
            <TrendingUp size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              {adaptiveContent.title}
            </h1>
            <p className="text-amber-800/70 text-lg">
              {adaptiveContent.description}
            </p>
            <div className="text-sm text-amber-600 mt-2">
              Grade Level: {userData?.gradeLevel || 'Default'} • Difficulty: {adaptiveContent.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Business Simulation */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Your Virtual Lemonade Stand</h2>
        
        {/* Adaptive Examples */}
        <div className="mb-6 p-4 bg-amber-50 rounded-lg">
          <h3 className="font-bold text-amber-800 mb-2">Examples for Your Grade Level:</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            {adaptiveContent.adaptations.examples.map((example, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                {example}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Business Stats */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800 mb-4">Business Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  Daily Revenue
                </span>
                <span className="font-bold text-green-600">$45.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <Calculator size={16} className="text-blue-600" />
                  Daily Costs
                </span>
                <span className="font-bold text-blue-600">$12.50</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-600" />
                  Daily Profit
                </span>
                <span className="font-bold text-purple-600">$32.50</span>
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800 mb-4">Business Decisions</h3>
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 rounded-lg">
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Price per Cup ($)
                </label>
                <input 
                  type="range" 
                  min="0.50" 
                  max="3.00" 
                  step="0.25" 
 defaultValue="1.50"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-amber-600 mt-1">
                  <span>$0.50</span>
                  <span>$1.50</span>
                  <span>$3.00</span>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg">
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Cups to Make
                </label>
                <input 
                  type="number" 
                  min="10" 
                  max="100" 
                  defaultValue="50"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg"
                />
              </div>
              
              <button className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700 transition-colors">
                Calculate Daily Profit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Math Skills You'll Learn</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adaptiveContent.adaptations.concepts.map((concept, index) => (
            <div key={index} className="text-center p-4 bg-white rounded-xl">
              <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold mx-auto mb-3">
                {index + 1}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{concept}</h3>
              <p className="text-sm text-slate-600">Grade-appropriate learning</p>
            </div>
          ))}
        </div>
      </div>

      {/* Adaptive Challenges */}
      <div className="bg-white rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Challenges for Your Level</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adaptiveContent.adaptations.challenges.map((challenge, index) => (
            <div key={index} className="p-6 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                {index + 1}
              </div>
              <h3 className="font-bold text-amber-800 mb-2">Challenge {index + 1}</h3>
              <p className="text-sm text-slate-600">{challenge}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ZPD Personalized Recommendations */}
      <ZPDRecommendations 
        userId={session.userId} 
        subjectArea="math" 
        limit={3} 
      />

      {/* Back Navigation */}
      <div className="text-center">
        <Link 
          href="/dashboard/math"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
        >
          ← Back to Math Hub
        </Link>
      </div>
    </div>
  );
}
