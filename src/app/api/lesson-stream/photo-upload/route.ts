import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const photo = form.get('photo');

  if (!photo || !(photo instanceof File)) {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(photo.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (photo.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const ext = photo.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `lesson-photos/${user.userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await photo.arrayBuffer());

  const { error } = await supabase.storage
    .from('lesson-media')
    .upload(path, buffer, { contentType: photo.type, upsert: false });

  if (error) {
    console.error('[photo-upload] Supabase storage error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from('lesson-media').getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
