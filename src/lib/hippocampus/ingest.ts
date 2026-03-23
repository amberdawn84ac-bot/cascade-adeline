import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/db';
import type { IngestPrimarySourceInput } from './types';

const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small');

async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: text });
  return embedding;
}

function buildSearchText(input: IngestPrimarySourceInput): string {
  const { title, content, metadata } = input;
  return [
    title,
    metadata.creator,
    metadata.date,
    metadata.era,
    metadata.topics.join(' '),
    metadata.subjectTracks.join(' '),
    content.slice(0, 800),
  ]
    .filter(Boolean)
    .join(' ');
}

export async function ingestPrimarySource(input: IngestPrimarySourceInput): Promise<string> {
  console.log(`[hippocampus] Attempting to ingest: "${input.title}"`);
  
  // STRICT INGESTION RULES
  
  // Rule 1: Must have a subjectTrack
  if (!input.metadata.subjectTracks || input.metadata.subjectTracks.length === 0) {
    console.log(`[hippocampus] REJECTED: Source "${input.title}" has no subjectTracks`);
    throw new Error(`[hippocampus] REJECTED: Source "${input.title}" must have at least one subjectTrack`);
  }
  
  // Rule 2: AI-generated sources cannot be saved to Hippocampus
  if (input.metadata.isAIGenerated) {
    console.log(`[hippocampus] REJECTED: Source "${input.title}" is AI-generated — blocking from Hippocampus`);
    throw new Error(`[hippocampus] AI-generated sources cannot be saved to Hippocampus: "${input.title}"`);
  }
  
  console.log(`[hippocampus] PASSED validation for: "${input.title}" (tracks: ${input.metadata.subjectTracks.join(', ')})`);

  const existing = await prisma.hippocampusDocument.findFirst({
    where: {
      metadata: {
        path: ['sourceSlug'],
        equals: input.metadata.sourceSlug,
      },
    },
    select: { id: true },
  });

  if (existing) {
    console.log(`[hippocampus] Source "${input.metadata.sourceSlug}" already exists — skipping`);
    return existing.id;
  }

  const searchText = buildSearchText(input);
  const embedding = await generateEmbedding(searchText);
  const embeddingStr = `[${embedding.join(',')}]`;
  const id = uuidv4();

  await prisma.$executeRaw`
    INSERT INTO "HippocampusDocument" (id, title, content, metadata, source_type, embedding, chunk_index, created_at, updated_at)
    VALUES (
      ${id}::uuid,
      ${input.title},
      ${input.content},
      ${JSON.stringify(input.metadata)}::jsonb,
      'PRIMARY'::"SourceType",
      ${embeddingStr}::vector,
      0,
      NOW(),
      NOW()
    )
  `;

  console.log(`[hippocampus] Ingested: "${input.title}" (${input.metadata.narrativeRole})`);
  return id;
}
