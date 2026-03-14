import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';

const requestSchema = z.object({
  systemPrompt: z.string(),
  context: z.string(),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  initiating: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { systemPrompt, context, messages, initiating } = requestSchema.parse(body);

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.8, maxTokens: 400 });

    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n\nCONTEXT FOR THIS SESSION:\n${context}`,
      },
    ];

    if (initiating) {
      formattedMessages.push({
        role: 'user',
        content: '[The student has just opened this section. Initiate the conversation immediately with a hard, specific opening question based on the context above. Do not wait. Do not introduce yourself with pleasantries — go straight to the challenge.]',
      });
    } else {
      for (const m of messages) {
        formattedMessages.push({ role: m.role, content: m.content });
      }
    }

    const result = await llm.invoke(formattedMessages);
    const reply = typeof result.content === 'string' ? result.content : String(result.content);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[future-prep/advise] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}

