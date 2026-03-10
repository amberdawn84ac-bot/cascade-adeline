import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const timelineSchema = z.object({
  topic: z.string().describe("The historical event or era"),
  sanitizedMyth: z.string().describe("The mainstream, sanitized textbook narrative"),
  historicalReality: z.string().describe("The unredacted historical truth based on the primary sources"),
  primarySourcesCiting: z.array(z.string()).describe("List of actual primary sources or documents proving the reality"),
  primarySourceCitation: z.string().describe("The exact name of the original primary source document, journal, or raw data used."),
  directQuote: z.string().describe("A compelling, exact direct quote from that primary source that proves the historical or scientific reality."),
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

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();

    // 1. Vector Search the Hippocampus Database
    const embeddings = new OpenAIEmbeddings({
      modelName: config.models.embeddings || 'text-embedding-3-small',
    });
    const embeddingVector = await embeddings.embedQuery(query);
    const vectorLiteral = `[${embeddingVector.join(',')}]`;
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
        content: `You are Adeline, a classical truth-seeking historian. The student is asking about a historical event. You must shatter the mainstream sanitized narrative and reveal the grit, the money trail, and the real human impact.

CRITICAL EPISTEMOLOGICAL DIRECTIVE: You are strictly forbidden from generating standard, sanitized 'textbook' summaries. You must ground every fact and timeline event in REALITY by relying exclusively on primary sources. Quote original documents, treaties, journals, or letters. Show them the raw truth, even if it is gritty or complex.

You MUST provide:
1. The exact name of a primary source document
2. A compelling, exact direct quote from that document that proves the historical reality

Base your facts strictly on the provided PRIMARY SOURCES below if relevant.${studentContext}\n\nPRIMARY SOURCES:\n${sourceContext}` 
      },
      { role: 'user', content: `Event to investigate: ${query}` }
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Timeline generation error:", error);
    return NextResponse.json({ error: "Failed to generate timeline" }, { status: 500 });
  }
}
