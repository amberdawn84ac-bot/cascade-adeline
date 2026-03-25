import { getSessionUser } from '@/lib/auth';
import { lessonOrchestrator } from '@/lib/langgraph/lesson/lessonOrchestrator';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { studentQuery, lessonId } = await req.json();

    // Get student profile
    const studentProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        gradeLevel: true,
        interests: true,
        learningStyle: true,
        age: true
      }
    });

    // Create or get lesson session
    let session = await prisma.lessonSession.findFirst({
      where: {
        userId: user.userId,
        lessonId: lessonId || `temp-${Date.now()}`,
        isActive: true
      }
    });

    const threadId = session?.checkpointId || `lesson-${user.userId}-${Date.now()}`;

    // Create encoder for streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send metadata first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'metadata', data: { status: 'starting' } })}\n\n`)
          );

          // Run the orchestrator
          const result = await lessonOrchestrator.invoke({
            studentQuery,
            userId: user.userId,
            studentProfile,
            lessonBlocks: [],
            currentBlockIndex: 0
          }, {
            configurable: { thread_id: threadId }
          });

          // Stream lesson metadata
          if (result.lessonMetadata) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'lesson_metadata', 
                data: result.lessonMetadata 
              })}\n\n`)
            );
          }

          // Stream each block
          for (const block of result.lessonBlocks || []) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'lesson_block', 
                block 
              })}\n\n`)
            );
            
            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Save lesson to database
          if (result.lessonBlocks && result.lessonBlocks.length > 0) {
            const savedLesson = await prisma.lesson.create({
              data: {
                lessonId: lessonId || `lesson-${Date.now()}`,
                title: result.lessonMetadata?.title || studentQuery,
                subject: result.lessonMetadata?.subject_track || 'truth-based-history',
                gradeLevel: studentProfile?.gradeLevel || '8',
                lessonJson: {
                  ...result.lessonMetadata,
                  blocks: result.lessonBlocks
                },
                standardsCodes: [],
                estimatedDuration: result.lessonBlocks.length * 10 // 10 min per block
              }
            });

            // Create/update session
            await prisma.lessonSession.upsert({
              where: {
                userId_lessonId_isActive: {
                  userId: user.userId,
                  lessonId: savedLesson.lessonId,
                  isActive: true
                }
              },
              create: {
                userId: user.userId,
                lessonId: savedLesson.lessonId,
                visibleBlocks: result.lessonBlocks.map((b: any) => b.block_id),
                completedBlocks: [],
                checkpointId: threadId,
                isActive: true
              },
              update: {
                visibleBlocks: result.lessonBlocks.map((b: any) => b.block_id),
                checkpointId: threadId,
                updatedAt: new Date()
              }
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'lesson_saved', 
                lessonId: savedLesson.lessonId 
              })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('[Lesson Stream] Error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('[Lesson Stream API] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
