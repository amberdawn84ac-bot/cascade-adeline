import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import OpenAI from 'openai';
import prisma from '@/lib/db';
import { loadConfig } from '@/lib/config';

const memoryExtractionSchema = z.object({
  facts: z.array(z.object({
    content: z.string().describe("A concise, persistent fact about the user (interests, struggles, ongoing projects, goals, family context)"),
    importance: z.number().min(0).max(1).describe("How critical this memory is (0-1, where 1 is most important)"),
    category: z.enum(['interest', 'struggle', 'project', 'goal', 'family', 'achievement', 'preference']).describe("The type of memory"),
  })).describe("1-3 key facts to remember about this user from the conversation"),
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Extracts important facts from a chat transcript and stores them as embeddings
 * in the ConversationMemory table for long-term episodic memory.
 */
export async function indexConversationMemory(
  userId: string,
  sessionId: string,
  recentMessages: ChatMessage[],
): Promise<void> {
  try {
    // Only process if we have meaningful conversation
    if (recentMessages.length < 2) return;

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.3, // Lower temperature for factual extraction
    }).withStructuredOutput(memoryExtractionSchema);

    // Build conversation context
    const conversationText = recentMessages
      .map(msg => `${msg.role === 'user' ? 'Student' : 'Adeline'}: ${msg.content}`)
      .join('\n\n');

    // Extract facts using LLM
    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are a memory extraction system. Analyze this conversation and extract 1-3 concise, persistent facts about the student that Adeline should remember for future sessions.

Focus on:
- Interests and passions (what they care about)
- Struggles or challenges they're facing
- Ongoing projects or goals
- Family context or relationships
- Achievements or milestones
- Learning preferences

Make each fact specific, actionable, and useful for personalizing future interactions. Avoid generic statements.`,
      },
      {
        role: 'user',
        content: `Conversation:\n\n${conversationText}\n\nExtract the most important facts to remember about this student.`,
      },
    ]);

    // Generate embeddings for each fact
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    for (const fact of result.facts) {
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: fact.content,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Store in database with pgvector
      await prisma.$executeRaw`
        INSERT INTO "ConversationMemory" (
          id, 
          "userId", 
          "session_id", 
          role, 
          content, 
          metadata, 
          embedding, 
          importance, 
          "created_at", 
          "updated_at"
        )
        VALUES (
          gen_random_uuid(),
          ${userId}::uuid,
          ${sessionId},
          'assistant'::"ConversationRole",
          ${fact.content},
          ${JSON.stringify({ category: fact.category, extractedAt: new Date().toISOString() })}::jsonb,
          ${`[${embedding.join(',')}]`}::vector,
          ${fact.importance},
          NOW(),
          NOW()
        )
      `;
    }

    console.log(`[Memex] Indexed ${result.facts.length} memories for user ${userId}`);
  } catch (error) {
    console.error('[Memex] Error indexing conversation memory:', error);
    // Don't throw - memory indexing should be non-blocking
  }
}

/**
 * Determines if a conversation is significant enough to index.
 * This prevents storing trivial exchanges.
 */
export function shouldIndexConversation(messages: ChatMessage[]): boolean {
  // Require at least 2 messages
  if (messages.length < 2) return false;

  // Calculate total conversation length
  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);

  // Only index if conversation has substance (>200 chars)
  return totalLength > 200;
}

