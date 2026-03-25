import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { DynamicLessonViewer } from '@/components/lessons/DynamicLessonViewer';
import { notFound } from 'next/navigation';

/**
 * Extract scripture foundation from lesson blocks
 */
function extractScriptureFoundation(blocks: any[]) {
  const scriptureBlock = blocks.find(b => b.block_type === 'scripture');
  if (!scriptureBlock) return null;
  
  return {
    primary_passage: scriptureBlock.reference || '',
    full_text: scriptureBlock.passage || '',
    connection: scriptureBlock.reflection_prompt || scriptureBlock.content || ''
  };
}

/**
 * Calculate credits earned based on lesson content
 */
function calculateCredits(blocks: any[], subject: string) {
  const hasInvestigation = blocks.some(b => b.block_type === 'investigation');
  const primarySourceCount = blocks.filter(b => b.block_type === 'primary_source').length;
  const handsOnCount = blocks.filter(b => b.block_type === 'hands_on').length;
  const quizCount = blocks.filter(b => b.block_type === 'quiz').length;
  
  const credits = [];
  
  // Base subject credit
  if (subject.includes('history') || subject.includes('social')) {
    credits.push({ subject: 'History', hours: 1.5 });
  } else if (subject.includes('science')) {
    credits.push({ subject: 'Science', hours: 1.5 });
  } else if (subject.includes('math')) {
    credits.push({ subject: 'Mathematics', hours: 1.0 });
  } else {
    credits.push({ subject: 'General Studies', hours: 1.0 });
  }
  
  // Critical thinking credit for investigations
  if (hasInvestigation) {
    credits.push({ subject: 'Critical Thinking', hours: 1.0 });
  }
  
  // Research skills for primary sources
  if (primarySourceCount > 0) {
    credits.push({ subject: 'Research Skills', hours: primarySourceCount * 0.25 });
  }
  
  // Practical skills for hands-on activities
  if (handsOnCount > 0) {
    credits.push({ subject: 'Practical Skills', hours: handsOnCount * 0.5 });
  }
  
  // Assessment credit
  if (quizCount > 0) {
    credits.push({ subject: 'Assessment', hours: quizCount * 0.25 });
  }
  
  return credits;
}

export default async function LessonPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return notFound();
  
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      studentProgress: {
        where: { userId: user.userId }
      }
    }
  });
  
  if (!lesson) return notFound();
  
  const lessonData = lesson.lessonJson as Record<string, unknown>;
  const contentBlocks = (lessonData.blocks as any[]) ?? [];
  const sessionState = lesson.studentProgress[0] || null;

  // Extract metadata from lesson blocks
  const scriptureFoundation = extractScriptureFoundation(contentBlocks);
  const credits = calculateCredits(contentBlocks, lesson.subject);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <DynamicLessonViewer 
        contentBlocks={contentBlocks}
        lessonTitle={lesson.title}
        subjectTrack={lesson.subject}
        scriptureFoundation={scriptureFoundation}
        credits={credits}
        onComplete={(results) => {
          // Save quiz results, update progress
          console.log('Lesson completed:', results);
        }}
        sessionState={sessionState}
        lessonId={lesson.id}
      />
    </div>
  );
}
