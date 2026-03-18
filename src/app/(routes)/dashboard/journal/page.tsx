import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { JournalTimeline } from '@/components/journal/JournalTimeline';
import { ReflectionPrompt } from '@/components/journal/ReflectionPrompt';

interface ActivityEntry {
  id: string;
  activityName: string;
  mappedSubject: string;
  dateCompleted: Date;
  creditsEarned: number;
  notes?: string;
  metadata?: any;
}

interface DailyReflection {
  id: string;
  prompt: string;
  content: string;
  date: Date;
  createdAt: Date;
}

function groupByDate(activities: ActivityEntry[], reflections: DailyReflection[]) {
  const reflectionsByDate = new Map<string, DailyReflection>();
  for (const reflection of reflections) {
    const refDate = new Date(reflection.date);
    refDate.setHours(0, 0, 0, 0);
    reflectionsByDate.set(refDate.getTime().toString(), reflection);
  }
  const groups: Record<string, { activities: ActivityEntry[]; reflection?: DailyReflection; dateKey: number }> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const activity of activities) {
    const activityDate = new Date(activity.dateCompleted);
    activityDate.setHours(0, 0, 0, 0);
    
    let label: string;
    if (activityDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (activityDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = activityDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: activityDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }

    if (!groups[label]) {
      const dateKey = activityDate.getTime();
      groups[label] = {
        activities: [],
        reflection: reflectionsByDate.get(dateKey.toString()),
        dateKey,
      };
    }
    groups[label].activities.push(activity);
  }

  return groups;
}

export default async function JournalPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // Fetch all completed activities from TranscriptEntry
  const transcriptEntries = await prisma.transcriptEntry.findMany({
    where: { userId: user.userId },
    orderBy: { dateCompleted: 'desc' },
    take: 100, // Last 100 activities
    select: {
      id: true,
      activityName: true,
      mappedSubject: true,
      dateCompleted: true,
      creditsEarned: true,
      notes: true,
      metadata: true,
    },
  });

  const activities: ActivityEntry[] = transcriptEntries.map(entry => ({
    id: entry.id,
    activityName: entry.activityName,
    mappedSubject: entry.mappedSubject,
    dateCompleted: entry.dateCompleted,
    creditsEarned: entry.creditsEarned.toNumber(),
    notes: entry.notes || undefined,
    metadata: entry.metadata,
  }));

  // Fetch daily reflections
  const dailyReflections = await prisma.dailyReflection.findMany({
    where: { studentId: user.userId },
    orderBy: { date: 'desc' },
    take: 30, // Last 30 days
  });

  const reflections: DailyReflection[] = dailyReflections.map(r => ({
    id: r.id,
    prompt: r.prompt,
    content: r.content,
    date: r.date,
    createdAt: r.createdAt,
  }));

  // Check if today's reflection exists
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayReflection = reflections.find(r => {
    const refDate = new Date(r.date);
    refDate.setHours(0, 0, 0, 0);
    return refDate.getTime() === today.getTime();
  });

  const groupedActivities = groupByDate(activities, reflections);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFEF7] to-[#FFF3E7] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            📖 Daily Journal
          </h1>
          <p className="text-[#2F4731]/70">
            A chronological timeline of everything you've accomplished
          </p>
        </div>

        {/* Daily Reflection Prompt */}
        <ReflectionPrompt existingReflection={todayReflection ? {
          prompt: todayReflection.prompt,
          content: todayReflection.content,
          createdAt: todayReflection.createdAt,
        } : null} />

        {/* Timeline */}
        <JournalTimeline groupedActivities={groupedActivities} />
      </div>
    </div>
  );
}
