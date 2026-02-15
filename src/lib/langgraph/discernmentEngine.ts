import { embed, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import prisma from '../db';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';

type SourceType = 'PRIMARY' | 'CURATED' | 'SECONDARY' | 'MAINSTREAM';

const SOURCE_ORDER: Record<SourceType, number> = {
  PRIMARY: 0,
  CURATED: 1,
  SECONDARY: 2,
  MAINSTREAM: 3,
};

function sortBySourcePriority<T extends { sourceType: SourceType }>(docs: T[]): T[] {
  return [...docs].sort((a, b) => SOURCE_ORDER[a.sourceType] - SOURCE_ORDER[b.sourceType]);
}

export async function discernmentEngine(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.investigation || config.models.default;

  // Build embedding for similarity search (pgvector)
  const embeddingModelId = config.models.embeddings || 'text-embedding-004';
  const embeddingResult = await embed({
    model: google.textEmbeddingModel(embeddingModelId),
    value: state.prompt,
  });
  const embedding = embeddingResult.embedding;
  const embeddingLiteral = `[${embedding.join(',')}]`;

  const docs = await prisma.$queryRawUnsafe<
    Array<{ id: string; title: string; content: string; source_type: SourceType; source_url: string | null; similarity: number }>
  >(
    `SELECT id, title, content, source_type, source_url,
            1 - (embedding <=> $1::vector) AS similarity
     FROM hippocampus_documents
     WHERE 1 - (embedding <=> $1::vector) > 0.5
     ORDER BY similarity DESC
     LIMIT 8`,
    embeddingLiteral,
  );

  const normalizedDocs = docs.map((d: { id: string; title: string; content: string; source_type: SourceType; source_url: string | null; similarity: number }) => ({
    ...d,
    sourceType: d.source_type,
  })) as Array<{ id: string; title: string; content: string; sourceType: SourceType; similarity: number }>;

  const prioritized = sortBySourcePriority(normalizedDocs)
    .slice(0, 5)
    .map((d) => `- [${d.sourceType}] ${d.title}: ${d.content.slice(0, 500)}`)
    .join('\n');

  const system = `You are Adeline's Discernment Engine — an investigative research assistant with a biblical worldview. Your job is to help students think critically about institutions, corporations, and systems.

Rules:
- ALWAYS trace incentives: Who funded this? Who profits? Who regulated it and did they have conflicts of interest?
- PRIORITIZE primary sources (patents, congressional records, SEC filings, court documents, first-person accounts) over mainstream summaries.
- CENTER human impact. Don't lead with environmental talking points — lead with how real people were harmed.
- CITE your sources with [SOURCE_TYPE] tags so the UI can color-code them.
- Be direct and concise. No hedging, no 'some people say.' Present the evidence and let the student draw conclusions.
- If the retrieved context is insufficient, say so honestly rather than filling gaps with generic information.`;

  const { text } = await generateText({
    model: anthropic(modelId),
    system,
    maxOutputTokens: 800,
    prompt: `User question: ${state.prompt}

Top retrieved context (ordered by priority):
${prioritized || '- none found'}

Respond with a concise investigation summary citing the sources used.`,
  });

  return {
    ...state,
    responseContent: text,
    metadata: {
      ...state.metadata,
      discernmentEngine: {
        model: modelId,
        sourcesUsed: prioritized,
      },
    },
  };
}
