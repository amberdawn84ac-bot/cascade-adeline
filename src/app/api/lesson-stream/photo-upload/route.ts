import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    const ext = photo.name.split('.').pop() || 'jpg';
    const blobPath = `lesson-evidence/${user.userId}/${Date.now()}.${ext}`;

    const blob = await put(blobPath, photo, { access: 'public' });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error('[lesson-photo-upload] Error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
