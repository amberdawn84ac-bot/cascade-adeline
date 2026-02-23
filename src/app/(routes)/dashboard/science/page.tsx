import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FlaskConical, Microscope, Dna, Beaker } from 'lucide-react';
import { DottedArrow } from '@/components/illustrations';
import Link from 'next/link';

export default async function SciencePage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
            <FlaskConical size={32} />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Science Lab
          </h1>
        </div>
        <p className="text-emerald-800/70 text-lg max-w-2xl">
          Welcome to the laboratory! Here you can conduct experiments, explore the natural world,
          and discover the scientific method through hands-on learning.
        </p>
      </div>

      {/* Activities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Nature Journal */}
        <Link href="/dashboard/science/nature" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg cursor-pointer">
            <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Microscope size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nature Journal</h3>
            <p className="text-slate-600 text-sm mb-4">
              Document your observations of plants, animals, and weather patterns in your backyard.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-emerald-600">
              Start Journaling <DottedArrow size={24} className="ml-2 rotate-180" />
            </div>
          </div>
        </Link>

        {/* Chemistry Experiments */}
        <Link href="/dashboard/science/chemistry" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg cursor-pointer">
            <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Beaker size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Kitchen Chemistry</h3>
            <p className="text-slate-600 text-sm mb-4">
              Safe experiments using household items. Learn about reactions, solutions, and mixtures.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-emerald-600">
              Mix & Learn <DottedArrow size={24} className="ml-2 rotate-180" />
            </div>
          </div>
        </Link>

        {/* Biology Studies */}
        <Link href="/dashboard/science/biology" className="group block">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg cursor-pointer">
            <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Dna size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Life Science</h3>
            <p className="text-slate-600 text-sm mb-4">
              Explore living organisms, ecosystems, and the building blocks of life.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-emerald-600">
              Explore Life <DottedArrow size={24} className="ml-2 rotate-180" />
            </div>
          </div>
        </Link>
      </div>

      {/* Scientific Method Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">The Scientific Method</h2>
        <div className="grid md:grid-cols-5 gap-6">
          {[
            { step: "Observe", desc: "Notice something interesting" },
            { step: "Question", desc: "Ask why it happens" },
            { step: "Hypothesis", desc: "Make an educated guess" },
            { step: "Experiment", desc: "Test your hypothesis" },
            { step: "Conclusion", desc: "Analyze your results" }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg mx-auto mb-3">
                {index + 1}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{item.step}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
