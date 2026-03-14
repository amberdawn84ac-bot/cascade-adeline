import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';
import { loadConfig } from '@/lib/config';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';
import prisma from '@/lib/db';

const requestSchema = z.object({
  category: z.enum(['preservation', 'livestock-sheep', 'livestock-poultry', 'livestock-horses', 'greenhouse', 'fiber-arts']),
  focus: z.string().optional(),
});

function gradeToSkill(gradeStr: string): 'beginner' | 'intermediate' | 'advanced' {
  const bracket = getGradeBracket(gradeStr);
  if (bracket === 'K-2' || bracket === '3-5') return 'beginner';
  if (bracket === '6-8') return 'intermediate';
  return 'advanced';
}

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
    const { category, focus } = requestSchema.parse(body);

    // Derive skill level from student's grade profile — never ask the student
    const userData = await prisma.user.findUnique({ where: { id: user.userId }, select: { gradeLevel: true } });
    const skillLevel = gradeToSkill(userData?.gradeLevel ?? '');
    const focusLabel = focus?.trim() || 'auto';
    const topicKey = `${category}:${focusLabel.toLowerCase()}`;

    // --- Cache-first ---
    const cached = await getCachedContent('domestic-arts', topicKey, skillLevel);
    if (cached) {
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'Domestic Arts', activityType: 'homesteading-project',
        activityName: `Homesteading: ${cached.title}`,
        metadata: { category, focus: focusLabel, difficulty: cached.difficulty, yield: cached.yield },
        masteryDemonstrated: true,
      });
      return NextResponse.json({ ...cached, creditsEarned: creditResult.creditsEarned, standardLinked: creditResult.standardLinked, cached: true });
    }

    const studentContext = await buildStudentContextPrompt(user.userId);

    const CATEGORY_CONTEXT: Record<string, string> = {
      'preservation': 'water bath canning, pressure canning, lacto-fermentation, dehydrating, freeze-drying, root cellaring, and cold storage',
      'livestock-sheep': 'managing a small sheep flock for wool, milk, and meat — including shearing schedules, hoof care, pasture rotation, lambing, milk processing, and fiber preparation',
      'livestock-poultry': 'raising chickens, ducks, or turkeys for eggs and meat — including brooder setup, feed ratios, butchering, and flock health',
      'livestock-horses': 'horse husbandry including feeding schedules, hoof care, tack maintenance, pasture management, and daily handling',
      'greenhouse': 'managing a 16x60 saltbox-style greenhouse including succession planting, thermal mass heating, ventilation, soil management, and season extension',
      'fiber-arts': 'processing raw wool from shearing through washing, carding, spinning, and dyeing for practical use',
    };

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.6 })
      .withStructuredOutput(projectSchema);

    try {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are Adeline, a wise and encouraging homesteading mentor with deep practical knowledge of ${CATEGORY_CONTEXT[category]}. Generate a real, executable homesteading project for a homeschool student.

${studentContext}

CRITICAL RULES:
- Adapt complexity, vocabulary, and safety guidance precisely to the student's grade level above
- Break the project down into manageable, specific steps with exact temperatures, quantities, and timings
- The communityImpact field must show concretely how this skill helps their family or community
- This is real homestead work — treat the student as capable of doing it`,
        },
        {
          role: 'user',
          content: focus?.trim()
            ? `Generate a ${category} project focused on: ${focus}`
            : `Choose and generate the single most valuable ${category} project a student at this grade level should tackle right now. Pick something practical and achievable.`,
        },
      ]);

      // Award credits for domestic arts project
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'Domestic Arts',
        activityType: 'homesteading-project',
        activityName: `Homesteading: ${result.title}`,
        metadata: {
          category,
          focus: focusLabel,
          difficulty: result.difficulty,
          yield: result.yield,
        },
        masteryDemonstrated: true,
      });

      await createTranscriptEntryWithCredits(
        user.userId,
        `Homesteading: ${result.title}`,
        'Domestic Arts',
        creditResult,
        `Completed ${result.difficulty} ${category} project: ${result.yield}`,
        { project: result }
      );

      await saveToCache('domestic-arts', topicKey, skillLevel, result as unknown as Record<string, unknown>);

      return NextResponse.json({
        ...result,
        creditsEarned: creditResult.creditsEarned,
        standardLinked: creditResult.standardLinked,
        cached: false,
      });
    } catch (llmError) {
      console.error('[Homesteading/generate] LLM Error:', llmError);
      // Graceful fallback if AI fails
      return NextResponse.json({
        title: `${category.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Project`,
        category: category,
        difficulty: skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1) as 'Beginner' | 'Intermediate' | 'Advanced',
        seasonalWindow: 'Any appropriate season',
        timeRequired: '1-2 hours',
        materials: ['Basic supplies for ' + category.split('-').join(' ')],
        steps: [
          'Gather your materials and set up a clean workspace.',
          'Begin the core process for your project.',
          'Monitor your progress and make adjustments as needed.',
          'Clean up and properly store your tools.',
        ],
        safetyNotes: ['Always wash your hands before and after.', 'Ask an adult for help with sharp tools or heat.'],
        yield: `A completed ${category} project`,
        communityImpact: 'Learning this skill helps build independence and creates something useful for your family.',
      });
    }
  } catch (error) {
    console.error('[Homesteading/generate] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to generate project' }, { status: 500 });
  }
}

