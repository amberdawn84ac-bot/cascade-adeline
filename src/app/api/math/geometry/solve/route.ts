import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';

const geometrySchema = z.object({
  answer: z.string().describe("The final numerical answer with units"),
  steps: z.array(z.string()).describe("Step-by-step solution walkthrough"),
  formula: z.string().describe("The geometric formula used e.g. 'Area = π × r²'"),
  visualDescription: z.string().describe("A brief description of what the shape looks like"),
  funFact: z.string().describe("An interesting real-world application of this geometric concept"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { problem } = await req.json();
    if (!problem) return NextResponse.json({ error: 'Missing problem' }, { status: 400 });

    const studentCtx = await getStudentContext(user.userId, { subjectArea: 'Mathematics' });

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.3,
    }).withStructuredOutput(geometrySchema);

    try {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are Adeline, a wise and encouraging classical mathematics tutor. Solve this geometry problem step by step. Show every calculation clearly. Connect the math to real-world examples they would relate to. Keep your tone warm, accessible, and supportive. Remind them that making mistakes is how we learn math.${studentCtx.systemPromptAddendum}`,
        },
        { role: 'user', content: `Geometry problem: ${problem}` },
      ]);

      // Award credits for geometry problem solving
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'Mathematics',
        activityType: 'geometry',
        activityName: 'Geometry Problem Solving',
        metadata: {
          problem,
          formula: result.formula,
          answer: result.answer,
        },
        masteryDemonstrated: true,
      });

      await createTranscriptEntryWithCredits(
        user.userId,
        'Geometry Problem Solving',
        'Mathematics',
        creditResult,
        `Solved geometry problem using ${result.formula}: ${result.answer}`,
        { geometrySolution: result }
      );

      return NextResponse.json({
        ...result,
        creditsEarned: creditResult.creditsEarned,
        standardLinked: creditResult.standardLinked,
      });
    } catch (llmError) {
      console.error('Geometry solve LLM error:', llmError);
      
      // Graceful fallback if AI fails
      return NextResponse.json({
        steps: [
          "Let's break this down together.",
          "First, identify what information is given in the problem.",
          "Second, what are we trying to find?",
          "Third, recall the relevant geometry formula (like Area = πr² for a circle or a² + b² = c² for a right triangle)."
        ],
        finalAnswer: "I need a bit more time to calculate the exact answer, but try setting up the equation with the steps above!",
        realWorldConnection: "Geometry is everywhere—from the angle of a roof to the area of a garden bed.",
        encouragement: "Math is a practice. If you don't get it right the first time, you're just learning how *not* to solve it. Keep going!"
      });
    }
  } catch (error) {
    console.error('Geometry solve error:', error);
    return NextResponse.json({ error: 'Failed to solve geometry problem' }, { status: 500 });
  }
}

