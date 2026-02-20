import { generateText } from 'ai';
import prisma from '../db';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';

/**
 * Proactively checks for relevant opportunities based on a student's recent projects.
 * This function is intended to be triggered during the user's login sequence.
 */
export async function proactiveOpportunityScout(userId: string): Promise<{ opportunity: any; briefing: string } | null> {
  const config = loadConfig();
  const modelId = config.models.default;

  // Fetch the student's recent transcript entries (projects)
  const recentTranscripts = await prisma.transcriptEntry.findMany({
    where: { userId },
    orderBy: { dateCompleted: 'desc' },
    take: 5,
  });

  if (!recentTranscripts.length) {
    console.log('[ProactiveOpportunityScout] No recent projects found for user:', userId);
    return null;
  }

  // Extract keywords from recent activities
  const activityKeywords = recentTranscripts.map(t => t.activityName).join(', ');

  // Find opportunities that match these keywords or have upcoming deadlines
  const opportunities = await prisma.opportunity.findMany({
    where: {
      OR: [
        { deadline: { gte: new Date() } }, // Upcoming deadlines
        { description: { contains: activityKeywords, mode: 'insensitive' } }, // Keyword match
        { title: { contains: activityKeywords, mode: 'insensitive' } },
      ],
    },
    orderBy: { deadline: 'asc' },
    take: 3,
  });

  if (!opportunities.length) {
    console.log('[ProactiveOpportunityScout] No matching opportunities found for user:', userId);
    return null;
  }

  // Select the most relevant opportunity (simplified: the first one)
  const selectedOpportunity = opportunities[0];

  // Generate a mission briefing
  const { text } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 250,
    prompt: `You are Adeline, a warm and encouraging learning companion. You have found a perfect opportunity for a student based on their recent work.

Student's recent projects: ${activityKeywords}
Opportunity: ${selectedOpportunity.title} - ${selectedOpportunity.description}
Deadline: ${selectedOpportunity.deadline?.toLocaleDateString()}

Generate a short, exciting "Mission Briefing" that frames this as a quest. Be encouraging and highlight how their recent work has prepared them for this. Keep it under 150 words.`,
  });

  return {
    opportunity: selectedOpportunity,
    briefing: text.trim(),
  };
}

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
