import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { lessonFormatter } from '@/lib/services/LessonFormatterService';
import { z } from 'zod';

const requestSchema = z.object({
  topic: z.string().min(1),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  includeQuizzes: z.boolean().default(true),
  maxBlocks: z.number().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = requestSchema.parse(body);

    console.log(`[api/dynamic-lessons] Generating dynamic content for topic: "${validatedData.topic}"`);

    // Format the lesson content using the new formatter service
    const contentBlocks = await lessonFormatter.formatLessonContent(
      validatedData.topic,
      {
        gradeLevel: validatedData.gradeLevel,
        subject: validatedData.subject,
        includeQuizzes: validatedData.includeQuizzes,
        maxBlocks: validatedData.maxBlocks,
      }
    );

    console.log(`[api/dynamic-lessons] Generated ${contentBlocks.length} content blocks`);

    return NextResponse.json({
      success: true,
      contentBlocks,
      metadata: {
        topic: validatedData.topic,
        gradeLevel: validatedData.gradeLevel,
        subject: validatedData.subject,
        blockCount: contentBlocks.length,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[api/dynamic-lessons] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request parameters',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to generate dynamic lesson content',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// GET endpoint for testing/retrieving cached content
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const gradeLevel = searchParams.get('gradeLevel');
    const subject = searchParams.get('subject');

    if (!topic) {
      return NextResponse.json({
        error: 'Topic parameter is required',
        usage: 'GET /api/lessons/dynamic?topic=your-topic&gradeLevel=3&subject=history'
      }, { status: 400 });
    }

    console.log(`[api/dynamic-lessons] GET request for topic: "${topic}"`);

    const contentBlocks = await lessonFormatter.formatLessonContent(topic, {
      gradeLevel: gradeLevel || undefined,
      subject: subject || undefined,
    });

    return NextResponse.json({
      success: true,
      contentBlocks,
      metadata: {
        topic,
        gradeLevel,
        subject,
        blockCount: contentBlocks.length,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[api/dynamic-lessons] GET Error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve dynamic lesson content',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
