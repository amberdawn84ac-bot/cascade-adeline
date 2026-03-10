import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

const fieldProjectSchema = z.object({
  projects: z.array(
    z.object({
      title: z.string().describe('A plain, direct project title'),
      objective: z.string().describe('What the student will do and measure'),
      communityImpact: z.string().describe('Who this helps and why it matters'),
      materialsNeeded: z.array(z.string()).describe('Household or farm items required'),
    })
  ).length(3),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, interests: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `Grade level: ${dbUser.gradeLevel}.` : '';
    const interestContext = dbUser?.interests?.length
      ? `Student interests: ${dbUser.interests.join(', ')}.`
      : '';

    const llm = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0.8 })
      .withStructuredOutput(fieldProjectSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical homestead educator. Generate exactly 3 gritty, real-world science field projects for a homeschool student. ${gradeContext} ${interestContext}

RULES:
- Projects must be grounded in the real homestead: sheep pasture, saltbox greenhouse, chickens, ducks, horses, soil, water, food preservation, or local land.
- Each project must involve actual observation, measurement, or building — not reading or watching.
- Examples of the right spirit: "Test whether the north corner of the sheep pasture has lower nitrogen than the south corner using a vinegar-baking soda soil test", "Calculate how much thermal mass the saltbox greenhouse needs to stay above 40°F on a 20°F night using jugs of water", "Map the invasive plants within 100 feet of the garden fence and identify which ones the chickens will eat".
- Use plain language. No corporate edu-speak.
- Materials must come from the farm or house. No kits, no purchases.`,
      },
      {
        role: 'user',
        content: 'Generate 3 field work projects for me.',
      },
    ]);

    return NextResponse.json(result.projects);
  } catch (error) {
    console.error('Field work generation error:', error);
    return NextResponse.json({ error: 'Failed to generate field projects' }, { status: 500 });
  }
}
