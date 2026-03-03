import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { embed } from 'ai';
import { getEmbeddingModel } from '@/lib/ai-models';

const timelineSchema = z.object({
  topic: z.string().describe("The historical event or era"),
  sanitizedMyth: z.string().describe("The mainstream, sanitized textbook narrative"),
  historicalReality: z.string().describe("The unredacted historical truth based on the primary sources"),
  primarySourcesCiting: z.array(z.string()).describe("List of actual primary sources or documents proving the reality"),
  events: z.array(z.object({
    year: z.string(),
    title: z.string(),
    description: z.string()
  })).describe("3 to 5 specific timeline events that show the truth"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true }
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';

    const config = loadConfig();

    // 1. Vector Search the Hippocampus Database
    const { embedding } = await embed({
      model: getEmbeddingModel(config.models.embeddings || 'text-embedding-3-small'),
      value: query,
    });

    const vectorLiteral = `[${embedding.join(',')}]`;
    const docs = await prisma.$queryRaw`
      SELECT title, content, source_type as "sourceType"
      FROM hippocampusdocument
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT 4;
    `;

    const typedDocs = docs as Array<{ title: string; content: string }>;
    const sourceContext = typedDocs.length > 0
      ? typedDocs.map(d => `Title: ${d.title}\nContent: ${d.content}`).join('\n\n')
      : "No uploaded primary sources found. Rely on your pre-trained primary source knowledge.";

    // 2. Generate Structured Output
    const llm = new ChatOpenAI({
      modelName: config.models.default || "gpt-4o",
      temperature: 0.7,
    }).withStructuredOutput(timelineSchema);

    const result = await llm.invoke([
      { 
        role: 'system', 
        content: `You are Adeline, a classical truth-seeking historian. ${gradeContext} The student is asking about a historical event. You must shatter the mainstream sanitized narrative and reveal the grit, the money trail, and the real human impact. Base your facts strictly on the provided PRIMARY SOURCES below if relevant. \n\nPRIMARY SOURCES:\n${sourceContext}` 
      },
      { role: 'user', content: `Event to investigate: ${query}` }
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Timeline generation error:", error);
    return NextResponse.json({ error: "Failed to generate timeline" }, { status: 500 });
  }
}
