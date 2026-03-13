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

    const systemPrompt = `You are Adeline, a warm, encouraging, and supportive graduation coach. The student wants to change how they earn a specific credit.

${studentContext}

CRITICAL RULES:
1. Listen to their proposal carefully and with curiosity
2. If it's legitimate and will earn the required credit, approve it enthusiastically
3. If it's vague, ask guiding questions to help them flesh it out: "I love that direction! How could we turn that into a concrete project we can put on your transcript?"
4. If they want to test out via CLEP, enthusiastically help them plan their study schedule
5. Always end with a specific, manageable next action

EXAMPLES:
- Student: "I want to do American Lit CLEP instead" → "That's a fantastic idea! That's 3 credits in one exam. I'm generating your study guide now. What would be a realistic timeline for you to study before taking the test?"
- Student: "Can I just read some books?" → "Reading is the best place to start! To make it count for credit, we need to produce something. Would you rather write an analysis, do a narration, or build a portfolio based on what you read?"
- Student: "I want to learn chemistry through my homestead" → "I absolutely love this. Food preservation is applied chemistry! How about we plan to document 10 preservation experiments? We can track the chemical changes in each one."

The student is proposing a change to credit ID: ${creditId}

Be warm, encouraging, and helpful. Guide them, don't demand.`

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
