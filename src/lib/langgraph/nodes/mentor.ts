import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { loadConfig } from "../../config";
import { AdelineStateType } from "../state";
import { genUIPlanner } from "../genUIPlanner";
import prisma from "../../db";

export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  console.log('[Mentor] NODE CALLED - intent:', state.intent, 'content length:', state.messages?.length);
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  console.log('[Mentor] Processing content:', content);
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    // Get student's learning style from database
    const student = await prisma.user.findUnique({
      where: { id: state.userId },
      select: { learningStyle: true }
    });
    
    const learningStyle = student?.learningStyle || 'general';
    
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
    const gradeLevelContext = `You are speaking to a student in grade ${state.gradeLevel}. Adjust your vocabulary, the complexity of your analogies, and the depth of your explanations to be developmentally appropriate for this level while still operating within their Zone of Proximal Development.`;
    
    const adaptationProtocol = `ADAPTATION PROTOCOL: This student has a [${learningStyle}] learning style.

If Kinesthetic: Minimize text. Suggest hands-on experiments, building projects, or physical activities to explain concepts.

If Visual: Use highly descriptive visual analogies and trigger GenUI cards like Timelines or Investigation Boards frequently.

If Narrative: Frame concepts as stories, historical mysteries, or character journeys.

If Socratic: Do not give them the answer. Ask piercing questions to lead them to discover it themselves.
Never mention their learning style to them directly; just invisibly adapt your teaching methods to it.`;
    
    const systemPrompt = buildSystemPrompt(config, `${studentContext}\n\n${gradeLevelContext}\n\n${adaptationProtocol}`);
    
    // Create the mentor-specific prompt
    const mentorPrompt = `Student message: "${content}"
    
As Adeline the mentor, respond with:
1. Warm, conversational tone - never formulaic or theatrical
2. Socratic questioning that guides their thinking
3. Connection to their unique calling and worth
4. If relevant to learning gaps: thoughtful questions to explore those concepts
5. Never say "That's a great question!" or similar formulaic phrases

Remember: Knowledge without love is nothing. Every child has a calling.`;

    // Generate the response using LangChain
    const model = new ChatOpenAI({
      modelName: config.models.default,
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(mentorPrompt)
    ]);
    
    const text = response.content as string;
    
    // Check if GenUI component is needed (e.g., for timeline requests)
    let genUIPayload = null;
    console.log('[Mentor] Checking GenUI - intent:', state.intent, 'content:', content);
    if (state.intent === 'GEN_UI' || content.toLowerCase().includes('timeline')) {
      try {
        console.log('[Mentor] Attempting to generate GenUI payload...');
        // Create a state object for genUIPlanner
        const genUIState = {
          prompt: content,
          gradeLevel: state.gradeLevel || '3',
          intent: state.intent,
          studentContext: state.studentContext || { detectedGaps: [] },
          messages: state.messages
        };
        const genUIResult = await genUIPlanner(genUIState);
        genUIPayload = genUIResult.genUIPayload;
        console.log('[Mentor] GenUI payload generated:', genUIPayload);
      } catch (error) {
        console.warn('[Mentor] Failed to generate GenUI payload:', error);
      }
    } else {
      console.log('[Mentor] No GenUI needed - intent:', state.intent, 'timeline check:', content.toLowerCase().includes('timeline'));
    }
    
    return {
      learning_gaps: learningGaps,
      response_content: text || "I'm here to help you learn and grow. Tell me more about what you're exploring.",
      genUIPayload,
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
    console.error('Mentor error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      userId: state.userId
    });
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
