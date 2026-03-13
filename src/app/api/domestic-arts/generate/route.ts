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

    // Check if this is a simple request that needs clarification first
    const isSimpleRequest = focus.length < 30 && !focus.includes('recipe') && !focus.includes('how to');
    
    if (isSimpleRequest) {
      // Ask clarifying questions instead of overwhelming them
      const conversationalResponse = {
        title: `Let's figure this out together!`,
        category: category,
        difficulty: skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1) as 'Beginner' | 'Intermediate' | 'Advanced',
        seasonalWindow: 'Any time',
        timeRequired: 'Just a few minutes to plan',
        materials: ['First, I need a little more information...'],
        steps: [
          `You mentioned "${focus}". What exactly are you hoping to do?`,
          'Do you have a specific goal in mind, or do you need me to suggest some options?',
          'Are there any materials you already have on hand that you want to use?',
          'Once I know a bit more, I can generate a perfect project plan just for you!'
        ],
        safetyNotes: [],
        yield: 'A great plan tailored to exactly what you want to do',
        communityImpact: `We'll make sure whatever you do has a real impact. Just tell me a bit more first!`,
      };
      return NextResponse.json(conversationalResponse);
    }

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a wise and encouraging homesteading mentor with deep practical knowledge of ${CATEGORY_CONTEXT[category]}. Generate a real, executable homesteading project for a homeschool student. Keep your tone supportive and inspiring.

CRITICAL RULES:
- Break the project down into manageable, bite-sized steps that don't feel overwhelming
- Every step must be actionable and specific
- Include exact temperatures, quantities, and timings where relevant
- The communityImpact field must show how their work matters: explain how this skill helps their family or neighbors
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

