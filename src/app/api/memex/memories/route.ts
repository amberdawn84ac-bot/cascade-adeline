import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAllUserMemories } from '@/lib/memex/memory-retriever';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const memories = await getAllUserMemories(user.userId);

    return NextResponse.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

