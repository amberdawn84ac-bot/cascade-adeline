import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';

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

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const userData = await prisma.user.findUnique({ where: { id: user.userId }, select: { gradeLevel: true } });
    const gradeBracket = getGradeBracket(userData?.gradeLevel ?? '');
    const topicKey = query.toLowerCase().trim();

    const cached = await getCachedContent('history-timeline', topicKey, gradeBracket);
    if (cached) {
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'History', activityType: 'historical-research',
        activityName: `Historical Research: ${cached.topic}`,
        metadata: { topic: query },
        masteryDemonstrated: true,
      });
      return NextResponse.json({ ...cached, creditsEarned: creditResult.creditsEarned, standardLinked: creditResult.standardLinked, cached: true });
    }

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
    }).withStructuredOutput(evidenceBoardSchema);

    console.log('[history/generate] Starting timeline generation for:', query);
    try {
      const result = await llm.invoke([
        { 
          role: 'system', 
          content: `You are Adeline, teaching historiography - the art of investigating the gap between standard textbook narratives and primary source evidence.

CRITICAL MISSION: Do not just recite history. Present the standard narrative, then present the gritty, primary-source reality. Force the student to look at the gap between the two.

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
      
      // Award credits for historical research
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'History',
        activityType: 'historical-research',
        activityName: `Historical Research: ${result.topic}`,
        metadata: {
          topic: query,
          eventsCount: result.events.length,
          primarySourceCitation: result.primarySourceCitation,
        },
        masteryDemonstrated: true,
      });

      await createTranscriptEntryWithCredits(
        user.userId,
        `Historical Research: ${result.topic}`,
        'History',
        creditResult,
        `Researched ${result.topic} using primary source: ${result.primarySourceCitation}`,
        { timeline: result }
      );

      await saveToCache('history-timeline', topicKey, gradeBracket, result as unknown as Record<string, unknown>);

      return NextResponse.json({
        ...result,
        creditsEarned: creditResult.creditsEarned,
        standardLinked: creditResult.standardLinked,
        cached: false,
      });
    } catch (llmError) {
      console.error("[history/generate] LLM error, using fallback:", llmError);
      
      // Graceful fallback if AI fails - matches evidenceBoardSchema structure
      return NextResponse.json({
        topic: query,
        standardNarrative: `The standard textbook story about ${query} usually presents a simplified version of events, skipping over the complex realities and the diverse perspectives of all the people involved.`,
        primaryEvidence: `[Historical Document]\n\nThe historical record shows that events were experienced differently depending on one's social position, economic status, and geographical location. Primary sources from this period reveal competing interests and vastly different outcomes for different groups of people.`,
        primarySourceCitation: "Various primary source documents from the historical period",
        localConnection: `The events surrounding ${query} had significant impacts on Oklahoma Territory and the people living here, including effects on tribal nations, settlers, and the development of the region's laws and land use patterns.`,
        detectiveQuestion: `Compare the standard textbook narrative with the primary source evidence. What perspectives or details are missing from the simplified version? Whose voices are centered, and whose are left out?`,
        events: [
          {
            year: "Early Period",
            title: "The context leading up to the event",
            description: "Understanding the economic, social, and political conditions that made this event possible requires examining the power structures and competing interests of the time."
          },
          {
            year: "Main Period",
            title: `The central events of ${query}`,
            description: "When the event actually occurred, it was experienced differently depending on a person's social standing and geographical location. Primary sources reveal multiple perspectives."
          },
          {
            year: "Aftermath",
            title: "The long-term consequences",
            description: "The effects of this event rippled through generations, shaping policies and social structures that we still live with today."
          }
        ],
        modernParallel: "Many of the same power dynamics, economic incentives, and social struggles that defined this historical event are still present in modern society, just in different forms. Historical patterns of inequality and injustice often repeat themselves through new policies and systems.",
        actionPath: {
          policyReform: "Laws and policies that perpetuate historical inequalities and systemic injustice",
          advocacyTarget: "Contact your local and federal representatives to advocate for policy reform that addresses these historical patterns",
          draftLetter: `Dear Representative,\n\nI am a student currently studying the history of ${query}. Through my research into primary sources and historical records, I have learned that the systemic issues from that era are still present today in our modern policies.\n\nI urge you to review current laws that perpetuate these historical inequalities and work towards a more equitable system that learns from our past mistakes. History shows us that when we ignore the lessons of the past, we risk repeating the same injustices.\n\nI respectfully request that you:\n1. Review policies that mirror historical patterns of inequality\n2. Support reforms that address systemic injustice\n3. Advocate for those currently impacted by these policies\n\nSincerely,\nA Concerned Student and Citizen`
        }
      });
    }
  } catch (error) {
    console.error("[history/generate] Timeline generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: "Failed to generate timeline",
      details: errorMessage
    }, { status: 500 });
  }
}
