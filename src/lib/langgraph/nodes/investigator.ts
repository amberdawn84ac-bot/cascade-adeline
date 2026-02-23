import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { generateText } from 'ai';
import { getModel } from '@/lib/ai-models';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from "@/lib/db";

export async function investigator(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    // Use Claude for investigations as specified in config
    const investigationModel = getModel(config.models.investigation);
    
    // Search for relevant documents and investigations
    let documents: any[] = [];
    try {
      documents = await prisma.hippocampusDocument.findMany({
        where: {
          OR: [
            { content: { contains: content, mode: 'insensitive' } },
            { title: { contains: content, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });
    } catch (docError) {
      console.warn('HippocampusDocument search failed:', docError);
    }
    
    // Search Investigation table for related investigations
    let investigations: any[] = [];
    try {
      investigations = await prisma.investigation.findMany({
        where: {
          OR: [
            { title: { contains: content, mode: 'insensitive' } },
            { summary: { contains: content, mode: 'insensitive' } },
          ],
        },
        include: {
          sources: true,
        },
        take: 5,
      });
    } catch (invError) {
      console.warn('Investigation search failed:', invError);
    }
    
    // Build the system prompt with Adeline's voice and investigation focus
    const systemPrompt = buildSystemPrompt(config, `Student is investigating: "${content}"`);
    
    // Create the investigation-specific prompt
    const investigatorPrompt = `The student is investigating: "${content}"

I found ${documents.length} documents and ${investigations.length} related investigations in our database.

Available sources:
${documents.map((doc: any, index: number) => 
  `${index + 1}. ${doc.title} (${doc.sourceType}): ${doc.content.substring(0, 200)}...`
).join('\n\n')}

${investigations.map((inv: any, index: number) => 
  `Investigation ${index + 1}: ${inv.title}\n${inv.summary}\nSources: ${inv.sources.length}`
).join('\n\n')}

As Adeline the investigator, I need to:
1. Apply the "follow the money" principle - who profits from this?
2. Center human suffering caused by corporate exploitation, not generic environmental talking points
3. Prioritize primary sources over mainstream summaries
4. Guide the student to evaluate evidence and form their own conclusions
5. Never dictate what to believe - teach discernment

Remember: Always ask "Who profits from me believing this?" and trace funding, incentives, regulatory capture.

Provide an investigative analysis that helps the student think critically about this topic.`;

    // Generate the investigation response using Claude
    const { text } = await generateText({
      model: investigationModel,
      system: systemPrompt,
      prompt: investigatorPrompt,
      temperature: 0.5,
    });
    
    // Combine and format results for metadata
    const sources = [
      ...documents.map((doc: any) => ({
        type: 'document',
        title: doc.title,
        content: doc.content,
        sourceType: doc.sourceType,
        id: doc.id,
      })),
      ...investigations.flatMap((inv: any) => 
        inv.sources.map((source: any) => ({
          type: 'investigation_source',
          title: source.title,
          content: source.content,
          sourceType: source.sourceType,
          investigationId: inv.id,
          investigationTitle: inv.title,
          id: source.id,
        }))
      ),
    ];
    
    return {
      investigation_sources: sources,
      response_content: text || `I found ${sources.length} relevant sources for your investigation. Let's explore what we've discovered and apply some critical thinking to understand who might benefit from this information.`,
      metadata: {
        ...state.metadata,
        investigator: {
          sources_found: sources.length,
          documents_found: documents.length,
          investigations_found: investigations.length,
          search_query: content,
          ai_generated: true,
          model_used: config.models.investigation,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Investigator error:', error);
    return {
      response_content: "I'm having trouble accessing our investigation database right now. Let me help you with a general approach to investigating this topic. Remember to always ask: 'Who profits from this information?' and follow the money to understand the real motivations behind what you're studying.",
      metadata: {
        ...state.metadata,
        investigator: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}
