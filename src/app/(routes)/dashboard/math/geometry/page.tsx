import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Ruler, Triangle, Square, Circle } from 'lucide-react';
import Link from 'next/link';

export default async function GeometryPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
            <Ruler size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Geometry Workshop
            </h1>
            <p className="text-amber-800/70 text-lg">
              Build and measure! Explore shapes, areas, and volumes
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Shape Builder */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Shape Builder</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Shape Selection */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800 mb-4">Choose a Shape</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Square size={32} className="text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Square</p>
              </button>
              <button className="p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <Circle size={32} className="text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Circle</p>
              </button>
              <button className="p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                <Triangle size={32} className="text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Triangle</p>
              </button>
              <button className="p-6 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                <Ruler size={32} className="text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Rectangle</p>
              </button>
            </div>
          </div>

          {/* Shape Properties */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800 mb-4">Shape Properties</h3>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Side Length:</span>
                  <input type="number" defaultValue="5" className="w-20 px-2 py-1 border rounded" />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Area:</span>
                  <span className="font-bold text-amber-600">25 sq units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Perimeter:</span>
                  <span className="font-bold text-amber-600">20 units</span>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700 transition-colors">
              Calculate Properties
            </button>
          </div>
        </div>
      </div>

      {/* Real-World Applications */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Geometry in Real Life</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="font-bold text-slate-800 mb-2">Architecture</h3>
            <p className="text-sm text-slate-600">Design buildings, calculate materials, plan layouts</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold text-slate-800 mb-2">Art & Design</h3>
            <p className="text-sm text-slate-600">Create patterns, proportions, visual compositions</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-bold text-slate-800 mb-2">Engineering</h3>
            <p className="text-sm text-slate-600">Build bridges, design machines, calculate stress</p>
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
