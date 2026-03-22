import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import prisma from '@/lib/db';
import type { PrimarySourceRecord, PrimarySourceMetadata, InvestigationType } from './types';

const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small');

export interface RetrieveOptions {
  subjectTrack?: string;
  era?: string;
  investigationType?: InvestigationType;
  narrativeRole?: string;
  limit?: number;
  minSimilarity?: number;
}

export async function findPrimarySources(
  query: string,
  opts: RetrieveOptions = {}
): Promise<PrimarySourceRecord[]> {
  const { limit = 5, minSimilarity = 0.65 } = opts;

  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: query });
  const embeddingStr = `[${embedding.join(',')}]`;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    content: string;
    metadata: unknown;
    similarity: number;
  }>>`
    SELECT
      id,
      title,
      content,
      metadata,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM "HippocampusDocument"
    WHERE source_type = 'PRIMARY'::"SourceType"
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  const mapped = rows.map((row) => {
    const meta = (typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata) as PrimarySourceMetadata;

    if (opts.subjectTrack && !meta.subjectTracks?.includes(opts.subjectTrack)) return null;
    if (opts.era && meta.era !== opts.era) return null;
    if (opts.investigationType && !meta.investigationTypes?.includes(opts.investigationType)) return null;
    if (opts.narrativeRole && meta.narrativeRole !== opts.narrativeRole) return null;

    const record: PrimarySourceRecord = {
      id: row.id,
      title: row.title,
      content: row.content,
      metadata: meta,
      similarity: row.similarity,
    };
    return record;
  });

  const results = mapped.filter((r): r is PrimarySourceRecord => r !== null);

  return results;
}

export async function findSourcePair(
  topic: string,
  opts: { subjectTrack?: string } = {}
): Promise<{ officialClaim: PrimarySourceRecord | null; counterSource: PrimarySourceRecord | null }> {
  const [officialClaims, counterSources] = await Promise.all([
    findPrimarySources(topic, { ...opts, narrativeRole: 'official_claim', limit: 2 }),
    findPrimarySources(topic, {
      ...opts,
      limit: 3,
      minSimilarity: 0.60,
    }),
  ]);

  const counterSource = counterSources.find(
    (s) => s.metadata.narrativeRole !== 'official_claim' && s.metadata.narrativeRole !== 'propagandist'
  ) ?? null;

  return {
    officialClaim: officialClaims[0] ?? null,
    counterSource,
  };
}
