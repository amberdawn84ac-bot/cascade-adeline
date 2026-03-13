import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ChatOpenAI } from '@langchain/openai';
import { streamText } from 'ai';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, creditId } = await req.json();

    // Get student context
    const studentContext = await buildStudentContextPrompt(user.userId);

    // Get the last user message to understand what they want
    const userMessage = messages[messages.length - 1]?.content || '';

    const systemPrompt = `You are Adeline, the student's relentless graduation coach. The student wants to change how they earn a specific credit.

${studentContext}

CRITICAL RULES:
1. Listen to their proposal carefully
2. If it's legitimate and will earn the required credit, approve it enthusiastically
3. If it's vague or weak, push back: "That's not a plan, that's a wish. What is the concrete deliverable?"
4. If they want to test out via CLEP, immediately pivot to exam prep mode
5. Always end with a specific next action they must take

EXAMPLES:
- Student: "I want to do American Lit CLEP instead" → "Excellent. That's 3 credits in one exam. I'm generating your study guide now. You have 90 days. What's your study schedule?"
- Student: "Can I just read some books?" → "Reading is not a credit. What will you produce? A written analysis? A narration? A portfolio? Be specific."
- Student: "I want to learn chemistry through my homestead" → "Perfect. Food preservation is applied chemistry. You will document 10 preservation experiments with full chemical explanations. When do you start?"

The student is proposing a change to credit ID: ${creditId}

Be warm but relentless. Do not let them coast.`;

    const result = await streamText({
      model: new ChatOpenAI({ 
        model: 'gpt-4o',
        temperature: 0.8,
      }) as any,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('[journey/change-route] Error:', error);
    return new Response('Failed to process route change', { status: 500 });
  }
}
