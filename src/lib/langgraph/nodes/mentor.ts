import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import prisma from "@/lib/db";

export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Check for learning gaps before responding
    const learningGaps = await prisma.learningGap.findMany({
      where: {
        userId: state.userId,
        addressed: false,
      },
      include: {
        concept: true,
      },
      take: 5,
    });
    
    // Analyze if the current question relates to any learning gaps
    const relevantGaps = learningGaps.filter(gap => 
      content.toLowerCase().includes(gap.concept.name.toLowerCase()) ||
      gap.concept.name.toLowerCase().includes(content.toLowerCase())
    );
    
    let response = "";
    
    if (relevantGaps.length > 0) {
      // Use Socratic questioning to address learning gaps
      response = `I notice you're asking about ${relevantGaps.map(g => g.concept.name).join(', ')}. Let me help you explore this with some thoughtful questions:\n\n`;
      
      relevantGaps.forEach((gap, index) => {
        response += `**Regarding ${gap.concept.name}:**\n`;
        response += `• What do you already know about this topic?\n`;
        response += `• What part feels confusing or challenging?\n`;
        response += `• Can you think of a real-world example where this might apply?\n\n`;
      });
      
      response += `Take your time to think about these questions. Understanding your current thinking will help me guide you better!`;
    } else {
      // General mentorship response
      response = `That's a great question! I'm here to help you learn and grow.

As your learning mentor, I want to understand your thinking better:

1. **What's your initial take on this?** - Your first thoughts are valuable starting points
2. **What have you tried so far?** - Previous attempts help us build on what you know
3. **What specifically would you like to explore?** - We can dive deeper into any part that interests you

Remember, learning is a journey, and every question helps you move forward. I'm here to guide you with thoughtful questions and support your unique learning path!`;
    }
    
    return {
      learning_gaps: learningGaps,
      response_content: response,
      metadata: {
        ...state.metadata,
        mentor: {
          learning_gaps_found: learningGaps.length,
          relevant_gaps: relevantGaps.length,
          socratic_approach: relevantGaps.length > 0,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Mentor error:', error);
    return {
      response_content: "I'm here to help you learn! While I'm having trouble accessing some of my tools right now, I'm still ready to support your learning journey. What would you like to explore together?",
      metadata: {
        ...state.metadata,
        mentor: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}
