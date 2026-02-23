import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Gamepad2, Palette, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';

export default async function GameDesignPage() {
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
          <div>
            <h1 className="text-3xl font-bold text-violet-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Game Design Studio
            </h1>
            <p className="text-violet-800/70 text-lg">
              Create your own games from concept to playable reality
            </p>
          </div>
        </div>
      </div>

      {/* Design Process */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Concept */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
            <Sparkles size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Concept</h3>
          <p className="text-slate-600 text-sm mb-4">
            Brainstorm your game idea and define the core mechanics.
          </p>
          <div className="space-y-2">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">🎮 Game Genre</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">🎯 Target Audience</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">📝 Game Story</p>
            </div>
          </div>
        </div>

        {/* Art */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-pink-100 rounded-xl w-fit text-pink-700">
            <Palette size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Art & Assets</h3>
          <p className="text-slate-600 text-sm mb-4">
            Design characters, environments, and visual elements.
          </p>
          <div className="space-y-2">
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-pink-800 text-sm font-medium">🎨 Character Design</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-pink-800 text-sm font-medium">🏞️ Environment Art</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-pink-800 text-sm font-medium">🎬 Animations</p>
            </div>
          </div>
        </div>

        {/* Mechanics */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-blue-100 rounded-xl w-fit text-blue-700">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Mechanics</h3>
          <p className="text-slate-600 text-sm mb-4">
            Define how players interact with your game world.
          </p>
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">🎮 Controls</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">⚡ Physics</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">🏆 Scoring</p>
            </div>
          </div>
        </div>

        {/* Build */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-violet-100 hover:border-violet-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-green-100 rounded-xl w-fit text-green-700">
            <Gamepad2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Build & Test</h3>
          <p className="text-slate-600 text-sm mb-4">
            Code your game and make it fun to play.
          </p>
          <div className="space-y-2">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm font-medium">💻 Programming</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm font-medium">🐛 Debugging</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm font-medium">🎮 Play Testing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Ideas */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-[2rem] p-8 border border-purple-100">
        <h2 className="text-2xl font-bold text-purple-900 mb-6">Game Idea Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-xl">
            <h3 className="font-bold text-purple-800 mb-2">🚀 Action Game</h3>
            <p className="text-sm text-slate-600">A space shooter where you defend Earth from alien invaders using math problems!</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <h3 className="font-bold text-pink-800 mb-2">🧩 Puzzle Game</h3>
            <p className="text-sm text-slate-600">Match historical events to their correct timeline to save civilization!</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <h3 className="font-bold text-purple-800 mb-2">🏃 Adventure Game</h3>
            <p className="text-sm text-slate-600">Explore ancient civilizations and uncover hidden treasures through coding challenges!</p>
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
