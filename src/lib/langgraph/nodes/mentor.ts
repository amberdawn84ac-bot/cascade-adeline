import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { generateText } from 'ai';
import { getModel } from '@/lib/ai-models';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from "@/lib/db";

export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
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
    
    // Build context for the AI
    let studentContext = '';
    if (relevantGaps.length > 0) {
      studentContext = `Student has ${learningGaps.length} unaddressed learning gaps. Relevant gaps for this question: ${relevantGaps.map(g => g.concept.name).join(', ')}.`;
    }
    
    // Build the system prompt with Adeline's voice and rules
    const systemPrompt = buildSystemPrompt(config, studentContext);
    
    // Create the mentor-specific prompt
    const mentorPrompt = `The student asked: "${content}"

${relevantGaps.length > 0 ? `I notice this connects to their learning gaps in: ${relevantGaps.map(g => g.concept.name).join(', ')}. This is a perfect opportunity for Socratic mentoring.` : 'This is a general learning question.'}

As Adeline the mentor, respond with:
1. Warm, conversational tone - never formulaic or theatrical
2. Socratic questioning that guides their thinking
3. Connection to their unique calling and worth
4. If relevant to learning gaps: thoughtful questions to explore those concepts
5. Never say "That's a great question!" or similar formulaic phrases

Remember: Knowledge without love is nothing. Every child has a calling.`;

    // Generate the response using AI
    const { text } = await generateText({
      model: getModel(config.models.default),
      system: systemPrompt,
      prompt: mentorPrompt,
      temperature: 0.7,
    });
    
    return {
      learning_gaps: learningGaps,
      response_content: text || "I'm here to help you learn and grow. Tell me more about what you're exploring.",
      metadata: {
        ...state.metadata,
        mentor: {
          learning_gaps_found: learningGaps.length,
          relevant_gaps: relevantGaps.length,
          socratic_approach: relevantGaps.length > 0,
          ai_generated: true,
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
