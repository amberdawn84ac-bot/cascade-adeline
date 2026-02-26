import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Browser Console]', body.log);
    return new Response('OK');
  } catch (error) {
    console.error('[Debug Log Error]', error);
    return new Response('Error', { status: 500 });
  }
}
