import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Gamepad2, Code, Terminal, Cpu } from 'lucide-react';
import { DottedArrow } from '@/components/illustrations';

export default async function ArcadePage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-violet-50 rounded-[2rem] p-8 border border-violet-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-violet-100 rounded-xl text-violet-700">
            <Gamepad2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-violet-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            The Arcade
          </h1>
        </div>
        <p className="text-violet-800/70 text-lg max-w-2xl">
          Welcome to the digital playground! Here you can learn to speak the language of computers, 
          build your own games, and solve logic puzzles.
        </p>
      </div>

      {/* Activities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Coding Challenge */}
        <div className="group bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg cursor-pointer">
          <div className="mb-4 p-3 bg-slate-100 rounded-xl w-fit text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
            <Terminal size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Code a Story</h3>
          <p className="text-slate-600 text-sm mb-4">
            Use simple commands to tell a story. Learn the basics of sequences and loops.
          </p>
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-violet-600">
            Start Coding <DottedArrow size={24} className="ml-2 rotate-180" />
          </div>
        </div>

        {/* Game Design */}
        <div className="group bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg cursor-pointer">
          <div className="mb-4 p-3 bg-pink-100 rounded-xl w-fit text-pink-700 group-hover:bg-pink-500 group-hover:text-white transition-colors">
            <Gamepad2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Game Lab</h3>
          <p className="text-slate-600 text-sm mb-4">
            Design your own platformer game. Create characters, levels, and rules.
          </p>
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-violet-600">
            Enter Lab <DottedArrow size={24} className="ml-2 rotate-180" />
          </div>
        </div>

        {/* Logic Puzzles */}
        <div className="group bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg cursor-pointer">
          <div className="mb-4 p-3 bg-emerald-100 rounded-xl w-fit text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Logic Circuits</h3>
          <p className="text-slate-600 text-sm mb-4">
            Connect the wires to solve the puzzle. Learn how computers think.
          </p>
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-violet-600">
            Solve Puzzle <DottedArrow size={24} className="ml-2 rotate-180" />
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="text-center py-12 border-t border-violet-100">
        <div className="inline-block p-4 bg-violet-50 rounded-full mb-4">
          <Code size={32} className="text-violet-400" />
        </div>
        <h2 className="text-xl font-bold text-violet-900/60">More games loading...</h2>
        <p className="text-sm text-violet-900/40">Check back soon for new challenges!</p>
      </div>
    </div>
  );
}
