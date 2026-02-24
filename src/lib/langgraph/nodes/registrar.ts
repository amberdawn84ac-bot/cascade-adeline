import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from "@/lib/db";

export async function registrar(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    // Extract activity information using simple pattern matching
    let activityData = {
      activity: content,
      category: 'GENERAL',
      estimatedHours: 1,
      educationalValue: 'Student learning activity'
    };
    
    // Simple pattern matching for common activities
    if (content.toLowerCase().includes('greenhouse') || content.toLowerCase().includes('built')) {
      activityData = {
        activity: 'built a greenhouse',
        category: 'BUILDING',
        estimatedHours: 2,
        educationalValue: 'Construction skills, planning, and practical application'
      };
    } else if (content.toLowerCase().includes('baked') || content.toLowerCase().includes('cooked')) {
      activityData = {
        activity: 'prepared food',
        category: 'COOKING',
        estimatedHours: 1.5,
        educationalValue: 'Chemistry, measurements, and following procedures'
      };
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
          aiProcessed: false,
        },
      },
    });
    
    // Generate a simple response without AI
    const responseText = `I've recorded your ${activityData.activity} activity. This demonstrates learning in ${activityData.category.toLowerCase()} and earns ${creditsEarned.toFixed(3)} credits. Every experience contributes to your educational journey.`;
    
    return {
      credit_entry: transcriptEntry,
      response_content: responseText,
      metadata: {
        ...state.metadata,
        registrar: {
          entry_id: transcriptEntry.id,
          activity: activityData.activity,
          category: activityData.category,
          credits_awarded: creditsEarned,
          ai_generated: false,
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
