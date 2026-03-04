import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';

const reviewSchema = z.object({
  approved: z.boolean().describe("Whether the game is complete and working"),
  feedback: z.string().describe("Constructive feedback on the game, what works well and what could be improved"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || 'gpt-4o',
      temperature: 0.3,
    }).withStructuredOutput(reviewSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a kind but honest code reviewer for student game projects. Review the submitted HTML/JS game code. Approve it if it is a complete, functional game (even a simple one). If it is just the default template or broken, reject it with specific, encouraging feedback on what to add or fix to earn approval.`,
      },
      { role: 'user', content: `Review this game code:\n${code}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Arcade review error:', error);
    return NextResponse.json({ error: 'Failed to review code' }, { status: 500 });
  }
}
