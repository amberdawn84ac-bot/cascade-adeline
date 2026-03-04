import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getZPDConcepts } from '@/lib/zpd-engine';
import { proactiveOpportunityScout } from '@/lib/langgraph/opportunityScout';
import { redirect } from 'next/navigation';
import { 
  FlaskConical, 
  Calculator, 
  Feather, 
  ScrollText,
  Clock,
  Trophy,
  ArrowRight,
  Gamepad2,
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { MissionBriefing } from '@/components/ui/quests/MissionBriefing';
import KnowledgeHerbarium from '@/components/dashboard/KnowledgeHerbarium';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';

async function getStudentDashboardData(userId: string) {
  // Fetch standards progress grouped by subject
  const progress = await prisma.studentStandardProgress.findMany({
    where: { userId },
    include: { standard: true },
  });

  // Fetch ZPD suggestions
  const zpd = await getZPDConcepts(userId, { limit: 1 });

  // Proactively scout for opportunities
  const opportunity = await proactiveOpportunityScout(userId);

  // Calculate stats per room
  const roomStats = {
    science: { earned: 0, total: 0 },
    math: { earned: 0, total: 0 },
    ela: { earned: 0, total: 0 },
    history: { earned: 0, total: 0 },
    arcade: { earned: 0, total: 0 },
  };

  progress.forEach(p => {
    const subject = p.standard.subject.toLowerCase();
    const isMastered = p.mastery === 'MASTERED' || p.mastery === 'PROFICIENT';
    
    if (subject.includes('science')) {
      roomStats.science.total++;
      if (isMastered) roomStats.science.earned++;
    } else if (subject.includes('math')) {
      roomStats.math.total++;
      if (isMastered) roomStats.math.earned++;
    } else if (subject.includes('english') || subject.includes('language') || subject.includes('ela')) {
      roomStats.ela.total++;
      if (isMastered) roomStats.ela.earned++;
    } else if (subject.includes('social') || subject.includes('history')) {
      roomStats.history.total++;
      if (isMastered) roomStats.history.earned++;
    } else if (subject.includes('computer') || subject.includes('tech') || subject.includes('code') || subject.includes('game')) {
      roomStats.arcade.total++;
      if (isMastered) roomStats.arcade.earned++;
    }
  });

  return { roomStats, zpdRecommendation: zpd[0] || null, opportunity };
}

async function getParentDashboardData(userId: string) {
  // Get children linked to this parent
  const children = await prisma.user.findMany({
    where: { parentId: userId },
    include: {
      transcriptEntries: {
        orderBy: { dateCompleted: 'desc' },
        take: 5
      },
      standardsProgress: {
        include: { standard: true },
        take: 10
      }
    }
  });

  // Calculate overall stats for all children
  const totalCredits = children.reduce((sum: number, child: any) => 
    sum + child.transcriptEntries.reduce((childSum: number, entry: any) => childSum + entry.creditsEarned, 0), 0
  );

  const recentActivities = children.flatMap((child: any) => 
    child.transcriptEntries.map((entry: any) => ({
      studentName: child.name,
      activity: entry.activityName,
      credits: entry.creditsEarned,
      date: entry.dateCompleted,
      subject: entry.mappedSubject
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return { children, totalCredits, recentActivities, maxStudents: 6 };
}

async function getTeacherDashboardData(userId: string) {
  // For teachers, we'd fetch their assigned students
  // For now, return similar structure but with higher student limit
  return { 
    children: [], // Would be populated with teacher's students
    totalCredits: 0, 
    recentActivities: [],
    maxStudents: 40 
  };
}

const ROOMS = [
  {
    id: 'science',
    title: 'Science Lab',
    subtitle: 'Life Sciences & Chemistry',
    icon: FlaskConical,
    color: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    textColor: 'text-emerald-800',
    description: 'Track experiments, nature journals, and scientific method mastery.',
  },
  {
    id: 'math',
    title: 'Math Hub',
    subtitle: 'Applied Math & Business',
    icon: Calculator,
    color: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-800',
    description: 'Manage your business, calculate profits, and master algebra.',
  },
  {
    id: 'ela',
    title: 'Deep Dives',
    subtitle: 'Rhetoric & Communication',
    icon: Feather,
    color: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    textColor: 'text-rose-800',
    description: 'Write stories, analyze texts, and build your portfolio.',
  },
  {
    id: 'history',
    title: 'History Zone',
    subtitle: 'History & Discernment',
    icon: ScrollText,
    color: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    textColor: 'text-indigo-800',
    description: 'Explore primary sources and uncover the truth of the past.',
  },
  {
    id: 'arcade',
    title: 'Game Arcade',
    subtitle: 'Games & Coding',
    icon: Gamepad2,
    color: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    textColor: 'text-violet-800',
    description: 'Play learning games and build your own with code.',
  },
];

// Student Dashboard Component
function StudentDashboard({ roomStats, zpdRecommendation, opportunity }: any) {
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

      {/* Proactive Opportunity Mission Briefing */}
      {opportunity && (
        <MissionBriefing
          title={opportunity.opportunity.title}
          description={opportunity.opportunity.description}
          deadline={opportunity.opportunity.deadline}
          briefing={opportunity.briefing}
        />
      )}

      {/* The Rooms Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {ROOMS.map((room) => {
          const stats = roomStats[room.id as keyof typeof roomStats];
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
                  <span>{stats.earned} Mastered</span>
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

      {/* Knowledge Herbarium */}
      <KnowledgeHerbarium userId="current-user" />

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
              {zpdRecommendation ? (
                <>
                  Adeline has detected a perfect next step for you: <span className="text-[#BD6809] font-bold">{zpdRecommendation.name}</span>.
                </>
              ) : (
                "Start exploring to uncover your next learning step!"
              )}
            </p>
            {zpdRecommendation && (
              <button className="w-full py-3 bg-white text-[#2F4731] rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#BD6809] hover:text-white transition-colors">
                Explore {zpdRecommendation.name}
              </button>
            )}
          </div>
          {/* Decorative circle */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#BD6809]/20 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
}

// Unified Educator Dashboard for both Parents and Teachers
function EducatorDashboard({ children, totalCredits, recentActivities, maxStudents, userRole }: any) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          {userRole === 'PARENT' ? 'Parent Dashboard' : 'Teacher Dashboard'}
        </h1>
        <p className="text-[#2F4731]/60 font-medium text-lg">
          {userRole === 'PARENT' 
            ? 'Monitor your children\'s learning progress and achievements.' 
            : 'Manage your students\' learning progress and curriculum.'
          }
        </p>
      </header>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-[#BD6809]" />
            <h3 className="text-lg font-bold text-[#2F4731]">
              {userRole === 'PARENT' ? 'Children' : 'Students'}
            </h3>
          </div>
          <p className="text-3xl font-bold text-[#2F4731]">{children.length} / {maxStudents}</p>
          <p className="text-[#2F4731]/60 text-sm">
            {userRole === 'PARENT' ? 'Active learners' : 'Enrolled students'}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-[#BD6809]" />
            <h3 className="text-lg font-bold text-[#2F4731]">Total Credits</h3>
          </div>
          <p className="text-3xl font-bold text-[#2F4731]">{totalCredits.toFixed(2)}</p>
          <p className="text-[#2F4731]/60 text-sm">
            {userRole === 'PARENT' ? 'Across all children' : 'Across all students'}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-[#BD6809]" />
            <h3 className="text-lg font-bold text-[#2F4731]">Engagement</h3>
          </div>
          <p className="text-3xl font-bold text-[#2F4731]">
            {children.length > 0 ? 'High' : 'No Data'}
          </p>
          <p className="text-[#2F4731]/60 text-sm">Activity level</p>
        </div>
      </div>

      {/* Students/Children List */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-sm">
        <h3 className="text-xl font-bold text-[#2F4731] mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          {userRole === 'PARENT' ? 'Your Children' : 'Your Students'}
        </h3>
        <div className="space-y-4">
          {children.length > 0 ? (
            children.map((child: any) => (
              <div key={child.id} className="flex items-center justify-between p-4 bg-[#FFFEF7] rounded-xl border border-[#E7DAC3]">
                <div>
                  <h4 className="font-bold text-[#2F4731]">{child.name}</h4>
                  <p className="text-sm text-[#2F4731]/60">Grade {child.gradeLevel || 'Not set'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#BD6809]">
                    {child.transcriptEntries.reduce((sum: number, entry: any) => sum + entry.creditsEarned, 0).toFixed(2)} credits
                  </p>
                  <p className="text-xs text-[#2F4731]/60">Total earned</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-[#BD6809] mx-auto mb-3 opacity-50" />
              <p className="text-[#2F4731]/60">
                {userRole === 'PARENT' 
                  ? 'No children linked to your account yet.' 
                  : 'No students assigned to your classes yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[#2F4731] mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Recent Activities
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#FFFEF7] rounded-xl border border-[#E7DAC3]">
                <div>
                  <p className="font-medium text-[#2F4731]">{activity.studentName}: {activity.activity}</p>
                  <p className="text-sm text-[#2F4731]/60">{activity.subject} • {new Date(activity.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#BD6809]">+{activity.credits.toFixed(3)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true }
  });

  if (!user) {
    redirect('/login');
  }

  // Render dashboard based on role
  switch (user.role) {
    case 'STUDENT': {
      // Redirect students straight to chat with Adeline
      redirect('/dashboard/chat');
    }
    case 'PARENT': {
      const { children, totalCredits, recentActivities, maxStudents } = await getParentDashboardData(session.userId);
      return <EducatorDashboard children={children} totalCredits={totalCredits} recentActivities={recentActivities} maxStudents={maxStudents} userRole="PARENT" />;
    }
    case 'TEACHER': {
      const { children, totalCredits, recentActivities, maxStudents } = await getTeacherDashboardData(session.userId);
      return <EducatorDashboard children={children} totalCredits={totalCredits} recentActivities={recentActivities} maxStudents={maxStudents} userRole="TEACHER" />;
    }
    default:
      redirect('/login');
  }
}
