import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { moderateContent } from '@/lib/safety/content-moderator';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    
    // Content moderation
    const moderationResult = await moderateContent(lastMessage.content);
    if (moderationResult.severity === 'blocked') {
      return new Response('Content violates safety guidelines', { status: 400 });
    }

    // Simple response for now - LangGraph integration removed
    return new Response(JSON.stringify({
      response: "Hello! I'm Adeline, your learning companion. How can I help you today?",
      user: user.userId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
