import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Calculator, TrendingUp, PieChart, Ruler } from 'lucide-react';
import { DottedArrow } from '@/components/illustrations';

export default async function MathPage() {
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
            <Calculator size={32} />
          </div>
          <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Math Hub
          </h1>
        </div>
        <p className="text-amber-800/70 text-lg max-w-2xl">
          Welcome to the world of numbers! Here you can master mathematical concepts through
          real-world applications, problem-solving, and business simulations.
        </p>
      </div>

      {/* Activities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Math */}
        <div className="group bg-white p-6 rounded-[2rem] border-2 border-amber-100 hover:border-amber-300 transition-all hover:shadow-lg cursor-pointer">
          <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Business Math</h3>
          <p className="text-slate-600 text-sm mb-4">
            Run a virtual business! Learn profit calculation, budgeting, and financial planning.
          </p>
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-amber-600">
            Start Business <DottedArrow size={24} className="ml-2 rotate-180" />
          </div>
        </div>

        {/* Geometry */}
        <div className="group bg-white p-6 rounded-[2rem] border-2 border-amber-100 hover:border-amber-300 transition-all hover:shadow-lg cursor-pointer">
          <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Ruler size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Geometry Workshop</h3>
          <p className="text-slate-600 text-sm mb-4">
            Build and measure! Explore shapes, areas, volumes through hands-on projects.
          </p>
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-amber-600">
            Build & Measure <DottedArrow size={24} className="ml-2 rotate-180" />
          </div>
        </div>

        {/* Data Analysis */}
        <div className="group bg-white p-6 rounded-[2rem] border-2 border-amber-100 hover:border-amber-300 transition-all hover:shadow-lg cursor-pointer">
          <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <PieChart size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Data Detective</h3>
          <p className="text-slate-600 text-sm mb-4">
            Analyze real data, create charts, and discover patterns in numbers.
          </p>
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-amber-600">
            Analyze Data <DottedArrow size={24} className="ml-2 rotate-180" />
          </div>
        </div>
      </div>

      {/* Math Concepts Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Core Math Skills</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { skill: "Arithmetic", desc: "Add, subtract, multiply, divide", level: "Foundation" },
            { skill: "Fractions", desc: "Parts of a whole and operations", level: "Intermediate" },
            { skill: "Algebra", desc: "Variables and equations", level: "Advanced" },
            { skill: "Geometry", desc: "Shapes and measurements", level: "Applied" }
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-amber-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold mx-auto mb-3">
                {item.skill[0]}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{item.skill}</h3>
              <p className="text-sm text-slate-600 mb-2">{item.desc}</p>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real World Applications */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] p-8 border border-amber-100">
        <h2 className="text-2xl font-bold text-amber-900 mb-6">Math in Real Life</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🏪</div>
            <h3 className="font-bold text-slate-800 mb-2">Shopping</h3>
            <p className="text-sm text-slate-600">Calculate discounts, compare prices, manage budgets</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">👨‍🍳</div>
            <h3 className="font-bold text-slate-800 mb-2">Cooking</h3>
            <p className="text-sm text-slate-600">Measure ingredients, scale recipes, timing</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="font-bold text-slate-800 mb-2">Building</h3>
            <p className="text-sm text-slate-600">Calculate materials, angles, structural design</p>
          </div>
        </div>
      </div>
    </div>
  );
}
