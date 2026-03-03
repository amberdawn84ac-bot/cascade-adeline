import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const experimentSchema = z.object({
  title: z.string().describe("A fun, catchy title for the experiment"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  timeRequired: z.string().describe("Estimated time, e.g., '30 minutes'"),
  safetyWarnings: z.array(z.string()).describe("Important safety precautions"),
  materials: z.array(z.string()).describe("List of common household materials needed"),
  procedures: z.array(z.string()).describe("Clear, step-by-step instructions"),
  theScience: z.string().describe("A Socratic, classical explanation of the scientific principles at work"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true }
    });
    
    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : 'The student is in middle school.';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';

    const body = await req.json();
    const { query } = body;
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || "gpt-4o",
      temperature: 0.7,
    }).withStructuredOutput(experimentSchema);

    const result = await llm.invoke([
      { 
        role: 'system', 
        content: `You are Adeline, a wise classical educator. ${gradeContext} ${styleContext} The student wants a hands-on science experiment related to their topic. Generate a safe, highly educational experiment using common household items. Focus on true scientific inquiry and observation. MUST deeply adapt the vocabulary, the complexity of the 'procedures', and 'theScience' explanation to perfectly match their specific grade level and learning style.` 
      },
      { role: 'user', content: `Topic: ${query}` }
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Experiment generation error:", error);
    return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 });
  }
}
