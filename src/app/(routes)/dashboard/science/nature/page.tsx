import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Microscope, Leaf, Cloud, Bug } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';

export default async function NaturePage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'science', 'nature');
  
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
      <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
            <Microscope size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-emerald-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              {adaptiveContent.title}
            </h1>
            <p className="text-emerald-800/70 text-lg">
              {adaptiveContent.description}
            </p>
            <div className="text-sm text-emerald-600 mt-2">
              Grade Level: {userData?.gradeLevel || 'Default'} • Difficulty: {adaptiveContent.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Observation Entry */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Today's Observation</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Observation Form */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 mb-4">What did you observe?</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Observation Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <Leaf size={20} className="text-green-600 mx-auto mb-1" />
                    <p className="text-xs">Plant</p>
                  </button>
                  <button className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <Bug size={20} className="text-blue-600 mx-auto mb-1" />
                    <p className="text-xs">Animal</p>
                  </button>
                  <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <Cloud size={20} className="text-purple-600 mx-auto mb-1" />
                    <p className="text-xs">Weather</p>
                  </button>
                  <button className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                    <Microscope size={20} className="text-orange-600 mx-auto mb-1" />
                    <p className="text-xs">Other</p>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Description
                </label>
                <textarea 
                  placeholder="Describe what you observed..."
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Location
                </label>
                <input 
                  type="text" 
                  placeholder="Backyard, park, etc."
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                />
              </div>
              
              <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                Save Observation
              </button>
            </div>
          </div>

          {/* Sample Observations */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 mb-4">Recent Observations</h3>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf size={16} className="text-green-600" />
                  <span className="font-medium text-green-800">Oak Tree - New Growth</span>
                </div>
                <p className="text-sm text-slate-600"> Noticed new leaves budding on the oak tree in the backyard. The leaves are small and bright green.</p>
                <p className="text-xs text-emerald-600 mt-2">2 days ago • Backyard</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bug size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-800">Butterfly Sighting</span>
                </div>
                <p className="text-sm text-slate-600"> Saw a monarch butterfly visiting the flowers. It had orange and black wings.</p>
                <p className="text-xs text-emerald-600 mt-2">5 days ago • Garden</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud size={16} className="text-purple-600" />
                  <span className="font-medium text-purple-800">Rain Shower</span>
                </div>
                <p className="text-sm text-slate-600"> Light rain for about 30 minutes. Plants looked refreshed afterward.</p>
                <p className="text-xs text-emerald-600 mt-2">1 week ago • Backyard</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Method */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-[2rem] p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Nature Study Skills</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { skill: "Observe Carefully", desc: "Use all your senses to notice details" },
            { skill: "Record Accurately", desc: "Write down exactly what you see" },
            { skill: "Ask Questions", desc: "Why did that happen? What caused it?" },
            { skill: "Look for Patterns", desc: "Find connections between observations" }
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-white rounded-xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg mx-auto mb-3">
                {index + 1}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{item.skill}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Back Navigation */}
      <div className="text-center">
        <Link 
          href="/dashboard/science"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          ← Back to Science Lab
        </Link>
      </div>
    </div>
  );
}
