import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { seedHippocampus } from '@/lib/hippocampus/seed';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'ADMIN' && user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await seedHippocampus();
    return NextResponse.json({ ok: true, message: 'Hippocampus seeded successfully' });
  } catch (err) {
    console.error('[hippocampus/seed] Error:', err);
    return NextResponse.json({ error: 'Seed failed', detail: String(err) }, { status: 500 });
  }
}
