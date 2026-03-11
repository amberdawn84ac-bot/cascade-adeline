import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const requestSchema = z.object({
  category: z.enum(['preservation', 'livestock-sheep', 'livestock-poultry', 'livestock-horses', 'greenhouse', 'fiber-arts']),
  focus: z.string().min(3),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

const projectSchema = z.object({
  title: z.string().describe('A direct, no-nonsense project title'),
  category: z.string().describe('The homesteading category'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  seasonalWindow: z.string().describe("When to execute this project, e.g. 'September before first frost'"),
  timeRequired: z.string().describe("Realistic time estimate, e.g. '3 hours over two days'"),
  materials: z.array(z.string()).describe('Specific tools and materials with quantities'),
  steps: z.array(z.string()).describe('Numbered, gritty real-world steps — no hand-holding'),
  safetyNotes: z.array(z.string()).describe('Critical safety warnings specific to this task'),
  yield: z.string().describe("Concrete output, e.g. '18 quart jars of tomatoes' or '4 lbs washed fleece'"),
  communityImpact: z.string().describe('How this skill directly strengthens family food security, self-sufficiency, or community resilience — be specific and motivating'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { category, focus, skillLevel } = requestSchema.parse(body);

    const studentContext = await buildStudentContextPrompt(user.userId);

    const CATEGORY_CONTEXT: Record<string, string> = {
      'preservation': 'water bath canning, pressure canning, lacto-fermentation, dehydrating, freeze-drying, root cellaring, and cold storage',
      'livestock-sheep': 'managing a small sheep flock for wool, milk, and meat — including shearing schedules, hoof care, pasture rotation, lambing, milk processing, and fiber preparation',
      'livestock-poultry': 'raising chickens, ducks, or turkeys for eggs and meat — including brooder setup, feed ratios, butchering, and flock health',
      'livestock-horses': 'horse husbandry including feeding schedules, hoof care, tack maintenance, pasture management, and daily handling',
      'greenhouse': 'managing a 16x60 saltbox-style greenhouse including succession planting, thermal mass heating, ventilation, soil management, and season extension',
      'fiber-arts': 'processing raw wool from shearing through washing, carding, spinning, and dyeing for practical use',
    };

    const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.6 })
      .withStructuredOutput(projectSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical homesteading educator with deep practical knowledge of ${CATEGORY_CONTEXT[category]}. Generate a real, executable homesteading project for a homeschool student.

CRITICAL RULES:
- Every step must be actionable and specific — no vague instructions like "prepare the area"
- Include exact temperatures, quantities, and timings where relevant
- The communityImpact field must be powerful and specific: explain exactly how this skill reduces dependence on grocery stores, builds family resilience, or creates tradeable value
- Match complexity to ${skillLevel} skill level
- This is real homestead work, not a craft project${studentContext}`,
      },
      {
        role: 'user',
        content: `Generate a ${skillLevel} ${category} project focused on: ${focus}`,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Homesteading/generate] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to generate project' }, { status: 500 });
  }
}

