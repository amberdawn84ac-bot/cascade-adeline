import prisma from '@/lib/db';

export function getGradeBracket(gradeStr: string): string {
  const g = (gradeStr ?? '').toLowerCase().trim();
  if (/^(k|kg|kindergarten|1st?|first|2nd?|second|grade[\s-]*[12])/.test(g)) return 'K-2';
  if (/^(3rd?|third|4th?|fourth|5th?|fifth|grade[\s-]*[345])/.test(g)) return '3-5';
  if (/^(6th?|sixth|7th?|seventh|8th?|eighth|grade[\s-]*[678])/.test(g)) return '6-8';
  return '9-12';
}

export async function getCachedContent(
  module: string,
  topicKey: string,
  gradeLevel: string
): Promise<Record<string, unknown> | null> {
  try {
    const entry = await prisma.globalContentCache.findUnique({
      where: { module_topicKey_gradeLevel: { module, topicKey, gradeLevel } },
    });
    return entry ? (entry.content as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function saveToCache(
  module: string,
  topicKey: string,
  gradeLevel: string,
  content: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.globalContentCache.upsert({
      where: { module_topicKey_gradeLevel: { module, topicKey, gradeLevel } },
      create: { module, topicKey, gradeLevel, content: content as any },
      update: { content: content as any, updatedAt: new Date() },
    });
  } catch (e) {
    console.error('[ContentCache] Save failed (non-fatal):', e);
  }
}
