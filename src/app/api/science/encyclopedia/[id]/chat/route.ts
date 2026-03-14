import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import prisma from '@/lib/db';

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { messages, entry: clientEntry } = await req.json();

  // Load from DB if we have a real saved ID, otherwise use client-provided entry
  let entry = clientEntry;
  if (!entry && params.id !== 'new') {
    try {
      const te = await prisma.transcriptEntry.findUnique({
        where: { id: params.id },
        select: { metadata: true },
      });
      if (te?.metadata) entry = te.metadata as Record<string, unknown>;
    } catch {
      // fall through to client-provided entry
    }
  }

  const studentContext = await buildStudentContextPrompt(user.userId);

  const topic = (entry?.title as string) || 'this topic';
  const coreConcept = (entry?.coreConcept as string) || '';
  const appliedReality = (entry?.appliedReality as string) || '';
  const fieldChallenge = (entry?.fieldChallenge as string) || '';

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are Adeline, an elite homesteading mentor and science guide. You are in a live, gritty field dialogue with your student about: "${topic}".

${studentContext}

ENTRY CONTEXT:
Core Concept: ${coreConcept}
Applied Reality: ${appliedReality}
Field Challenge You Gave Them: ${fieldChallenge}

YOUR DIRECTIVE — SOCRATIC METHOD ONLY:
- NEVER just give the answer. Ask questions that make the student figure it out themselves.
- When they report what they observed, touched, smelled, or measured — analyze it and push them deeper.
- Keep responses SHORT and GRITTY — 2-4 sentences max, then end with ONE specific follow-up question or challenge.
- Adapt your language exactly to the student's grade level. Speak like a mentor in the field, not a textbook.
- Treat their honest observations as gold. "Dry and crumbly" is better data than a perfect answer.
- Always end with a question or a direct action challenge.`,
    messages,
  });

  return result.toTextStreamResponse();
}
