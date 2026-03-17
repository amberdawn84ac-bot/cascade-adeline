import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { z } from 'zod';

// NO Edge runtime here - this route uses Prisma for DB fetch
// This is STEP A: Fast DB Fetch

const visualMathSchema = z.object({
  wordProblem: z.string().describe("A real-world word problem that requires calculation"),
  formula: z.string().describe("The mathematical formula to solve (e.g., 'width * height' or 'numerator / denominator')"),
  variables: z.array(z.object({
    name: z.string().describe("Variable name (e.g., 'width', 'height', 'numerator')"),
    min: z.number().describe("Minimum value for the slider"),
    max: z.number().describe("Maximum value for the slider"),
    value: z.number().describe("Initial/default value"),
    label: z.string().optional().describe("Human-readable label for the variable"),
  })).describe("Interactive variables the student can manipulate"),
  targetAnswer: z.number().describe("The correct answer to the word problem"),
  problemType: z.enum(['area', 'perimeter', 'fraction', 'division', 'multiplication', 'generic']).describe("Type of visual to render"),
});

export async function POST(req: NextRequest) {
  try {
    // STEP A: Database fetch (uses Prisma - NOT edge compatible)
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { topic, gradeLevel: requestedGrade } = await req.json();

    // Fetch student context from database
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { 
        gradeLevel: true,
        interests: true,
        learningStyle: true,
      },
    });

    const gradeLevel = requestedGrade || userData?.gradeLevel || '5';
    const studentContext = await buildStudentContextPrompt(user.userId);

    // Build the prompt with all context
    const systemPrompt = `You are Adeline, a math tutor who teaches through VISUAL MANIPULATIVES and hands-on exploration.${studentContext}

CRITICAL VISUAL MATH DIRECTIVE:
- Generate word problems that can be solved by MANIPULATING visual elements
- The student will use SLIDERS to adjust variables and SEE the math happen in real-time
- Choose problem types that have clear visual representations:
  * Area/Perimeter: Student adjusts width/height sliders and sees a rectangle grow/shrink
  * Fractions: Student adjusts numerator/denominator and sees pie slices fill/empty
  * Division: Student adjusts divisor and sees items group into equal sets
  * Multiplication: Student adjusts factors and sees a grid of items expand

VARIABLE DESIGN RULES:
1. Keep ranges reasonable (min: 1-5, max: 10-20 for most problems)
2. Set initial values that are WRONG so the student must explore
3. Make the target answer achievable within the slider ranges
4. Use clear, descriptive labels (e.g., "Width (feet)", "Number of Apples")

WORD PROBLEM RULES:
1. Use real-world scenarios relevant to grade ${gradeLevel}
2. Make it concrete and visual (gardens, pizzas, groups of items)
3. The problem should REQUIRE the student to find the right combination
4. Example: "A garden is rectangular. If the width is 8 feet and the length is 12 feet, what is the area?"

Grade Level: ${gradeLevel}
Topic: ${topic || 'general math practice'}`;

    const prompt = `Generate a visual math challenge for a ${gradeLevel}th grader about: ${topic || 'area and perimeter'}`;

    // STEP B: Pass context to Edge LLM route
    // Serialize the schema for the edge route
    const schemaJson = JSON.stringify(visualMathSchema);

    const edgeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/llm-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: schemaJson,
        prompt,
        systemPrompt,
        model: 'gpt-4o',
        temperature: 0.8,
      }),
    });

    if (!edgeResponse.ok) {
      throw new Error('Edge LLM stream failed');
    }

    // Return the stream directly to the client
    return new Response(edgeResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[math/visual-challenge] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate visual math challenge' },
      { status: 500 }
    );
  }
}
