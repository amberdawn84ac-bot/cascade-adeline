import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import { getModel } from '@/lib/ai-models';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    const maskedContent = maskPII(lastMessage.content);
    
    // Fetch student's grade level
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true }
    });
    
    const gradeLevel = student?.gradeLevel || '3'; // Default to 3rd grade if not set
    
    // Setup initial LangGraph state
    const initialState = {
      messages: [new HumanMessage(maskedContent.masked)],
      userId: user.userId,
      gradeLevel: gradeLevel,
      intent: 'CHAT' as const,
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: { timestamp: new Date().toISOString(), user_role: user.role, gradeLevel: gradeLevel },
    };

    // Run the LangGraph Brain to get result
    const result = await adelineBrainRunnable.invoke(initialState);
    
    const response = streamText({
      model: getModel('gpt-4o-mini'),
      prompt: result.response_content || "Processing...",
      temperature: 0.7,
    });
    
    return response.toTextStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
