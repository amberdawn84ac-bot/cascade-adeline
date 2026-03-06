import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const storyPromptSchema = z.object({
  genre: z.string().describe("The story genre (e.g., adventure, mystery, fantasy, science fiction)"),
  setting: z.string().describe("Where and when the story takes place"),
  character: z.string().describe("The main character with a brief description"),
  conflict: z.string().describe("The central problem or challenge the character faces"),
  twist: z.string().describe("An unexpected element or plot twist to make it interesting"),
  wordCountTarget: z.number().describe("Recommended word count based on grade level (100-1000)"),
  inspirationalQuote: z.string().describe("A short quote to inspire the writer"),
  characterFocus: z.string().describe("The specific virtue or character trait being developed (e.g., Diligence, Empathy, Stewardship)"),
  communityImpact: z.string().describe("How this specific project or knowledge can be directly used to serve a neighbor, family member, or the local community"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { theme } = await req.json();
    const requestedTheme = theme || 'any';

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true, interests: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : 'The student is in elementary/middle school.';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';
    const interestsContext = dbUser?.interests?.length ? `Their interests include: ${dbUser.interests.join(', ')}.` : '';

    // Determine word count target based on grade level
    let wordCountTarget = 300;
    if (dbUser?.gradeLevel) {
      const grade = parseInt(dbUser.gradeLevel.replace(/\D/g, '')) || 5;
      if (grade <= 2) wordCountTarget = 100;
      else if (grade <= 4) wordCountTarget = 200;
      else if (grade <= 6) wordCountTarget = 300;
      else if (grade <= 8) wordCountTarget = 500;
      else wordCountTarget = 750;
    }

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || 'gpt-4o',
      temperature: 0.9, // High creativity for story prompts
    }).withStructuredOutput(storyPromptSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a whimsical creative writing mentor. ${gradeContext} ${styleContext} ${interestsContext}

Generate an inspiring, age-appropriate creative writing prompt. The prompt should:
- Spark imagination and creativity
- Be personally relevant to the student's interests when possible
- Include vivid, sensory details
- Avoid clichés and overused tropes
- Encourage emotional depth and character development
- Feel like an invitation to adventure, not an assignment

The word count target should be ${wordCountTarget} words, appropriate for their grade level.

You must strictly frame this activity around serving others. ELA writing should be directed at uplifting others or advocating for the vulnerable. The story should help the student develop empathy, compassion, or a desire to serve their community. Never generate selfish or purely consumer-driven examples.`,
      },
      { 
        role: 'user', 
        content: requestedTheme === 'any' 
          ? 'Generate a creative writing prompt that will excite and inspire this student.'
          : `Generate a creative writing prompt with a ${requestedTheme} theme.`
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Story prompt generation error:', error);
    return NextResponse.json({ error: 'Failed to generate story prompt' }, { status: 500 });
  }
}
