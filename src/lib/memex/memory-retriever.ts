import OpenAI from 'openai';
import prisma from '@/lib/db';

export interface RetrievedMemory {
  id: string;
  content: string;
  importance: number;
  category: string;
  createdAt: Date;
  similarity: number;
}

/**
 * Retrieves the most relevant memories for a user based on their current query.
 * Uses pgvector cosine similarity search to find contextually relevant past facts.
 */
export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit: number = 3,
): Promise<RetrievedMemory[]> {
  try {
    // Generate embedding for the query
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar memories using pgvector cosine distance
    // Lower distance = more similar
    const memories = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
      importance: number;
      metadata: any;
      created_at: Date;
      similarity: number;
    }>>`
      SELECT 
        id,
        content,
        importance,
        metadata,
        created_at,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector) as similarity
      FROM "ConversationMemory"
      WHERE "userId" = ${userId}::uuid
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector
      LIMIT ${limit}
    `;

    // Transform and filter results
    return memories
      .filter(m => m.similarity > 0.7) // Only return highly relevant memories
      .map(m => ({
        id: m.id,
        content: m.content,
        importance: m.importance,
        category: m.metadata?.category || 'unknown',
        createdAt: m.created_at,
        similarity: m.similarity,
      }));
  } catch (error) {
    console.error('[Memex] Error retrieving memories:', error);
    return []; // Return empty array on error - don't break the flow
  }
}

/**
 * Formats retrieved memories into a context string for injection into system prompts.
 */
export function formatMemoriesForPrompt(memories: RetrievedMemory[]): string {
  if (memories.length === 0) return '';

  const memoryLines = memories.map(m => {
    const age = getMemoryAge(m.createdAt);
    return `- ${m.content} (${m.category}, ${age})`;
  });

  return `\n\n**What I Remember About You:**\n${memoryLines.join('\n')}`;
}

/**
 * Helper to calculate how long ago a memory was created.
 */
function getMemoryAge(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Retrieves all memories for a user (for visualization in Memex UI).
 */
export async function getAllUserMemories(userId: string): Promise<RetrievedMemory[]> {
  try {
    const memories = await prisma.conversationMemory.findMany({
      where: { userId },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        content: true,
        importance: true,
        metadata: true,
        createdAt: true,
      },
    });

    return memories.map(m => ({
      id: m.id,
      content: m.content,
      importance: m.importance,
      category: (m.metadata as any)?.category || 'unknown',
      createdAt: m.createdAt,
      similarity: 1, // Not applicable for full retrieval
    }));
  } catch (error) {
    console.error('[Memex] Error retrieving all memories:', error);
    return [];
  }
}
