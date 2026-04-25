import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { visualArtifactAgent } from '@/lib/langgraph/lesson/visualArtifactAgent';
import { RenderMode } from '@/types/lesson';

export const runtime = 'nodejs';
export const maxDuration = 30;

const requestSchema = z.object({
  topic: z.string().min(1, 'topic is required'),
  renderMode: z.enum([
    'infographic_poster',
    'animal_infographic',
    'illustrated_recipe',
  ] as const),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, renderMode, gradeLevel, subject } = requestSchema.parse(body);

    // Build a minimal LessonState compatible with visualArtifactAgent
    const minimalState = {
      studentQuery: topic,
      userId: user.userId,
      studentProfile: {
        gradeLevel: gradeLevel || '6',
        interests: [],
        learningStyle: 'EXPEDITION',
        age: null,
        bktSummary: null,
      },
      routingDecision: {
        subject_track: subject || 'general',
        investigation_type: 'compare-sources',
        keywords: topic.split(' '),
        depth: 'quick-overview',
        ethical_dimensions: [],
      },
      lessonBlocks: [],
      lessonMetadata: null,
      renderMode: renderMode as RenderMode,
      sources: [],
      scripture: null,
      currentBlockIndex: 0,
      error: '',
      assessmentNeeded: false,
      assessmentResults: null,
      branchingLogic: undefined,
    };

    const result = await visualArtifactAgent(minimalState as any);
    const artifactBlock = (result.lessonBlocks ?? [])[0];

    if (!artifactBlock) {
      return NextResponse.json(
        { error: 'Failed to generate visual artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      renderMode,
      topic,
      artifact: artifactBlock.content,
      block: artifactBlock,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[visual-artifact] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate visual artifact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
