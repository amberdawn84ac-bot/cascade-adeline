import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { updateBKT } from '@/lib/learning/bkt';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

const branchModel = new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash', temperature: 0.7 });

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blockId, response, currentBlocks, lessonId } = await req.json();

    // ── Deep Dive: AI-generated follow-up blocks ──────────────────────────────
    // When a student clicks "Dive Deeper" on a block, generate 1-2 follow-up
    // blocks via the pathRouterAgent's AI model and return them as newBlocks.
    // The client pushes them to window.__addLessonBlock for the left-pane renderer.
    if (response?.action === 'deep_dive') {
      try {
        // Fetch the original block content from the saved lesson for context
        const lesson = lessonId
          ? await prisma.lesson.findUnique({ where: { lessonId }, select: { contentBlocks: true, title: true } })
          : null;
        const allBlocks: any[] = Array.isArray(lesson?.contentBlocks) ? lesson.contentBlocks as any[] : [];
        const sourceBlock = allBlocks.find((b: any) => b.block_id === blockId) ?? { block_id: blockId };

        const prompt = `You are the pathRouterAgent for Dear Adeline, a Christian homeschool AI mentor.

A student clicked "Dive Deeper" on this lesson block:
${JSON.stringify(sourceBlock, null, 2)}

Lesson title: ${(lesson as any)?.title ?? 'Unknown'}

Generate 1-2 follow-up blocks that go deeper into this specific content.
Rules:
- Use primary sources, original documents, or real historical evidence
- Apply "follow the money" thinking if relevant
- Make it hands-on or investigative — not just more text
- Each block needs a unique block_id, a block_type, and an order higher than existing blocks
- Valid block_types: text, primary_source, investigation, quiz, hands_on, flashcard, prompt

Return a JSON array of blocks only (no wrapper object):
[
  { "block_id": "deep-1", "block_type": "primary_source", "order": 99, ... },
  { "block_id": "deep-2", "block_type": "investigation", "order": 100, ... }
]`;

        const aiResponse = await branchModel.invoke([new HumanMessage(prompt)]);
        const content = aiResponse.content.toString();
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const newBlocks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // Normalise block_type → type for StreamingLessonRenderer
        const normalised = newBlocks.map((b: any) => ({ ...b, type: b.type ?? b.block_type }));
        return NextResponse.json({ newBlocks: normalised });
      } catch (err) {
        console.error('[Branch API/deep_dive] AI error:', err);
        return NextResponse.json({ newBlocks: [] });
      }
    }

    // Save student response
    await prisma.studentLessonProgress.upsert({
      where: {
        userId_lessonId_blockId: {
          userId: user.userId,
          lessonId: lessonId || 'temp',
          blockId
        }
      },
      create: {
        userId: user.userId,
        lessonId: lessonId || 'temp',
        blockId,
        response,
        completed: true,
        score: response.score,
        timeSpent: response.timeSpent || 0
      },
      update: {
        response,
        completed: true,
        score: response.score,
        timeSpent: response.timeSpent || 0,
        completedAt: new Date()
      }
    });

    // Update BKT if this is a quiz response
    if (response.score !== undefined && response.correct !== undefined) {
      await updateBKT({
        userId: user.userId,
        conceptId: blockId,
        correct: response.correct,
        timestamp: new Date()
      });
    }

    // Determine branching logic
    const branchingResult: any = {
      showBlocks: [],
      hideBlocks: [],
      newBlocks: []
    };

    // Quiz score-based branching
    if (response.score !== undefined) {
      if (response.score > 80) {
        // Show advanced content
        branchingResult.showBlocks = currentBlocks
          .filter((id: string) => id.includes('advanced'))
          .slice(0, 2);
      } else if (response.score < 70) {
        // Show review content
        branchingResult.showBlocks = currentBlocks
          .filter((id: string) => id.includes('review'))
          .slice(0, 2);
      }
    }

    // Choice-based branching
    if (response.choice) {
      // Add blocks based on student choice
      // This would be expanded with actual branching logic from lesson definition
      branchingResult.message = `Exploring ${response.choice}...`;
    }

    // Update lesson session
    const session = await prisma.lessonSession.findFirst({
      where: {
        userId: user.userId,
        lessonId: lessonId || 'temp',
        isActive: true
      }
    });

    if (session) {
      const completedBlocks = [...session.completedBlocks, blockId];
      await prisma.lessonSession.update({
        where: { id: session.id },
        data: {
          completedBlocks,
          studentResponses: {
            ...((session.studentResponses as any) || {}),
            [blockId]: response
          },
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(branchingResult);
  } catch (error) {
    console.error('[Branch API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
