import { getSessionUser } from '@/lib/auth';
import { lessonBrain } from '@/lib/langgraph/lesson/lessonGraph';
import { subjectFromQuery } from '@/lib/langgraph/lesson/subjectFromQuery';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { studentQuery, lessonId } = await req.json();

    // Get student profile — used as seed values (orchestrator node re-fetches full context)
    const studentProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        gradeLevel: true,
        interests: true,
        learningStyle: true,
        age: true
      }
    });

    const threadId = lessonId || `lesson-${user.userId}-${Date.now()}`;
    const detectedSubject = subjectFromQuery(studentQuery);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', threadId })}\n\n`)
          );

          let allBlocks: any[] = [];
          let metadata: any = null;

          // Stream events from the lessonBrain (8-agent graph)
          // Initial state seeds gradeLevel/interests/learningStyle as fallbacks;
          // the orchestrator node calls getStudentContext() to enrich with ZPD, BKT, etc.
          const eventStream = await lessonBrain.streamEvents(
            {
              userId: user.userId,
              topic: studentQuery,
              subject: detectedSubject,
              gradeLevel: studentProfile?.gradeLevel || '8',
              interests: (studentProfile?.interests as string[]) || [],
              learningStyle: studentProfile?.learningStyle || 'EXPEDITION',
              learningMode: (studentProfile?.learningStyle?.toUpperCase() === 'EXPEDITION') ? 'expedition' : 'classic',
            },
            {
              configurable: { thread_id: threadId },
              version: 'v2'
            }
          );

          for await (const event of eventStream) {
            // Broadcast agent progress so the UI can show "Adeline is thinking..."
            if (event.event === 'on_chain_start') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'agent_start',
                  agent: event.name,
                  data: { status: 'running' }
                })}\n\n`)
              );
            }

            if (event.event === 'on_chain_end') {
              const output = event.data?.output;
              if (!output) continue;

              // Emit metadata once we have subject/topic from the graph
              if (!metadata && (output.subject || output.topic)) {
                metadata = {
                  title: output.topic || studentQuery,
                  subject_track: output.subject || detectedSubject,
                  gradeLevel: output.gradeLevel || studentProfile?.gradeLevel || '8',
                  standards_codes: output.standardsCodes || [],
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'lesson_metadata',
                    data: { ...metadata, lessonId: threadId }
                  })}\n\n`)
                );
              }

              // Stream new blocks incrementally as each agent node completes
              if (output.blocks && output.blocks.length > allBlocks.length) {
                const newBlocks = output.blocks.slice(allBlocks.length).map((block: any, i: number) => ({
                  ...block,
                  block_id: block.block_id || `${event.name}-${allBlocks.length + i}-${Date.now()}`,
                }));
                for (const block of newBlocks) {
                  try {
                    // Verify the block can be serialised before sending to the client
                    const serialised = JSON.stringify({ type: 'lesson_block', block });
                    controller.enqueue(encoder.encode(`data: ${serialised}\n\n`));
                    allBlocks.push(block);
                  } catch (serErr) {
                    console.warn('[Lesson Stream] Skipping unserializable block:', serErr);
                  }
                  // Small delay for a natural streaming feel
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
            }

            if (event.event === 'on_chain_error') {
              // Log agent errors but continue — other agents may still succeed
              console.error('[Lesson Stream] Agent error:', event.name, event.data?.error);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'agent_error',
                  agent: event.name,
                  message: 'This section could not be generated — continuing with the rest of the lesson.',
                })}\n\n`)
              );
            }
          }

          // Save completed lesson to DB
          if (allBlocks.length > 0) {
            const savedLesson = await prisma.lesson.upsert({
              where: { lessonId: threadId },
              create: {
                lessonId: threadId,
                title: metadata?.title || studentQuery,
                subject: metadata?.subject_track || detectedSubject,
                gradeLevel: studentProfile?.gradeLevel || '8',
                lessonJson: {
                  ...metadata,
                  blocks: allBlocks
                },
                standardsCodes: metadata?.standards_codes || [],
                estimatedDuration: allBlocks.length * 10
              },
              update: {
                title: metadata?.title || studentQuery,
                lessonJson: {
                  ...metadata,
                  blocks: allBlocks
                },
                updatedAt: new Date()
              }
            });

            await prisma.lessonSession.upsert({
              where: {
                userId_lessonId_isActive: {
                  userId: user.userId,
                  lessonId: threadId,
                  isActive: true
                }
              },
              create: {
                userId: user.userId,
                lessonId: threadId,
                visibleBlocks: allBlocks.map((b: any) => b.block_id || b.id || ''),
                completedBlocks: [],
                checkpointId: threadId,
                isActive: true
              },
              update: {
                visibleBlocks: allBlocks.map((b: any) => b.block_id || b.id || ''),
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
