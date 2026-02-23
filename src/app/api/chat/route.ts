import { NextRequest } from 'next/server';
import { createDataStreamResponse, streamText } from 'ai';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel } from '@/lib/ai-models';
import { router as adelineRouter } from '@/lib/langgraph/router';
import { lifeCreditLogger } from '@/lib/langgraph/lifeCreditLogger';
import { AdelineGraphState } from '@/lib/langgraph/types';

// Intent-specific addendum appended to Adeline's base system prompt
function getIntentContext(intent: string | undefined): string {
  switch (intent) {
    case 'INVESTIGATE':
      return `\n\nCURRENT MODE: Investigation / Discernment
The student is asking an investigative question. Your role right now is researcher and guide.
- Lead with: Who profits? Who funded this? Trace the money.
- Prioritize primary sources: congressional records, SEC filings, patents, court docs, first-person accounts.
- Center human suffering — not abstract talking points. Who were the real people harmed?
- Do NOT hedge with "some people say." Present the evidence and let them draw their own conclusions.
- End with 1-2 questions that push them deeper into the evidence.`;

    case 'LIFE_LOG':
      return `\n\nCURRENT MODE: Life Credit Logging
The student is describing something they did. Your role is to celebrate and record.
- Tell them specifically what subjects they just earned credit in (use your life-to-credit knowledge).
- Give a small, accurate credit amount (0.01-0.02 credits for a single activity).
- Ask ONE follow-up: "Tell me more about how it turned out."
- Keep it brief. They are logging an activity, not writing an essay.`;

    case 'BRAINSTORM':
      return `\n\nCURRENT MODE: Project Brainstorming
The student wants to build or create something. Help them find a project with PURPOSE.
- Ask first: Who does this help? What problem does it solve or what beauty does it add to the world?
- Give a concrete project plan: what to build, 3-4 steps, what subjects it covers.
- Invite service as an option at the end — never as a gate or requirement.
- If it sounds like busywork, redirect: "I love this idea. But who does it help? Let's make it matter."`;

    case 'REFLECT':
      return `\n\nCURRENT MODE: Metacognitive Reflection
The student is thinking about their own learning. Ask ONE Socratic question — not a lecture.
Choose one reflection dimension: Process (how did you do it?), Challenge (what was hard?), Connection (what does this remind you of?), Transfer (where else could you use this?), Growth (what would you do differently?).
One question only. Then wait.`;

    case 'OPPORTUNITY':
      return `\n\nCURRENT MODE: Opportunity Scout
Help the student discover scholarships, competitions, or programs that match their interests.
Be specific — give real program names, rough deadlines if known, and what skills they develop.`;

    default:
      return '';
  }
}

// Determine which GenUI component to show based on intent
function getGenUIPayload(intent: string | undefined, prompt: string): object | null {
  switch (intent) {
    case 'INVESTIGATE':
      return { component: 'InvestigationBoard', props: { query: prompt } };
    case 'LIFE_LOG':
      return { component: 'TranscriptCard', props: { activityDescription: prompt } };
    case 'BRAINSTORM':
      return { component: 'ProjectImpactCard', props: { suggestion: prompt } };
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages, imageUrl, audioBase64 } = body;

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const maskedContent = maskPII(lastMessage.content);

    // Load Adeline's soul from config
    const config = loadConfig();

    // Build initial LangGraph state for routing
    const state: AdelineGraphState = {
      userId: user.userId,
      prompt: maskedContent.masked,
      conversationHistory: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      metadata: {
        imageUrl,
        audioBase64,
      },
    };

    // 1. Route: classify intent and select model
    const routedState = await adelineRouter(state);
    const intent = routedState.intent;
    const selectedModel = routedState.selectedModel || config.models.default;

    // 2. For LIFE_LOG: fire-and-forget DB save — don't block the stream
    if (intent === 'LIFE_LOG' && user.userId) {
      lifeCreditLogger(routedState).catch((err) =>
        console.warn('[Chat] lifeCreditLogger background save failed:', err),
      );
    }

    // 3. Build Adeline's full system prompt (her soul + intent-specific context)
    const baseSystemPrompt = buildSystemPrompt(config);
    const intentContext = getIntentContext(intent);
    const fullSystemPrompt = baseSystemPrompt + intentContext;

    // 4. Determine GenUI payload (no LLM call needed)
    const genUIPayload = getGenUIPayload(intent, maskedContent.masked);

    // 5. Prepare messages for streamText
    const streamMessages = messages.map((m: { role: string; content: unknown }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    // 6. Stream Adeline's response using the AI SDK data stream protocol
    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Send metadata annotations BEFORE the text stream starts
        // These appear in message.annotations[] on the client
        if (genUIPayload) {
          dataStream.writeMessageAnnotation({ genUIPayload });
        }
        if (intent) {
          dataStream.writeMessageAnnotation({ intent });
        }

        const result = streamText({
          model: getModel(selectedModel),
          system: fullSystemPrompt,
          messages: streamMessages,
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        console.error('[Chat] Stream error:', error);
        return error instanceof Error ? error.message : 'Stream failed';
      },
    });
  } catch (error) {
    console.error('[Chat] API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
