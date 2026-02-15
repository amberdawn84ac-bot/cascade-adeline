import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';
import prisma from '../db';

/**
 * Metacognitive Reflection Coach
 *
 * Generates Socratic reflection prompts after learning activities.
 * Designed to deepen retention by asking students to think about
 * HOW they learned, not just WHAT they learned.
 *
 * Reflection dimensions (based on Schön's reflective practice):
 * 1. Process — "What steps did you take?"
 * 2. Challenge — "What was hardest? How did you push through?"
 * 3. Connection — "How does this connect to something you already know?"
 * 4. Transfer — "Where else could you apply this?"
 * 5. Growth — "What would you do differently next time?"
 */

const REFLECTION_DIMENSIONS = [
  'Process: What steps did you take and why?',
  'Challenge: What was the hardest part and how did you work through it?',
  'Connection: How does this relate to something you already knew?',
  'Transfer: Where else in your life could you use what you learned?',
  'Growth: What would you do differently next time?',
];

interface ReflectionResult {
  reflectionPrompt: string;
  dimension: string;
  activitySummary: string;
}

async function generateReflectionPrompt(
  activityDescription: string,
  conversationHistory: Array<{ role: string; content: string }> | undefined,
  modelId: string,
  gradeLevel?: string
): Promise<ReflectionResult> {
  const recentContext = conversationHistory
    ?.slice(-4)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n') || '';

  // Pick a dimension — rotate based on a simple hash of the activity
  const dimIndex = activityDescription.length % REFLECTION_DIMENSIONS.length;
  const dimension = REFLECTION_DIMENSIONS[dimIndex];

  const gradeContext = gradeLevel
    ? `The student is in grade band ${gradeLevel}. Adjust vocabulary and depth accordingly.`
    : '';

  const { text } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 250,
    system: `You are Adeline's Reflection Coach. Your role is to help students develop metacognitive awareness — the ability to think about their own thinking and learning.

You ask ONE warm, specific, Socratic question that invites the student to reflect on their recent activity. The question should:
- Be conversational and encouraging (not like a test)
- Reference specific details from what they did
- Target this reflection dimension: ${dimension}
- Be age-appropriate ${gradeContext}

Never lecture. Never give the answer. Just ask a genuinely curious question that makes them pause and think.`,
    prompt: `Recent conversation:
${recentContext}

The student just completed this activity: "${activityDescription}"

Ask ONE thoughtful reflection question targeting the "${dimension.split(':')[0]}" dimension. Keep it warm and brief (1-2 sentences).`,
  });

  return {
    reflectionPrompt: text,
    dimension: dimension.split(':')[0],
    activitySummary: activityDescription,
  };
}

/**
 * Score the depth of a student's reflection response (0-1).
 * Used when the student replies to a reflection prompt.
 */
async function scoreReflection(
  reflectionPrompt: string,
  studentResponse: string,
  modelId: string
): Promise<{ score: number; followUp: string }> {
  const { text } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 300,
    temperature: 0,
    prompt: `You are evaluating the depth of a student's metacognitive reflection.

Reflection prompt: "${reflectionPrompt}"
Student's response: "${studentResponse}"

Score the reflection depth from 0.0 to 1.0:
- 0.0-0.2: Surface level, vague, or off-topic
- 0.3-0.5: Some specificity but lacks depth or self-awareness
- 0.6-0.8: Good self-awareness, specific examples, shows genuine thinking
- 0.9-1.0: Exceptional — deep insight, connects to broader patterns, shows growth mindset

Then provide a brief, warm follow-up that either:
- Affirms their insight and extends it (if score >= 0.6)
- Gently probes deeper with a follow-up question (if score < 0.6)

Return ONLY strict JSON:
{
  "score": 0.7,
  "followUp": "That's a really thoughtful observation about..."
}`,
  });

  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(cleanText);
    return {
      score: Math.max(0, Math.min(1, Number(parsed.score) || 0.5)),
      followUp: parsed.followUp || 'Tell me more about that!',
    };
  } catch {
    return { score: 0.5, followUp: 'Tell me more about what you noticed!' };
  }
}

/**
 * Main LangGraph node for reflection.
 *
 * Two modes:
 * 1. POST_ACTIVITY (auto-triggered after LIFE_LOG): generates a reflection prompt
 * 2. REFLECT (user explicitly reflecting): scores their response and follows up
 */
export async function reflectionCoach(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default;

  const isPostActivity = state.metadata?.reflectionMode === 'post_activity';
  const pendingReflection = state.metadata?.pendingReflection as {
    promptUsed?: string;
    activitySummary?: string;
    reflectionEntryId?: string;
  } | undefined;

  // Mode 1: Student is responding to a reflection prompt
  if (pendingReflection?.promptUsed && !isPostActivity) {
    const { score, followUp } = await scoreReflection(
      pendingReflection.promptUsed,
      state.prompt,
      modelId
    );

    // Save the student's response
    if (state.userId && pendingReflection.reflectionEntryId) {
      try {
        await (prisma as any).reflectionEntry.update({
          where: { id: pendingReflection.reflectionEntryId },
          data: {
            studentResponse: state.prompt,
            aiFollowUp: followUp,
            insightScore: score,
          },
        });
      } catch (err) {
        console.error('[ReflectionCoach] Failed to update reflection entry:', err);
      }
    }

    const emoji = score >= 0.7 ? '🌟' : score >= 0.4 ? '💭' : '🤔';
    const responseContent = `${emoji} ${followUp}`;

    return {
      ...state,
      responseContent,
      metadata: {
        ...state.metadata,
        reflectionCoach: {
          mode: 'scored',
          insightScore: score,
        },
        pendingReflection: undefined, // Clear the pending state
      },
    };
  }

  // Mode 2: Generate a new reflection prompt (post-activity)
  const activityDescription =
    state.metadata?.lifeCreditLogger?.mapping?.activity ||
    state.transcriptDraft?.activityName ||
    state.prompt;

  const result = await generateReflectionPrompt(
    activityDescription,
    state.conversationHistory,
    modelId,
    state.gradeLevel
  );

  // Save the reflection entry
  let reflectionEntryId: string | undefined;
  if (state.userId) {
    try {
      const entry = await (prisma as any).reflectionEntry.create({
        data: {
          userId: state.userId,
          type: 'POST_ACTIVITY',
          activitySummary: result.activitySummary,
          promptUsed: result.reflectionPrompt,
          conceptsTagged: [],
          metadata: { dimension: result.dimension },
        },
      });
      reflectionEntryId = entry.id;
    } catch (err) {
      console.error('[ReflectionCoach] Failed to save reflection entry:', err);
    }
  }

  // Append the reflection prompt to the existing response (if any)
  const existingResponse = state.responseContent || '';
  const separator = existingResponse ? '\n\n---\n\n' : '';
  const reflectionSection = `💭 **Reflection moment:** ${result.reflectionPrompt}`;
  const responseContent = `${existingResponse}${separator}${reflectionSection}`;

  return {
    ...state,
    responseContent,
    metadata: {
      ...state.metadata,
      reflectionCoach: {
        mode: 'prompted',
        dimension: result.dimension,
      },
      pendingReflection: {
        promptUsed: result.reflectionPrompt,
        activitySummary: result.activitySummary,
        reflectionEntryId,
      },
    },
  };
}
