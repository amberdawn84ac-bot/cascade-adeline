import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

export const maxDuration = 30;

const lessonSchema = z.object({
  lessonTitle: z.string().describe('Specific title for today\'s lesson'),
  lessonType: z.enum(['lesson', 'project', 'activity', 'experiment', 'field-trip']),
  timeEstimate: z.string().describe('How long this will take, e.g. "45 minutes"'),
  lessonContent: z.string().describe(
    'THE ACTUAL LESSON — Adeline teaches the concept directly in 4-7 rich paragraphs. '
    + 'This is NOT a lesson plan. Adeline IS the teacher sitting next to the student right now. '
    + 'Write the real explanation: history, context, how it works, why it matters, vivid details. '
    + 'Include the actual information the student needs — dates, names, techniques, science, stories. '
    + 'Do NOT say "go look this up" or "find pictures" — deliver the knowledge here, inline. '
    + 'Adapt vocabulary and depth precisely to the student\'s grade level.'
  ),
  keyFacts: z.array(z.string()).min(3).max(5).describe(
    '3-5 specific, memorable facts from this lesson the student should retain'
  ),
  imageSearchTerms: z.array(z.string()).min(2).max(4).describe(
    'Specific Google Images search terms to find relevant visuals (e.g. "Lascaux cave paintings France", '
    + '"ochre pigment prehistoric art"). Be specific — not "cave art" but the exact subject.'
  ),
  activity: z.object({
    title: z.string().describe('Name of the hands-on activity'),
    fullInstructions: z.string().describe(
      'COMPLETE, FULLY EXECUTABLE step-by-step instructions. Zero missing details. '
      + 'COOKING/BAKING: include the FULL recipe — every ingredient with exact measurement '
      + '(e.g. "2¼ cups all-purpose flour", "1 tsp baking soda", "¾ cup granulated sugar"), '
      + 'oven temperature (e.g. "Preheat to 375°F"), bake time (e.g. "bake 9-11 minutes"), '
      + 'and every step in order. Do NOT say "add ingredients" — list them all with amounts. '
      + 'MATH: include actual numbers, the full problem set, exact calculations to perform. '
      + 'SCIENCE: include exact quantities, temperatures, wait times, and what to observe. '
      + 'ART/CRAFT: include exact dimensions, quantities of materials, specific motions. '
      + 'RULE: A student with zero prior knowledge must be able to execute this perfectly '
      + 'using only what is written here. If anything is vague, it is wrong.'
    ),
    supplies: z.array(z.string()).describe('Every supply needed with quantities where relevant (e.g. "2¼ cups all-purpose flour", "1 stick butter")'),
  }).describe('The hands-on activity — fully executable with zero missing details'),
  completionCriteria: z.string().describe('Specific evidence that shows mastery — what they made, answered, or demonstrated'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, title, description } = await req.json();
    if (!subject || !title) {
      return NextResponse.json({ error: 'subject and title are required' }, { status: 400 });
    }

    const studentContext = await buildStudentContextPrompt(user.userId);
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true, gradeLevel: true, interests: true },
    });

    // Parse grade level for age-appropriate content enforcement
    const rawGrade = student?.gradeLevel ?? null;
    const gradeNum = (() => {
      if (!rawGrade) return 9;
      const s = rawGrade.trim().toLowerCase();
      if (s === 'k' || s === 'kindergarten') return 0;
      const rangeK = s.match(/^k-(\d+)$/);
      if (rangeK) return Math.round(parseInt(rangeK[1]) / 2);
      const range = s.match(/^(\d+)-(\d+)$/);
      if (range) return Math.round((parseInt(range[1]) + parseInt(range[2])) / 2);
      const n = parseInt(s);
      return isNaN(n) ? 9 : n;
    })();

    const gradeGuard = gradeNum <= 5
      ? `\nAGE-APPROPRIATE LESSON RULES (Elementary — Grade ${gradeNum}):\n- Use simple, concrete language a ${6 + gradeNum}-year-old understands\n- Activities must be hands-on, playful, and safe (no power tools, welding, or shop work)\n- No AP, CLEP, or college-level content\n- Good activity types: nature walks, drawing, counting games, read-alouds, cooking projects, building with blocks/cardboard, simple experiments with household materials\n- Time estimate: 20-45 minutes max\n`
      : gradeNum <= 8
      ? `\nAGE-APPROPRIATE LESSON RULES (Middle School — Grade ${gradeNum}):\n- Exploratory and engaging; connect to real-world problems\n- No AP, CLEP, or dual enrollment yet\n- Good activity types: research projects, science experiments, writing workshops, maker projects, history investigations\n- Time estimate: 45-90 minutes\n`
      : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.7 })
      .withStructuredOutput(lessonSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a brilliant homeschool teacher. You are delivering TODAY'S ACTUAL LESSON — not a plan, not an outline, not a homework assignment.

${studentContext}
${gradeGuard}
The student's name is ${student?.name ?? 'Explorer'}, grade ${rawGrade ?? 'unknown'}.
Their interests: ${(student?.interests ?? []).join(', ') || 'not specified'}.

CRITICAL LESSON DELIVERY RULES:
1. lessonContent IS the lesson. Write it as if you are sitting next to the student teaching them right now.
   - Give them the REAL information: names, dates, how things work, why they matter, vivid stories.
   - If the lesson is about cave art, DESCRIBE the cave paintings — colors used (ochre, charcoal, hematite), the animals depicted, the techniques (blowing pigment through a bone tube, finger painting, scraping), the specific caves (Lascaux, Altamira, Chauvet), what they tell us about early humans.
   - Do NOT write "go find pictures of cave art" — describe what those pictures show. Teach it.
2. imageSearchTerms: Give specific, precise search terms so clicking them immediately shows the right images.
3. activity.fullInstructions: This field must be 100% EXECUTABLE with zero vagueness.
   - COOKING/BAKING lesson: Write the FULL recipe. Every ingredient with exact measurement. Oven temp. Exact bake time. Every step in order. "Add the dry ingredients" is WRONG. "Whisk together 2¼ cups flour, 1 tsp baking soda, and 1 tsp salt in a bowl" is RIGHT.
   - MATH lesson: Write out the actual problems with real numbers. Include the full worked example. Give 3-5 practice problems with specific numbers to solve.
   - SCIENCE experiment: Exact quantities, temps, wait times, what changes to look for.
   - ART/CRAFT: Exact materials with amounts, dimensions, step-by-step motions.
   - Universal rule: A student standing in their kitchen or at their desk must be able to complete this using ONLY what is written here. If they would need to look anything up, you have failed.
4. Adapt every word to the student's exact grade level from the student context above.`,
      },
      {
        role: 'user',
        content: `Generate today's lesson for the course: "${title}" (${subject})\nCourse description: ${description || 'Not provided'}`,
      },
    ]);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[journey/lesson] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate lesson',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
