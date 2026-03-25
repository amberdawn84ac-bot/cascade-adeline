import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { DynamicLessonViewer } from '@/components/lessons/DynamicLessonViewer';
import { notFound } from 'next/navigation';

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
  
  const contentBlocks = lesson.lessonJson as any[];
  const sessionState = lesson.studentProgress[0] || null;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <DynamicLessonViewer 
        contentBlocks={contentBlocks}
        lessonTitle={lesson.title}
        subjectTrack={lesson.subject}
        scriptureFoundation={undefined} // Extract from blocks if needed
        credits={undefined} // Calculate based on blocks if needed
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
