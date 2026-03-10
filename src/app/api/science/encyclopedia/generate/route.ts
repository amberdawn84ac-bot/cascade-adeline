import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const encyclopediaSchema = z.object({
  title: z.string().describe("The specific scientific topic"),
  hypothesis: z.string().describe("The core scientific question or premise"),
  observation: z.string().describe("A deep, classical explanation of the mechanics at work"),
  conclusion: z.string().describe("A definitive summary fact or law of nature"),
  fieldNotes: z.array(z.string()).describe("3 to 4 fascinating, obscure facts about the topic"),
  references: z.array(z.string()).describe("Historical scientists or classical texts that studied this"),
  primarySourceCitation: z.string().describe("The exact name of the original primary source document, journal, or raw data used."),
  directQuote: z.string().describe("A compelling, exact direct quote from that primary source that proves the historical or scientific reality."),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const body = await req.json();
    const { query } = body;
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || "gpt-4o",
      temperature: 0.7,
    }).withStructuredOutput(encyclopediaSchema);

    const result = await llm.invoke([
      { 
        role: 'system', 
        content: `You are Adeline, a wise classical educator. The student is discovering a new scientific concept. Act as a classical naturalist. Explain the concept beautifully, grounded in the natural world and observable laws.

CRITICAL EPISTEMOLOGICAL DIRECTIVE: You are strictly forbidden from generating standard, sanitized 'textbook' summaries. You must ground every lesson and fact in REALITY by relying exclusively on primary sources. Reference actual experiments, raw data, or the original writings of the scientists. Show them the raw truth, even if it is gritty or complex.

You MUST provide:
1. The exact name of a primary source (original scientific paper, experiment journal, or raw data)
2. A compelling, exact direct quote from that primary source that proves the scientific reality${studentContext}` 
      },
      { role: 'user', content: `Topic: ${query}` }
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Encyclopedia generation error:", error);
    return NextResponse.json({ error: "Failed to generate entry" }, { status: 500 });
  }
}
