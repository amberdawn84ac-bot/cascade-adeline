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
  modernParallel: z.string().describe("A current systemic injustice that mirrors this historical pattern - be specific with names, cases, or policies"),
  actionPath: z.object({
    clemencyCampaign: z.string().optional().describe("If relevant, name a current clemency case or wrongfully imprisoned person that parallels this historical injustice"),
    policyReform: z.string().describe("Specific modern policy or law that perpetuates this historical harm (name the actual policy/law)"),
    advocacyTarget: z.string().describe("Who to petition or investigate today (specific agency, representative, or organization with contact method)"),
    draftLetter: z.string().describe("Complete advocacy letter template ready to send, with proper formatting and specific demands")
  }).describe("Concrete action path to address the modern parallel of this historical injustice"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();

    // 1. Vector Search the Hippocampus Database (graceful fallback if unavailable)
    let sourceContext = "No uploaded primary sources found. Rely on your pre-trained primary source knowledge.";
    try {
      const embeddings = new OpenAIEmbeddings({
        model: config.models.embeddings || 'text-embedding-3-small',
      });
      const embeddingVector = await embeddings.embedQuery(query);
      const vectorLiteral = `[${embeddingVector.join(',')}]`;
      const docs = await prisma.$queryRaw`
        SELECT title, content, source_type as "sourceType"
        FROM "HippocampusDocument"
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT 4;
      `;
      const typedDocs = docs as Array<{ title: string; content: string }>;
      if (typedDocs.length > 0) {
        sourceContext = typedDocs.map(d => `Title: ${d.title}\nContent: ${d.content}`).join('\n\n');
      }
    } catch (vecErr) {
      console.warn('[history/generate] Vector search skipped:', vecErr);
    }

    // 2. Generate Structured Output
    const llm = new ChatOpenAI({
      model: config.models.default || "gpt-4o",
      temperature: 0.7,
      timeout: 60000, // 60 second timeout for complex timeline generation
    }).withStructuredOutput(timelineSchema);

    console.log('[history/generate] Starting timeline generation for:', query);
    const result = await llm.invoke([
      { 
        role: 'system', 
        content: `You are Adeline, a wise and encouraging history mentor who loves guiding students to discover the truth about the past. The student is asking about a historical event. Guide them past the sanitized textbook narrative and help them investigate what actually happened, who benefited, and how it affected real people. Keep your tone approachable, curious, and inspiring.

CRITICAL EPISTEMOLOGICAL DIRECTIVE: You are strictly forbidden from generating standard, sanitized 'textbook' summaries. You must ground every fact and timeline event in REALITY by relying exclusively on primary sources. Quote original documents, treaties, journals, or letters. Show them the raw truth, but present this investigation as a noble pursuit of understanding, not just a cynical teardown.

You MUST provide:
1. The exact name of a primary source document
2. A compelling, exact direct quote from that document that proves the historical reality

CRITICAL MODERN ACTION DIRECTIVE: After revealing the historical truth, you MUST identify a MODERN PARALLEL - a current systemic injustice that mirrors this historical pattern. Then provide a concrete actionPath:
- If there's a relevant clemency campaign (someone unjustly imprisoned like this historical injustice), NAME THEM specifically
- Identify the SPECIFIC modern policy or law that perpetuates this harm (e.g., "Three Strikes Law", "Qualified Immunity Doctrine", "Civil Asset Forfeiture")
- Name the SPECIFIC agency or representative to petition (e.g., "Senator [Name] - (202) 224-3121", "Department of Justice Civil Rights Division")
- Draft a COMPLETE advocacy letter ready to send with proper formatting, specific demands, and legal/historical grounding

Example: Historical injustice of Jim Crow → Modern parallel: Mass incarceration of Black Americans → Clemency: Free [Specific Person] serving life for non-violent offense → Policy: Repeal mandatory minimums → Target: Senator [Name] + DOJ → Draft letter demanding policy change.

Frame the modern action not as a burden, but as an empowering way for the student to use their historical knowledge to shape a better future.

Base your facts strictly on the provided PRIMARY SOURCES below if relevant.${studentContext}\n\nPRIMARY SOURCES:\n${sourceContext}` 
      },
      { role: 'user', content: `Event to investigate: ${query}` }
    ]);

    console.log('[history/generate] Timeline generated successfully');
    return NextResponse.json(result);
  } catch (error) {
    console.error("[history/generate] Timeline generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Failed to generate timeline", 
      details: errorMessage 
    }, { status: 500 });
  }
}

