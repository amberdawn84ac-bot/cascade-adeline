import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, style = 'simple flat illustration, educational, minimal, no text labels, clean white background, didactic accuracy' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${style}: ${prompt}`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const url = response.data[0]?.url;
    if (!url) throw new Error('No image URL returned from DALL-E');

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[/api/images/generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
