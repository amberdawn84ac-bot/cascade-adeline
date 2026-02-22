import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import prisma from "@/lib/db";

export async function investigator(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Search HippocampusDocument table using vector search
    // For now, we'll do a simple text search since we don't have vector search set up yet
    const documents = await prisma.hippocampusDocument.findMany({
      where: {
        OR: [
          { content: { contains: content, mode: 'insensitive' } },
          { title: { contains: content, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
    
    // Search Investigation table for related investigations
    const investigations = await prisma.investigation.findMany({
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
    
    // Combine and format results
    const sources = [
      ...documents.map(doc => ({
        type: 'document',
        title: doc.title,
        content: doc.content,
        sourceType: doc.sourceType,
        id: doc.id,
      })),
      ...investigations.flatMap(inv => 
        inv.sources.map(source => ({
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
    
    // Generate response based on findings
    let response = "I've searched for information about your query. ";
    
    if (sources.length === 0) {
      response += "I couldn't find any specific information about that topic in our database. Would you like me to help you investigate this further?";
    } else {
      response += `I found ${sources.length} relevant sources:\n\n`;
      sources.forEach((source, index) => {
        response += `${index + 1}. **${source.title}**\n`;
        response += `   ${source.content.substring(0, 200)}...\n\n`;
      });
    }
    
    return {
      investigation_sources: sources,
      response_content: response,
      metadata: {
        ...state.metadata,
        investigator: {
          sources_found: sources.length,
          search_query: content,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Investigator error:', error);
    return {
      response_content: "I'm having trouble accessing our investigation database right now. Let me help you with a general response instead.",
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
