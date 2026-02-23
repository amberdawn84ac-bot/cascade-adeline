import { generateText } from 'ai';
import { AdelineStateType } from '../state';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel } from '@/lib/ai-models';
import prisma from '@/lib/db';

/**
 * Registrar Node — Life Credit Logging
 *
 * When a student describes something they did, this node:
 * 1. Maps the activity to academic credits using adeline.config.toml life-to-credit rules
 * 2. Saves the transcript entry to the database
 * 3. Responds in Adeline's voice — concise, warm, no theatrics
 *
 * Adeline's rules for this mode:
 * - No "🎉" or "Amazing job!" theatrics
 * - Be accurate about credits (0.01-0.02 for a single activity)
 * - Ask ONE follow-up question about how it went
 */
export async function registrar(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;

  try {
    const config = loadConfig();
    const modelId = config.models.default;

    // Build the system prompt with life-to-credit context
    const basePrompt = buildSystemPrompt(config);
    const registrarContext = `\n\nCURRENT MODE: Life Credit Logging
The student just described something they did. Your job:
1. Identify which subjects this maps to (use your life-to-credit knowledge).
2. State a small, accurate credit amount (0.01–0.02 for a single session).
3. Ask ONE follow-up question — how did it turn out?
Keep it brief. No emoji. No "Amazing!" No "That's incredible!" Just be real with them.`;

    const { text } = await generateText({
      model: getModel(modelId),
      system: basePrompt + registrarContext,
      messages: [{ role: 'user', content }],
      maxOutputTokens: 300,
    });

    // Attempt to save to database (fire-and-forget if no userId)
    if (state.userId) {
      try {
        await prisma.transcriptEntry.create({
          data: {
            userId: state.userId,
            activityName: content.slice(0, 200),
            mappedSubject: 'GENERAL',
            creditsEarned: 0.015,
            dateCompleted: new Date(),
            notes: `Student reported: ${content}`,
            metadata: { source: 'registrar_node', raw: content },
          },
        });
      } catch (dbError) {
        console.warn('[Registrar] DB save failed (schema may not be migrated):', dbError);
      }
    }

    return {
      response_content: text,
      genUIPayload: {
        component: 'TranscriptCard',
        props: { activityDescription: content },
      },
      metadata: {
        ...state.metadata,
        registrar: { model: modelId, timestamp: new Date().toISOString() },
      },
    };
  } catch (error) {
    console.error('[Registrar] Error:', error);
    return {
      response_content:
        "I couldn't save that right now — try again in a moment and we'll get it logged.",
      metadata: {
        ...state.metadata,
        registrar: { error: error instanceof Error ? error.message : String(error) },
      },
    };
  }
}
