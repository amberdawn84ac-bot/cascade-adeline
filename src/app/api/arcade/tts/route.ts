import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import OpenAI from 'openai';

let _openai: OpenAI | undefined;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const mp3 = await getOpenAI().audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text.slice(0, 4096),
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.byteLength.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
