import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const docs = await prisma.hippocampusDocument.findMany({
    orderBy: [{ title: 'asc' }, { chunkIndex: 'asc' }],
    select: { id: true, title: true, sourceType: true, chunkIndex: true, createdAt: true },
  });

  return Response.json({ documents: docs });
}
