import { NextRequest } from 'next/server';
import { embed } from 'ai';
import prisma from '@/lib/db';
import { loadConfig } from '@/lib/config';
import { getEmbeddingModel } from '@/lib/ai-models';

type SourceType = 'PRIMARY' | 'CURATED' | 'SECONDARY' | 'MAINSTREAM';

export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query?: string };
  if (!query || typeof query !== 'string' || !query.trim()) return new Response('Missing query', { status: 400 });

  const config = loadConfig();
  const embeddingModelId = config.models.embeddings || 'text-embedding-3-small';

  const embeddingResult = await embed({
    model: getEmbeddingModel(embeddingModelId),
    value: query,
  });
  const embeddingLiteral = `[${embeddingResult.embedding.join(',')}]`;

  const docs = await prisma.$queryRawUnsafe<
    Array<{ id: string; title: string; content: string; source_type: SourceType; source_url: string | null; similarity: number }>
  >(
    `SELECT id, title, content, source_type, source_url,
            1 - (embedding <=> $1::vector) AS similarity
     FROM hippocampus_documents
     WHERE 1 - (embedding <=> $1::vector) > 0.5
     ORDER BY similarity DESC
     LIMIT 10`,
    embeddingLiteral,
  );

  return Response.json({ results: docs });
}
