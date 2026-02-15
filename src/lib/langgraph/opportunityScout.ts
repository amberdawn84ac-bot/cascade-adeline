import { generateText } from 'ai';
import prisma from '../db';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';

async function inferInterests(prompt: string, history: AdelineGraphState['conversationHistory'], modelId: string) {
  const convo = history?.map((h) => `${h.role}: ${h.content}`).join('\n') || '';
  const { text } = await generateText({
    model: getModel(modelId),
    temperature: 0,
    maxOutputTokens: 120,
    prompt: `Extract up to 4 student interests as short keywords.
Conversation:
${convo}
Latest: ${prompt}

Return ONLY JSON array of strings, e.g. ["woodworking","birds","gardening"]. If unknown, return [].`,
  });
  try {
    const parsed = JSON.parse(text.trim());
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch (err) {
    return [];
  }
}

export async function opportunityScout(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default; // Gemini

  const explicitInterests = state.studentContext?.interests;
  const inferredInterests = explicitInterests?.length
    ? explicitInterests
    : await inferInterests(state.prompt, state.conversationHistory, modelId);
  const gradeLevel = state.gradeLevel;

  const where: any = {};
  if (gradeLevel) where.ageRange = gradeLevel;
  if (inferredInterests && inferredInterests.length) {
    where.matchedInterests = { hasSome: inferredInterests };
  }

  let opportunities = await prisma.opportunity.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (!opportunities.length) {
    opportunities = await prisma.opportunity.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  }

  const summaryPrompt = `You are Adeline. Briefly explain why each opportunity fits the student. Be concise.
Student interests: ${inferredInterests?.join(', ') || 'unknown'}
Student grade/age: ${gradeLevel || 'unknown'}

Opportunities:
${opportunities
    .map((o: { title: string; type: string; description: string; matchedInterests: string[] }) =>
      `- ${o.title} (${o.type}): ${o.description}. Matched interests: ${o.matchedInterests?.join(', ')}`,
    )
    .join('\n')}

Return a short list in Adeline's warm voice, one bullet per opportunity. Mention who it helps and why it fits.`;

  const { text } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 300,
    prompt: summaryPrompt,
  });

  return {
    ...state,
    responseContent: text,
    genUIPayload: undefined,
    metadata: {
      ...state.metadata,
      opportunityScout: {
        model: modelId,
        opportunityCount: opportunities.length,
      },
    },
  };
}
