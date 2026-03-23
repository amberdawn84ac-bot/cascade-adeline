import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import prisma from '@/lib/db';
import type { PrimarySourceRecord, PrimarySourceMetadata, InvestigationType } from './types';

const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small');
const SIMILARITY_THRESHOLD = 0.85;

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
  const { limit = 5, subjectTrack } = opts;

  console.log(`[hippocampus] Strict retrieval for: "${query}" (track: ${subjectTrack || 'any'})`);

  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: query });
  const embeddingStr = `[${embedding.join(',')}]`;

  // Use strict similarity threshold - no fuzzy matching
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
      AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${SIMILARITY_THRESHOLD}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  console.log(`[hippocampus] Found ${rows.length} candidates above ${SIMILARITY_THRESHOLD} threshold`);

  const mapped = rows.map((row) => {
    const meta = (typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata) as PrimarySourceMetadata;

    // STRICT FILTERING: Filter by specific subjectTrack requested
    if (subjectTrack && !meta.subjectTracks?.includes(subjectTrack)) {
      console.log(`[hippocampus] FILTERED: "${row.title}" (wrong track: ${meta.subjectTracks?.join(', ')}, wanted: ${subjectTrack})`);
      return null;
    }
    
    if (opts.era && meta.era !== opts.era) return null;
    if (opts.investigationType && !meta.investigationTypes?.includes(opts.investigationType)) return null;
    if (opts.narrativeRole && meta.narrativeRole !== opts.narrativeRole) return null;

    console.log(`[hippocampus] ACCEPTED: "${row.title}" (similarity: ${row.similarity.toFixed(3)}, track: ${meta.subjectTracks?.join(', ')})`);

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

  // STRICT: If best match is below threshold, return empty array (no fuzzy matching)
  if (results.length === 0) {
    console.log(`[hippocampus] REJECTED: No sources met ${SIMILARITY_THRESHOLD} threshold for "${query}"`);
    return [];
  }

  console.log(`[hippocampus] RETURNED: ${results.length} sources for "${query}"`);
  return results;
}

export async function findSourcePair(
  topic: string,
  opts: { subjectTrack?: string } = {}
): Promise<{ officialClaim: PrimarySourceRecord | null; counterSource: PrimarySourceRecord | null }> {
  console.log(`[hippocampus] Finding source pair for: "${topic}" (track: ${opts.subjectTrack || 'any'})`);

  // STRICT: Use same high threshold for both searches - no fuzzy matching
  const [officialClaims, counterSources] = await Promise.all([
    findPrimarySources(topic, { ...opts, narrativeRole: 'official_claim', limit: 2 }),
    findPrimarySources(topic, { ...opts, limit: 3 }),
  ]);

  const officialClaim = officialClaims[0] ?? null;
  
  const counterSource = counterSources.find(
    (s) => s.metadata.narrativeRole !== 'official_claim' && s.metadata.narrativeRole !== 'propagandist'
  ) ?? null;

  console.log(`[hippocampus] Pair result - Official: ${officialClaim ? '"' + officialClaim.title + '"' : 'null'}, Counter: ${counterSource ? '"' + counterSource.title + '"' : 'null'}`);

  // STRICT: Return nulls if no good matches found - no synthesis
  return {
    officialClaim,
    counterSource,
  };
}
