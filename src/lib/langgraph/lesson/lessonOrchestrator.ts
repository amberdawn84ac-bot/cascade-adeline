import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import redis from '@/lib/redis';
import prisma from '@/lib/db';

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  temperature: 0.7,
});

// Define lesson state using Annotation pattern like existing code
export const LessonState = Annotation.Root({
  studentQuery: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),
  studentProfile: Annotation<any>({
    reducer: (left: any, right: any) => right,
    default: () => null,
  }),
  routingDecision: Annotation<any>({
    reducer: (left: any, right: any) => right,
    default: () => null,
  }),
  sources: Annotation<any[]>({
    reducer: (left: any[], right: any[]) => right,
    default: () => [],
  }),
  scripture: Annotation<any>({
    reducer: (left: any, right: any) => right,
    default: () => null,
  }),
  lessonBlocks: Annotation<any[]>({
    reducer: (left: any[], right: any[]) => right,
    default: () => [],
  }),
  currentBlockIndex: Annotation<number>({
    reducer: (left: number, right: number) => right,
    default: () => 0,
  }),
  lessonMetadata: Annotation<any>({
    reducer: (left: any, right: any) => right,
    default: () => null,
  }),
  error: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),
});

export type LessonStateType = typeof LessonState.State;

// Router Agent - Analyzes query and determines lesson approach
async function routerAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const prompt = `You are the Router Agent for Dear Adeline, analyzing student learning requests.

CORE PHILOSOPHY (CRITICAL):
- History is studied to LEARN FROM MISTAKES
- Present PRIMARY SOURCES (documents, photos, testimonies) - NEVER textbooks
- Ask "Who benefits?" - expose propaganda and hidden agendas
- Let students draw conclusions from evidence
- Reference model: "Lies My Teacher Told Me" by James Loewen
- All historical information must come from PRIMARY SOURCES
- No hidden agendas. No sanitized narratives. No whitewashing.
- Present official narrative alongside primary sources, then ask "who benefits from the gap?"

Analyze this student query: "${state.studentQuery}"

Student context: ${JSON.stringify(state.studentProfile)}

Determine:
1. Primary subject track: truth-based-history, science-exploration, hands-on-farming, math-in-action, language-arts, government-economics, justice-changemaking, or faith-foundations
2. Investigation approach: timeline, follow-the-money, compare-sources, network-map, or propaganda-analysis
3. Keywords for source retrieval (focus on primary source keywords)
4. Estimated depth: quick-overview or deep-dive
5. Moral/ethical dimensions (for scripture connection)

Return JSON only:
{
  "subject_track": "...",
  "investigation_type": "...",
  "keywords": ["...", "..."],
  "depth": "...",
  "ethical_dimensions": ["..."]
}`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const decision = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      subject_track: "truth-based-history",
      investigation_type: "compare-sources",
      keywords: state.studentQuery.split(' '),
      depth: "deep-dive"
    };
    
    return { routingDecision: decision };
  } catch (error) {
    console.error('[Router Agent] Parse error:', error);
    return { 
      routingDecision: {
        subject_track: "truth-based-history",
        investigation_type: "compare-sources",
        keywords: state.studentQuery.split(' '),
        depth: "deep-dive"
      }
    };
  }
}

// Source Retriever Agent - Finds primary sources from database
async function sourceRetrieverAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const { keywords, subject_track } = state.routingDecision!;
  
  try {
    // Query primary sources from database
    const sources = await prisma.primarySource.findMany({
      where: {
        isActive: true,
        OR: keywords.map((keyword: string) => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } },
            { creator: { contains: keyword, mode: 'insensitive' } }
          ]
        })),
        subjectTrack: {
          in: [subject_track, 'general']
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no sources found, create placeholder sources with AI
    if (sources.length === 0) {
      const prompt = `Generate 2-3 placeholder primary source descriptions for a lesson on: ${state.studentQuery}

Topic: ${state.studentQuery}
Subject: ${subject_track}
Investigation: ${state.routingDecision!.investigation_type}

For each source, provide:
- source_type (document, photo, audio, artifact)
- title
- excerpt (key quote or description)
- date (historical period)
- creator (who made it)
- context (why it matters)

Return JSON array of sources.`;

      const response = await model.invoke([new HumanMessage(prompt)]);
      const content = response.content.toString();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const aiSources = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      
      return { sources: aiSources };
    }

    return { sources };
  } catch (error) {
    console.error('[Source Retriever] Error:', error);
    return { sources: [] };
  }
}

// Scripture Connector Agent - Finds relevant biblical passages
async function scriptureConnectorAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const ethical_dimensions = (state.routingDecision as any)?.ethical_dimensions || [];
  
  const prompt = `You are the Scripture Connector Agent for Dear Adeline.

Find biblical passages relevant to this topic:
Topic: ${state.studentQuery}
Investigation: ${state.routingDecision?.investigation_type}
Ethical dimensions: ${ethical_dimensions.join(', ')}

Requirements:
- Find 1 PRIMARY passage most directly relevant
- Include Hebrew/Greek insights if applicable
- Explain the connection clearly
- Provide reflection question
- Avoid proof-texting - find genuine connections

Return JSON:
{
  "primary_passage": "Reference (e.g., Leviticus 25:23)",
  "text": "Full verse text",
  "connection": "How this applies to the investigation",
  "hebrew_greek_notes": "Optional word studies",
  "reflection_prompt": "Question for student to ponder"
}`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const scripture = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { scripture };
  } catch (error) {
    console.error('[Scripture Connector] Error:', error);
    return { scripture: null };
  }
}

// Lesson Assembler Agent - Combines sources and scripture into lesson blocks
async function lessonAssemblerAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const prompt = `You are the Lesson Assembler Agent for Dear Adeline.

Create a lesson structure using these materials:
Student Query: ${state.studentQuery}
Sources: ${JSON.stringify(state.sources)}
Scripture: ${JSON.stringify(state.scripture)}
Investigation Type: ${state.routingDecision?.investigation_type}
Depth: ${state.routingDecision?.depth}

CRITICAL - Truth-First Philosophy:
- Base ALL content on primary sources
- "Follow the money" - who benefited?
- Compare official narrative vs. primary source evidence
- Ask "What do YOU see?" not "Here's what happened"
- Encourage critical thinking, not memorization

Build lesson blocks in this order:
1. Scripture foundation block (if applicable)
2. Text block: Engaging introduction with guiding question
3. Primary source blocks (2-3): Present actual documents/photos with investigation prompts
4. Investigation block: "Follow the money" or comparison activity
5. Quiz block: Test comprehension with branching (score > 80 shows advanced content)
6. Optional: Hands-on block if applicable to topic

Each block needs:
- block_id (unique, e.g., "scripture-1", "text-1", "primary-1")
- block_type (text, scripture, primary_source, investigation, quiz, hands_on)
- order (sequential number)
- content and type-specific fields

For primary_source blocks, include:
- investigation_prompts: ["What do you notice?", "Who created this and why?", "What's missing?"]

For quiz blocks, include:
- branching: { on_score_above_80: { show_blocks: ["advanced-1"] } }

Return JSON:
{
  "title": "Lesson title",
  "subject_track": "${state.routingDecision?.subject_track}",
  "learning_objectives": ["objective 1", "objective 2"],
  "blocks": [...],
  "credits": [{"subject": "US History", "hours": 1.5}]
}`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const lessonData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      title: state.studentQuery,
      subject_track: state.routingDecision?.subject_track || "truth-based-history",
      learning_objectives: ["Investigate primary sources", "Think critically"],
      blocks: [],
      credits: []
    };

    return {
      lessonBlocks: lessonData.blocks || [],
      lessonMetadata: {
        title: lessonData.title,
        subject_track: lessonData.subject_track,
        learning_objectives: lessonData.learning_objectives,
        scripture_foundation: state.scripture,
        credits: lessonData.credits
      }
    };
  } catch (error) {
    console.error('[Lesson Assembler] Error:', error);
    return {
      lessonBlocks: [],
      error: 'Failed to assemble lesson'
    };
  }
}


// Add nodes and edges using the same pattern as existing LangGraph
export const lessonOrchestrator = new StateGraph(LessonState)
  .addNode("router", routerAgent)
  .addNode("sourceRetriever", sourceRetrieverAgent)
  .addNode("scriptureConnector", scriptureConnectorAgent)
  .addNode("lessonAssembler", lessonAssemblerAgent)
  .addEdge(START, "router")
  .addEdge("router", "sourceRetriever")
  .addEdge("router", "scriptureConnector")
  .addEdge("sourceRetriever", "lessonAssembler")
  .addEdge("scriptureConnector", "lessonAssembler")
  .addEdge("lessonAssembler", END)
  .compile();
