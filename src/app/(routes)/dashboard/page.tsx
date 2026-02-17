import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { 
  FlaskConical, 
  Calculator, 
  Feather, 
  ScrollText,
  Clock,
  Trophy,
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import Link from 'next/link';

async function getDashboardData(userId: string) {
  // Fetch standards progress grouped by subject
  const progress = await prisma.studentStandardProgress.findMany({
    where: { userId },
    include: { standard: true },
  });

  // Calculate stats per room
  const stats = {
    science: { earned: 0, total: 0, recent: [] as string[] },
    math: { earned: 0, total: 0, recent: [] as string[] },
    ela: { earned: 0, total: 0, recent: [] as string[] },
    history: { earned: 0, total: 0, recent: [] as string[] },
    arcade: { earned: 0, total: 0, recent: [] as string[] },
  };

  progress.forEach(p => {
    const subject = p.standard.subject.toLowerCase();
    const isMastered = p.mastery === 'MASTERED' || p.mastery === 'PROFICIENT';
    
    if (subject.includes('science')) {
      stats.science.total++;
      if (isMastered) stats.science.earned++;
    } else if (subject.includes('math')) {
      stats.math.total++;
      if (isMastered) stats.math.earned++;
    } else if (subject.includes('english') || subject.includes('language') || subject.includes('ela')) {
      stats.ela.total++;
      if (isMastered) stats.ela.earned++;
    } else if (subject.includes('social') || subject.includes('history')) {
      stats.history.total++;
      if (isMastered) stats.history.earned++;
    } else if (subject.includes('computer') || subject.includes('tech') || subject.includes('code') || subject.includes('game')) {
      stats.arcade.total++;
      if (isMastered) stats.arcade.earned++;
    }
  });

  return stats;
}

const ROOMS = [
  {
    id: 'science',
    title: 'The Laboratory',
    subtitle: 'Life Sciences & Chemistry',
    icon: FlaskConical,
    color: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    textColor: 'text-emerald-800',
    description: 'Track experiments, nature journals, and scientific method mastery.',
  },
  {
    id: 'math',
    title: 'The Counting House',
    subtitle: 'Applied Math & Business',
    icon: Calculator,
    color: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-800',
    description: 'Manage your business, calculate profits, and master algebra.',
  },
  {
    id: 'ela',
    title: 'The Scriptorium',
    subtitle: 'Rhetoric & Communication',
    icon: Feather,
    color: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    textColor: 'text-rose-800',
    description: 'Write stories, analyze texts, and build your portfolio.',
  },
  {
    id: 'history',
    title: 'The Great Archive',
    subtitle: 'History & Discernment',
    icon: ScrollText,
    color: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    textColor: 'text-indigo-800',
    description: 'Explore primary sources and uncover the truth of the past.',
  },
  {
    id: 'arcade',
    title: 'The Arcade',
    subtitle: 'Games & Coding',
    icon: Gamepad2,
    color: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    textColor: 'text-violet-800',
    description: 'Play learning games and build your own with code.',
  },
];

export default async function DashboardPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  const stats = await getDashboardData(session.userId);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Welcome back, Explorer!
        </h1>
        <p className="text-[#2F4731]/60 font-medium text-lg">
          Your learning journey is unfolding beautifully. Where shall we go today?
        </p>
      </header>

      {/* The Rooms Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {ROOMS.map((room) => {
          const roomStats = stats[room.id as keyof typeof stats];
          return (
            <Link 
              key={room.id} 
              href={`/dashboard/${room.id}`}
              className={`group relative p-8 rounded-[2rem] border-2 ${room.borderColor} ${room.color} hover:bg-white hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${room.textColor}`}>
                  <room.icon size={32} />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <Trophy size={14} className={room.textColor} />
                  <span>{roomStats.earned} Mastered</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className={`text-2xl font-bold ${room.textColor}`} style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                  {room.title}
                </h2>
                <p className="text-sm font-bold uppercase tracking-widest opacity-60">
                  {room.subtitle}
                </p>
                <p className="text-[#2F4731]/70 leading-relaxed pt-2">
                  {room.description}
                </p>
              </div>

              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                <ArrowRight className={room.textColor} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-[#BD6809]" />
            <h3 className="text-xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Recent Discoveries
            </h3>
          </div>
          <div className="space-y-4">
            <p className="text-center py-8 text-[#2F4731]/40 italic">
              Your recent adventures will appear here. Start chatting to log them!
            </p>
          </div>
        </div>

        <div className="bg-[#2F4731] rounded-[2rem] p-8 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Zone of Proximal Development
            </h3>
            <p className="text-white/80 text-sm">
              Adeline has detected a perfect next step for you in <span className="text-[#BD6809] font-bold">Geometry</span>.
            </p>
            <button className="w-full py-3 bg-white text-[#2F4731] rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#BD6809] hover:text-white transition-colors">
              See Suggestion
            </button>
          </div>
          {/* Decorative circle */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#BD6809]/20 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
}
