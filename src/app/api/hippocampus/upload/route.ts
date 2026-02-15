import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import { embedMany } from 'ai';
import prisma from '@/lib/db';
import { loadConfig } from '@/lib/config';
import redis from '@/lib/redis';
import { getSessionUser } from '@/lib/auth';
import { getEmbeddingModel } from '@/lib/ai-models';

function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const slice = words.slice(i, i + chunkSize).join(' ').trim();
    if (slice) chunks.push(slice);
  }
  return chunks;
}

const SOURCE_TYPES = ['PRIMARY', 'CURATED', 'SECONDARY', 'MAINSTREAM'] as const;

async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count <= limit;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  const sourceType = (form.get('source_type') as string) || 'PRIMARY';
  const title = (form.get('title') as string) || 'Untitled';
  const sourceUrl = (form.get('source_url') as string) || null;

  const sessionUser = await getSessionUser();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateKey = sessionUser ? `hippo-upload:${sessionUser.userId}` : `hippo-upload:${ip}`;
  if (!(await rateLimit(rateKey, 10, 60 * 60))) {
    return new Response('Upload rate limit exceeded', { status: 429 });
  }

  if (!file || !(file instanceof File)) {
    return new Response('File is required', { status: 400 });
  }

  if (!SOURCE_TYPES.includes(sourceType as any)) {
    return new Response('Invalid source_type', { status: 400 });
  }

  if (!title || !title.trim()) {
    return new Response('Title is required', { status: 400 });
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return new Response('File too large (max 10MB)', { status: 413 });
  }

  let text = '';
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      text = parsed.text || '';
    } finally {
      await parser.destroy();
    }
  } else {
    text = await file.text();
  }

  if (!text.trim()) return new Response('Empty content', { status: 400 });

  const config = loadConfig();
  const embeddingModelId = config.models.embeddings || 'text-embedding-3-small';
  const chunks = chunkText(text);

  const MAX_CHUNKS = 500;
  if (chunks.length > MAX_CHUNKS) {
    return new Response(`Document too large (${chunks.length} chunks, max ${MAX_CHUNKS})`, { status: 413 });
  }

  const embeddingResult = await embedMany({
    model: getEmbeddingModel(embeddingModelId),
    values: chunks,
  });

  await Promise.all(
    chunks.map((chunk, i) => {
      const subtitle = chunk.split(/\s+/).slice(0, 8).join(' ');
      const vectorLiteral = `[${embeddingResult.embeddings[i].join(',')}]`;
      return prisma.$executeRaw`
        INSERT INTO "HippocampusDocument"
          ("id", "title", "content", "metadata", "source_type", "embedding", "chunk_index", "created_at", "updated_at")
        VALUES
          (
            ${randomUUID()}::uuid,
            ${`${title} — ${subtitle}...`},
            ${chunk},
            ${JSON.stringify({ sourceUrl })}::jsonb,
            ${sourceType}::"SourceType",
            ${vectorLiteral}::vector,
            ${i},
            NOW(),
            NOW()
          )
      `;
    }),
  );

  return Response.json({ stored: chunks.length });
}
