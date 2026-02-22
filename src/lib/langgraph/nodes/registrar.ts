import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import prisma from "@/lib/db";

export async function registrar(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Extract activity information from the message
    // This is a simple extraction - in production, you'd use NLP
    const activityPatterns = [
      { pattern: /i baked (.+)/i, category: 'BAKING', standard: 'Practical Life Skills' },
      { pattern: /i cooked (.+)/i, category: 'COOKING', standard: 'Practical Life Skills' },
      { pattern: /i built (.+)/i, category: 'BUILDING', standard: 'STEM/Engineering' },
      { pattern: /i created (.+)/i, category: 'CREATIVE', standard: 'Arts & Design' },
      { pattern: /i made (.+)/i, category: 'CREATIVE', standard: 'Arts & Design' },
      { pattern: /i read (.+)/i, category: 'READING', standard: 'Language Arts' },
      { pattern: /i wrote (.+)/i, category: 'WRITING', standard: 'Language Arts' },
      { pattern: /i finished (.+)/i, category: 'COMPLETION', standard: 'Goal Setting' },
      { pattern: /i completed (.+)/i, category: 'COMPLETION', standard: 'Goal Setting' },
      { pattern: /i learned (.+)/i, category: 'LEARNING', standard: 'Self-Directed Learning' },
    ];
    
    let activity = null;
    let category = null;
    let standard = null;
    
    for (const { pattern, category: cat, standard: std } of activityPatterns) {
      const match = content.match(pattern);
      if (match) {
        activity = match[1];
        category = cat;
        standard = std;
        break;
      }
    }
    
    if (!activity) {
      return {
        missing_info: ['What specific activity did you complete?'],
        response_content: "I'd love to help you log that achievement! Could you tell me more specifically what you accomplished?",
        metadata: {
          ...state.metadata,
          registrar: {
            status: 'missing_info',
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
    
    // Create the transcript entry
    const transcriptEntry = {
      userId: state.userId,
      activity: activity.trim(),
      category,
      standard,
      description: `Student reported: ${content}`,
      evidence: 'Student self-report',
      date: new Date(),
      status: 'PENDING',
    };
    
    // Save to database
    const savedEntry = await prisma.transcriptEntry.create({
      data: {
        userId: state.userId,
        activityName: activity.trim(),
        mappedSubject: category || 'GENERAL',
        creditsEarned: 0.25, // Default credit for life experiences
        dateCompleted: new Date(),
        notes: `Student reported: ${content}`,
        metadata: {
          evidence: 'Student self-report',
          standard: standard,
          category: category,
        },
      },
    });
    
    const response = `🎉 **Life Credit Logged!**

**Activity:** ${activity.trim()}
**Category:** ${category}
**Standard:** ${standard}

I've recorded this achievement in your transcript. This shows your initiative in ${category?.toLowerCase()} and demonstrates practical application of ${standard?.toLowerCase()} skills.

Keep up the great work! Every experience counts toward your learning journey.`;
    
    return {
      credit_entry: savedEntry,
      response_content: response,
      metadata: {
        ...state.metadata,
        registrar: {
          entry_id: savedEntry.id,
          activity: activity.trim(),
          category,
          standard,
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
