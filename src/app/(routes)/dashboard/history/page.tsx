import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Clock, Users, BookOpen, Search } from 'lucide-react';
import { Timeline } from '@/components/gen-ui/Timeline';
import { getUserAdaptiveContent, getAttentionSpanForGrade, getInteractiveTypeForGrade } from '@/lib/adaptive-content';
import prisma from '@/lib/db';
import { ZPDRecommendations } from '@/components/learning/ZPDRecommendations';

export default async function HistoryPage() {
  const session = await getSessionUser();
  
  if (!session) {
    redirect('/login');
  }

  // Get adaptive content based on user's grade level
  const adaptiveContent = await getUserAdaptiveContent(session.userId, 'history', 'timeline');
  
  // Get user data for grade level
  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { gradeLevel: true }
  });
  
  const attentionSpan = getAttentionSpanForGrade(userData?.gradeLevel || '3');
  const interactiveType = getInteractiveTypeForGrade(userData?.gradeLevel || '3');

  // Fetch timeline entries from database
  const timelineEntries = await prisma.timelineEntry.findMany({
    orderBy: { year: 'asc' },
    take: 20, // Limit to first 20 for performance
  });

  // Format timeline data
  const timelineEvents = timelineEntries.map(entry => ({
    date: entry.year.toString(),
    event: entry.title,
    description: entry.description,
    worldviewNote: entry.worldviewNote,
    sourceType: entry.sourceType,
    sourceCitation: entry.sourceCitation,
    tags: entry.tags,
  }));

  // Sample timeline data if database is empty
  const sampleTimeline = [
    {
      date: "1776",
      event: "Declaration of Independence",
      description: "The thirteen colonies declared independence from British rule, establishing the foundation for American self-governance based on Biblical principles of liberty and justice.",
      worldviewNote: "While textbooks emphasize 'taxation without representation,' primary sources show the Founders' primary concern was preserving religious freedom and establishing a government under God's authority.",
      sourceType: "PRIMARY_SOURCE",
      sourceCitation: "Declaration of Independence, National Archives",
      tags: ["american-revolution", "founding-documents", "religious-freedom"]
    },
    {
      date: "1861-1865",
      event: "American Civil War",
      description: "A conflict between Northern and Southern states primarily over the issue of slavery and states' rights, resulting in the preservation of the Union and abolition of slavery.",
      worldviewNote: "Modern narratives often oversimplify this as purely about slavery, but primary sources reveal complex economic, constitutional, and cultural factors. Many Southerners fought for states' rights, not necessarily to preserve slavery.",
      sourceType: "PRIMARY_SOURCE",
      sourceCitation: "Personal letters, diaries, and government documents from the period",
      tags: ["civil-war", "slavery", "states-rights", "union"]
    },
    {
      date: "1913",
      event: "Federal Reserve Act",
      description: "Congress created the Federal Reserve System, establishing central banking control over America's monetary system.",
      worldviewNote: "Textbooks present this as economic reform, but primary sources show intense opposition from those who warned it would violate the Constitution and give private bankers control over the nation's money supply.",
      sourceType: "PRIMARY_SOURCE",
      sourceCitation: "Congressional Record, 1913",
      tags: ["banking", "federal-reserve", "constitutional-concerns"]
    },
    {
      date: "1964",
      event: "Civil Rights Act",
      description: "Landmark legislation prohibiting discrimination based on race, color, religion, sex, or national origin.",
      worldviewNote: "While celebrated as purely about racial equality, primary sources reveal complex political maneuvering. Some historians note it expanded federal power in ways the Founders never intended.",
      sourceType: "PRIMARY_SOURCE",
      sourceCitation: "Civil Rights Act of 1964, National Archives",
      tags: ["civil-rights", "legislation", "federal-power"]
    }
  ];

  const events = timelineEvents.length > 0 ? timelineEvents : sampleTimeline;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
            <ScrollText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-indigo-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              {adaptiveContent.title}
            </h1>
            <p className="text-indigo-800/70 text-lg">
              {adaptiveContent.description}
            </p>
            <div className="text-sm text-indigo-600 mt-2">
              Grade Level: {userData?.gradeLevel || 'Default'} • Difficulty: {adaptiveContent.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-amber-100 rounded-xl w-fit text-amber-700">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Primary Sources</h3>
          <p className="text-slate-600 text-sm">
            Read actual documents, letters, and records from historical events instead of textbook summaries.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-purple-100 rounded-xl w-fit text-purple-700">
            <Eye size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Critical Analysis</h3>
          <p className="text-slate-600 text-sm">
            Compare what you're taught with what primary sources actually reveal about historical events.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg">
          <div className="mb-4 p-3 bg-red-100 rounded-xl w-fit text-red-700">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Follow the Money</h3>
          <p className="text-slate-600 text-sm">
            Understand who profits from how history is presented and why certain narratives are promoted.
          </p>
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <Clock size={24} className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-indigo-900">Timeline of Events</h2>
        </div>
        
        <Timeline 
          content={events.map(e => `- ${e.date}: ${e.event}`).join('\n')}
          events={events.map(e => ({
            date: e.date,
            event: e.event
          }))}
          title="Historical Events with Primary Source Analysis"
        />
      </div>

      {/* Detailed Event Analysis */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-[2rem] p-8 border border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-900 mb-6">What We're Taught vs. What Primary Sources Reveal</h2>
        
        <div className="space-y-6">
          {events.slice(0, 3).map((event, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-bold text-sm">
                  {event.date}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{event.event}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-bold text-red-800 mb-2">📚 Textbook Version</h4>
                      <p className="text-sm text-slate-600">
                        {event.description.split('.')[0]}. This is typically presented as a simple, straightforward narrative with clear heroes and villains.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h4 className="font-bold text-green-800 mb-2">🔍 Primary Sources Reveal</h4>
                      <p className="text-sm text-slate-600">
                        {event.worldviewNote || "Primary sources often reveal more complex motivations, economic factors, and human elements that textbooks omit."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                    <span className="bg-indigo-100 px-2 py-1 rounded">
                      📄 {event.sourceType?.replace('_', ' ')}
                    </span>
                    {event.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-gray-100 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Help Build the Timeline!</h2>
        <p className="text-purple-100 mb-6">
          This is a collaborative timeline. Contribute primary sources you discover and help uncover the truth about history.
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors">
            Add Primary Source
          </button>
          <button className="bg-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors">
            Research Guidelines
          </button>
        </div>
      </div>
    </div>
  );
}
