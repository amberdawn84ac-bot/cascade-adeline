import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Dna, Heart, TreePine, Microscope } from 'lucide-react';
import Link from 'next/link';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';

export default async function BiologyPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'science', 'biology');
  
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
            <Dna size={32} />
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

      {/* Life Explorer */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Explore Life Forms</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Plants */}
          <div className="p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700">
              <TreePine size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Plants</h3>
            <p className="text-slate-600 text-sm mb-4">
              Photosynthesis, growth, and plant life cycles
            </p>
            <div className="text-xs text-green-600 font-medium">
              🌱 From seed to tree
            </div>
          </div>

          {/* Animals */}
          <div className="p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Animals</h3>
            <p className="text-slate-600 text-sm mb-4">
              Habitats, adaptations, and animal behavior
            </p>
            <div className="text-xs text-blue-600 font-medium">
              🦋 Insects to mammals
            </div>
          </div>

          {/* Microorganisms */}
          <div className="p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
              <Microscope size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Microbes</h3>
            <p className="text-slate-600 text-sm mb-4">
              Bacteria, fungi, and invisible life forms
            </p>
            <div className="text-xs text-purple-600 font-medium">
              🦠 The tiny world
            </div>
          </div>

          {/* Human Body */}
          <div className="p-6 bg-red-50 rounded-xl hover:bg-red-100 transition-colors cursor-pointer">
            <div className="mb-4 p-3 bg-red-100 rounded-xl w-fit text-red-700">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Human Body</h3>
            <p className="text-slate-600 text-sm mb-4">
              Cells, organs, and body systems
            </p>
            <div className="text-xs text-red-600 font-medium">
              🧬 How we work
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cell Explorer */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-[2rem] p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Cell Explorer</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Cell Diagram */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 mb-4">Plant Cell</h3>
            <div className="p-6 bg-white rounded-lg relative">
              <div className="w-32 h-32 bg-green-100 rounded-full mx-auto mb-4 relative">
                <div className="absolute top-4 left-4 w-8 h-8 bg-purple-200 rounded-full"></div>
                <div className="absolute top-12 right-6 w-6 h-6 bg-blue-200 rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-4 h-4 bg-yellow-200 rounded-full"></div>
                <div className="text-center mt-16">
                  <p className="text-xs text-emerald-600">Click parts to learn more</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cell Parts */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 mb-4">Cell Parts</h3>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800">Nucleus</h4>
                <p className="text-sm text-slate-600">The cell's control center containing DNA</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Chloroplasts</h4>
                <p className="text-sm text-slate-600">Where photosynthesis happens</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">Mitochondria</h4>
                <p className="text-sm text-slate-600">Powerhouses that make energy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Explorer */}
      <div className="bg-white rounded-[2rem] p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Ecosystem Connections</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="text-4xl mb-3">☀️</div>
            <h3 className="font-bold text-slate-800 mb-2">Producers</h3>
            <p className="text-sm text-slate-600 mb-3">Plants make their own food using sunlight</p>
            <div className="text-xs text-green-600">Photosynthesis</div>
          </div>
          
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="text-4xl mb-3">🐰</div>
            <h3 className="font-bold text-slate-800 mb-2">Consumers</h3>
            <p className="text-sm text-slate-600 mb-3">Animals eat plants or other animals</p>
            <div className="text-xs text-blue-600">Food chains</div>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <div className="text-4xl mb-3">🍄</div>
            <h3 className="font-bold text-slate-800 mb-2">Decomposers</h3>
            <p className="text-sm text-slate-600 mb-3">Break down dead things and recycle nutrients</p>
            <div className="text-xs text-purple-600">Nature's recyclers</div>
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

