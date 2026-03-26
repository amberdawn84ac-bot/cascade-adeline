import { getSessionUser } from '@/lib/auth';
import { lessonOrchestrator } from '@/lib/langgraph/lesson/lessonOrchestrator';
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
          const emittedBlockIds = new Set<string>();

          // Stream events from lessonOrchestrator (router → sources+scripture parallel → assembler → assessment)
          const eventStream = lessonOrchestrator.streamEvents(
            {
              studentQuery,
              userId: user.userId,
              studentProfile: {
                gradeLevel: studentProfile?.gradeLevel || '8',
                interests: (studentProfile?.interests as string[]) || [],
                learningStyle: studentProfile?.learningStyle || 'EXPEDITION',
                age: null,
                bktSummary: null,
              },
            },
            {
              configurable: { thread_id: threadId },
              version: 'v2' as const,
            }
          );

          console.log('[Lesson Stream] Starting event stream for threadId:', threadId);

          for await (const event of eventStream) {
            // Broadcast agent progress so the UI can show "Adeline is thinking..."
            if (event.event === 'on_chain_start') {
              console.log('[Lesson Stream] Agent started:', event.name);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'agent_start',
                  agent: event.name,
                  data: { status: 'running' }
                })}\n\n`)
              );
            }

            if (event.event === 'on_chain_end') {
              console.log('[Lesson Stream] Agent completed:', event.name, 'output keys:', Object.keys(event.data?.output || {}));
              const output = event.data?.output;
              if (!output) continue;

              // Emit metadata from lessonOrchestrator's lessonMetadata field
              if (!metadata && output.lessonMetadata) {
                metadata = {
                  title: output.lessonMetadata.title || studentQuery,
                  subject_track: output.lessonMetadata.subject_track || detectedSubject,
                  gradeLevel: studentProfile?.gradeLevel || '8',
                  standards_codes: [],
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'lesson_metadata',
                    data: { ...metadata, lessonId: threadId }
                  })}\n\n`)
                );
              }

              // Emit blocks using block_id-based dedup instead of emittedCount
              if (Array.isArray(output.lessonBlocks)) {
                for (const block of output.lessonBlocks) {
                  const blockId = block.block_id || `${event.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                  if (!block.block_id) block.block_id = blockId;
                  
                  // Skip if already emitted (dedup by block_id)
                  if (emittedBlockIds.has(blockId)) continue;
                  emittedBlockIds.add(blockId);

                  // Normalise block_type → type so StreamingLessonRenderer finds the component
                  const normalizedBlock = {
                    ...block,
                    type: block.type || block.block_type,
                  };

                  try {
                    const serialised = JSON.stringify({ type: 'lesson_block', block: normalizedBlock });
                    controller.enqueue(encoder.encode(`data: ${serialised}\n\n`));
                    allBlocks.push(normalizedBlock);
                  } catch (serErr) {
                    console.warn('[Lesson Stream] Skipping unserializable block:', serErr);
                  }
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
            }

            if (event.event === 'on_chain_error') {
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
