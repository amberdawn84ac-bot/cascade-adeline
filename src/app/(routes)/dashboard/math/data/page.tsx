import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PieChart, BarChart3, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';

export default async function DataPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'math', 'data');
  
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
            <PieChart size={32} />
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

      {/* Interactive Chart Builder */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Create Your Own Chart</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Data Input */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800 mb-4">Enter Your Data</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Label 1" 
                  defaultValue="Apples"
                  className="px-3 py-2 border border-amber-200 rounded-lg"
                />
                <input 
                  type="number" 
                  placeholder="Value 1" 
                  defaultValue="25"
                  className="px-3 py-2 border border-amber-200 rounded-lg"
                />
                <input 
                  type="text" 
                  placeholder="Label 2" 
                  defaultValue="Oranges"
                  className="px-3 py-2 border border-amber-200 rounded-lg"
                />
                <input 
                  type="number" 
                  placeholder="Value 2" 
                  defaultValue="30"
                  className="px-3 py-2 border border-amber-200 rounded-lg"
                />
                <input 
                  type="text" 
                  placeholder="Label 3" 
                  defaultValue="Bananas"
                  className="px-3 py-2 border border-amber-200 rounded-lg"
                />
                <input 
                  type="number" 
                  placeholder="Value 3" 
                  defaultValue="15"
                  className="px-3 py-2 border border-amber-200 rounded-lg"
                />
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Pie Chart
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                  Bar Chart
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800 mb-4">Your Chart</h3>
            <div className="p-6 bg-amber-50 rounded-lg min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                <PieChart size={48} className="text-amber-600 mx-auto mb-2" />
                <p className="text-amber-800 font-medium">Chart will appear here</p>
                <p className="text-sm text-amber-600">Enter data and click a chart type</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Analysis Skills */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Data Analysis Skills</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              skill: "Collect Data", 
              desc: "Gather information systematically",
              icon: <Activity size={24} className="text-blue-600" />
            },
            { 
              skill: "Organize Data", 
              desc: "Sort and categorize information",
              icon: <BarChart3 size={24} className="text-green-600" />
            },
            { 
              skill: "Visualize Data", 
              desc: "Create charts and graphs",
              icon: <PieChart size={24} className="text-purple-600" />
            },
            { 
              skill: "Find Patterns", 
              desc: "Discover trends and insights",
              icon: <TrendingUp size={24} className="text-orange-600" />
            }
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-white rounded-xl">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{item.skill}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Real Data Examples */}
      <div className="bg-white rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Real Data You Can Analyze</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">🌡️ Weather Data</h3>
            <p className="text-sm text-slate-600">Track temperature, rainfall, and weather patterns in your area</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">📚 Reading Habits</h3>
            <p className="text-sm text-slate-600">Chart your reading time, book types, and learning progress</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">💰 Family Budget</h3>
            <p className="text-sm text-slate-600">Analyze spending patterns and find savings opportunities</p>
          </div>
        </div>
      </div>

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
