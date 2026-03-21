import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { getStudentContext } from '@/lib/learning/student-context';
import { OpenAIEmbeddings } from '@langchain/openai';

const evidenceBoardSchema = z.object({
  topic: z.string().describe("The historical event or era being investigated"),
  standardNarrative: z.string().describe("The simplified, common textbook version of the event - what most history books say happened. Keep this concise and representative of the mainstream narrative."),
  primaryEvidence: z.string().describe("A simulated or real excerpt from a primary source (journal entry, law text, letter, newspaper clipping, court record) from that exact time period that adds nuance or contradicts the standard narrative. Format this as if it's the actual historical document - use period-appropriate language and style."),
  primarySourceCitation: z.string().describe("The exact name and date of the primary source document (e.g., 'Letter from Sarah Thompson to her sister, March 15, 1889' or 'Oklahoma Territorial Law 47, Section 3, 1893')"),
  localConnection: z.string().describe("How this specific historical event impacted the land, laws, or people in Oklahoma. Be specific - name actual towns, counties, tribes, or regions. If the event didn't directly impact Oklahoma, explain the parallel or related impact in the region."),
  detectiveQuestion: z.string().describe("A critical thinking question asking the student to compare the standard narrative with the primary evidence. Should prompt them to identify gaps, contradictions, or whose perspective is missing."),
  events: z.array(z.object({
    year: z.string(),
    title: z.string(),
    description: z.string()
  })).describe("3 to 5 specific timeline events that show the progression of this historical event"),
  modernParallel: z.string().describe("A current systemic issue that mirrors this historical pattern - be specific with names, cases, or policies"),
  actionPath: z.object({
    clemencyCampaign: z.string().optional().describe("If relevant, name a current clemency case or wrongfully imprisoned person that parallels this historical injustice"),
    policyReform: z.string().describe("Specific modern policy or law that perpetuates this historical harm (name the actual policy/law)"),
    advocacyTarget: z.string().describe("Who to petition or investigate today (specific agency, representative, or organization with contact method)"),
    draftLetter: z.string().describe("Complete advocacy letter template ready to send, with proper formatting and specific demands")
  }).describe("Concrete action path to address the modern parallel of this historical injustice"),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { query } = await req.json();
    if (!query) return Response.json({ error: 'Missing query' }, { status: 400 });

    const studentCtx = await getStudentContext(user.userId);
    const config = loadConfig();

    // Vector Search the Hippocampus Database (graceful fallback if unavailable)
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

    const result = await streamObject({
      model: openai(config.models.default || 'gpt-4o'),
      schema: evidenceBoardSchema,
      prompt: `You are Adeline, a gritty historian teaching historiography - the art of investigating the gap between standard textbook narratives and primary source evidence.

CRITICAL MISSION: Do not just recite history. Present the standard narrative, then present the gritty, primary-source reality. Force the student to look at the gap between the two.

CORE PHILOSOPHY (from "Lies My Teacher Told Me" by James Loewen):
- History is NOT about memorizing dates and names
- History IS about understanding human nature — how unchecked greed and power lead to atrocity
- Acknowledge the ugly truth: humans can be terrible when there are no checks and balances
- ALL historical information must come from PRIMARY SOURCES (diaries, letters, court records, eyewitness accounts, original documents) - NEVER textbooks
- No hidden agendas. No sanitized narratives. No whitewashing.

You MUST provide:
1. standardNarrative: What the textbook says (simplified, often sanitized)
2. primaryEvidence: An actual excerpt from a primary source that adds nuance or contradicts it
3. localConnection: How this event impacted OKLAHOMA specifically (land, laws, people, tribes, towns)
4. detectiveQuestion: A question that makes them compare the two narratives and ask "whose perspective is this?"

OKLAHOMA ANCHORING DIRECTIVE:
- If the event happened in Oklahoma: cite specific towns, counties, tribal nations affected
- If the event was national: explain how it impacted Oklahoma Territory/State
- Examples: Land Run impact on specific tribes, Dust Bowl in specific counties, oil boom in Tulsa, Trail of Tears through Oklahoma, etc.
- Be specific with place names: Creek Nation, Cherokee Nation, Oklahoma City, Tulsa, Guthrie, etc.

PRIMARY SOURCE FORMATTING:
- Format primaryEvidence as if it's the actual document
- Use period-appropriate language and style
- Make it feel archival and authentic
- Cite REAL primary sources when possible

CRITICAL MODERN ACTION DIRECTIVE: After revealing the historical truth, you MUST identify a MODERN PARALLEL - a current systemic injustice that mirrors this historical pattern. Then provide a concrete actionPath:
- If there's a relevant clemency campaign (someone unjustly imprisoned like this historical injustice), NAME THEM specifically
- Identify the SPECIFIC modern policy or law that perpetuates this harm (e.g., "Three Strikes Law", "Qualified Immunity Doctrine", "Civil Asset Forfeiture")
- Name the SPECIFIC agency or representative to petition (e.g., "Senator [Name] - (202) 224-3121", "Department of Justice Civil Rights Division")
- Draft a COMPLETE advocacy letter ready to send with proper formatting, specific demands, and legal/historical grounding

Example: Historical injustice of Jim Crow → Modern parallel: Mass incarceration of Black Americans → Clemency: Free [Specific Person] serving life for non-violent offense → Policy: Repeal mandatory minimums → Target: Senator [Name] + DOJ → Draft letter demanding policy change.

Frame the modern action not as a burden, but as an empowering way for the student to use their historical knowledge to shape a better future.

Base your facts strictly on the provided PRIMARY SOURCES below if relevant.

${studentCtx.systemPromptAddendum}

PRIMARY SOURCES:
${sourceContext}

EVENT TO INVESTIGATE: ${query}`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[history/generate] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({
      error: "Failed to generate timeline",
      details: errorMessage
    }, { status: 500 });
  }
}
