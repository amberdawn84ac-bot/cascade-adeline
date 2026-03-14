import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not available', { status: 404 });
  }
  try {
    const body = await request.json();
    console.log('[Browser Console]', body.log);
    return new Response('OK');
  } catch (error) {
    console.error('[Debug Log Error]', error);
    return new Response('Error', { status: 500 });
  }
}

