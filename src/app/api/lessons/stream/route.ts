import { getSessionUser } from '@/lib/auth';
import { lessonOrchestrator } from '@/lib/langgraph/lesson/lessonOrchestrator';
import prisma from '@/lib/db';
import { MemorySaver } from '@langchain/langgraph';
import redis from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Redis-based checkpoint saver for LangGraph
class RedisCheckpointSaver extends MemorySaver {
  async put(config: any, checkpoint: any, metadata: any) {
    const key = `checkpoint:${config.configurable.thread_id}`;
    await redis.set(key, JSON.stringify({ checkpoint, metadata }), { ex: 3600 });
    return config;
  }

  async get(config: any) {
    const key = `checkpoint:${config.configurable.thread_id}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  }
}

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

    const threadId = lessonId || `lesson-${user.userId}-${Date.now()}`;

    // Create encoder for streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', threadId })}\n\n`)
          );

          let allBlocks: any[] = [];
          let metadata: any = null;

          // Stream events from LangGraph orchestrator
          const eventStream = await lessonOrchestrator.streamEvents(
            {
              studentQuery,
              userId: user.userId,
              studentProfile,
              lessonBlocks: [],
              currentBlockIndex: 0
            },
            {
              configurable: { thread_id: threadId },
              version: 'v2'
            }
          );

          for await (const event of eventStream) {
            // Stream agent progress
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
              
              // Stream metadata when available
              if (output?.lessonMetadata && !metadata) {
                metadata = output.lessonMetadata;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'lesson_metadata',
                    data: { ...metadata, lessonId: threadId }
                  })}\n\n`)
                );
              }

              // Stream blocks incrementally as they're created
              if (output?.lessonBlocks && output.lessonBlocks.length > allBlocks.length) {
                const newBlocks = output.lessonBlocks.slice(allBlocks.length);
                for (const block of newBlocks) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'lesson_block',
                      block
                    })}\n\n`)
                  );
                  allBlocks.push(block);
                  
                  // Small delay for better streaming UX
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            }
          }

          // Save lesson to database after streaming completes
          if (allBlocks.length > 0) {
            const savedLesson = await prisma.lesson.upsert({
              where: { lessonId: threadId },
              create: {
                lessonId: threadId,
                title: metadata?.title || studentQuery,
                subject: metadata?.subject_track || 'truth-based-history',
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

            // Create/update session with Redis checkpoint
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
                visibleBlocks: allBlocks.map((b: any) => b.block_id),
                completedBlocks: [],
                checkpointId: threadId,
                isActive: true
              },
              update: {
                visibleBlocks: allBlocks.map((b: any) => b.block_id),
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
