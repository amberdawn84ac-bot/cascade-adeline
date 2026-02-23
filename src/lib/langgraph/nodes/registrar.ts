import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { generateText } from 'ai';
import { getModel } from '@/lib/ai-models';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from "@/lib/db";

export async function registrar(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    // Build the system prompt with Adeline's voice and rules
    const systemPrompt = buildSystemPrompt(config);
    
    // Create the registrar-specific prompt
    const registrarPrompt = `The student reported: "${content}"

As Adeline the registrar, I need to:
1. Extract what activity they completed
2. Map it to educational credits using the life-to-credit rules
3. Calculate appropriate credits (remember: 1.0 credit = 120 hours, so a 1-2 hour task = 0.01-0.02 credits)
4. Respond warmly but without theatrics or emojis
5. Never use formulaic phrases like "Keep up the great work!"

Life-to-credit rules from config:
${Object.entries(config.life_to_credit_rules).map(([activity, mapping]) => `- ${activity}: ${mapping}`).join('\n')}

CRITICAL: Be very conservative with credits. A single daily activity like baking bread should only earn 0.01-0.02 credits, never 0.25.

Respond with:
1. What activity you identified
2. The educational mapping
3. The calculated credits (be conservative)
4. How this connects to their learning journey
5. No emojis or theatrical language`;

    // Generate the response using AI
    const { text } = await generateText({
      model: getModel(config.models.default),
      system: systemPrompt,
      prompt: registrarPrompt,
      temperature: 0.3,
    });

    // Extract activity information using AI analysis
    const extractionPrompt = `Extract from this student report: "${content}"

Return JSON with:
{
  "activity": "specific activity completed",
  "category": "baking|cooking|building|reading|writing|etc",
  "estimatedHours": number,
  "educationalValue": "brief description of learning value"
}

Be conservative with time estimates - most daily activities are 1-2 hours maximum.`;

    const { text: extractionResult } = await generateText({
      model: getModel(config.models.default),
      prompt: extractionPrompt,
      temperature: 0.1,
    });

    let activityData;
    try {
      activityData = JSON.parse(extractionResult);
    } catch (error) {
      console.error('Failed to parse activity extraction:', error);
      activityData = { activity: content, category: 'GENERAL', estimatedHours: 1, educationalValue: 'Student learning activity' };
    }

    // Calculate credits conservatively (120 hours = 1.0 credit)
    const creditsEarned = Math.min((activityData.estimatedHours / 120), 0.05); // Max 0.05 credits for daily activities
    
    // Create the transcript entry
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: state.userId,
        activityName: activityData.activity,
        mappedSubject: activityData.category || 'GENERAL',
        creditsEarned: creditsEarned,
        dateCompleted: new Date(),
        notes: `Student reported: ${content}. Educational value: ${activityData.educationalValue}`,
        metadata: {
          evidence: 'Student self-report',
          category: activityData.category,
          estimatedHours: activityData.estimatedHours,
          aiProcessed: true,
        },
      },
    });
    
    return {
      credit_entry: transcriptEntry,
      response_content: text || `I've recorded your ${activityData.activity} activity. This demonstrates learning in ${activityData.category || 'practical skills'} and earns ${creditsEarned.toFixed(3)} credits. Every experience contributes to your educational journey.`,
      metadata: {
        ...state.metadata,
        registrar: {
          entry_id: transcriptEntry.id,
          activity: activityData.activity,
          category: activityData.category,
          credits_awarded: creditsEarned,
          ai_generated: true,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Registrar error:', error);
    return {
      response_content: "I'm having trouble saving your achievement right now. Let me try again or help you in another way.",
      metadata: {
        ...state.metadata,
        registrar: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}
