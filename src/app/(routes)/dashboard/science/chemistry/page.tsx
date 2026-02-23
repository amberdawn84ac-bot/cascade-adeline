import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Beaker, FlaskConical, Droplets, Zap } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';

export default async function ChemistryPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'science', 'chemistry');
  
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
            <Beaker size={32} />
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

      {/* Safety First */}
      <div className="bg-red-50 rounded-[2rem] p-8 border-2 border-red-100">
        <h2 className="text-2xl font-bold text-red-900 mb-4">🔬 Safety First!</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">✓</span>
              </div>
              <span className="text-sm">Always ask an adult for help</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">✓</span>
              </div>
              <span className="text-sm">Work in a well-ventilated area</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">✓</span>
              </div>
              <span className="text-sm">Wear safety goggles if needed</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">✗</span>
              </div>
              <span className="text-sm">Never taste chemicals</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">✗</span>
              </div>
              <span className="text-sm">Don't mix unknown substances</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">✗</span>
              </div>
              <span className="text-sm">Keep away from heat and flames</span>
            </div>
          </div>
        </div>
      </div>

      {/* Experiment Selector */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Choose an Experiment</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Baking Soda Volcano */}
          <div className="p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700">
              <FlaskConical size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Baking Soda Volcano</h3>
            <p className="text-slate-600 text-sm mb-4">
              Watch a chemical reaction create foam and bubbles!
            </p>
            <div className="text-xs text-blue-600 font-medium">
              Materials: Baking soda, vinegar, food coloring
            </div>
          </div>

          {/* Density Tower */}
          <div className="p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700">
              <Droplets size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Density Tower</h3>
            <p className="text-slate-600 text-sm mb-4">
              Layer different liquids to see which is heaviest.
            </p>
            <div className="text-xs text-green-600 font-medium">
              Materials: Oil, water, honey, food coloring
            </div>
          </div>

          {/* Invisible Ink */}
          <div className="p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Invisible Ink</h3>
            <p className="text-slate-600 text-sm mb-4">
              Write secret messages that appear with heat!
            </p>
            <div className="text-xs text-purple-600 font-medium">
              Materials: Lemon juice, paper, heat source
            </div>
          </div>
        </div>
      </div>

      {/* Experiment Details */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-[2rem] p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Baking Soda Volcano Experiment</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Procedure */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 mb-4">Procedure</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <p className="text-sm">Place 2 tablespoons of baking soda in a cup</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <p className="text-sm">Add a few drops of food coloring</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <p className="text-sm">Pour in vinegar and watch the reaction!</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <p className="text-sm">Record what happens in your science journal</p>
              </div>
            </div>
          </div>

          {/* What's Happening */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 mb-4">What's Happening?</h3>
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-slate-600 mb-3">
                When baking soda (a base) mixes with vinegar (an acid), they create carbon dioxide gas. 
                The gas forms bubbles that make the mixture foam and overflow like a volcano!
              </p>
              <div className="text-xs text-emerald-600">
                <strong>Chemical Formula:</strong> NaHCO₃ + CH₃COOH → CO₂ + H₂O + CH₃COONa
              </div>
            </div>
          </div>
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
