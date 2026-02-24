import { AdelineStateType } from '../state';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { loadConfig, buildSystemPrompt } from '@/lib/config';

export async function projectBrainstormer(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content as string;
    
    // Build the system prompt with Adeline's voice and rules
    const systemPrompt = buildSystemPrompt(config);
    
    // Create the project brainstorming-specific prompt
    const brainstormPrompt = `The student is interested in: "${content}"

As Adeline the project guide, I need to help them brainstorm meaningful projects that:
1. Have a PURPOSE - help someone, solve a real problem, or beautify the world
2. Are not busywork - every project must matter
3. Connect to their unique calling and worth
4. Include a service component when possible
5. Are appropriate for their age and skill level

Key brainstorming question from config: "${config.pedagogy.prompt_on_brainstorm}"

If their idea sounds like busywork, redirect with: "${config.pedagogy.redirect_busywork}"

Generate 3-4 project ideas that:
- Directly relate to their stated interests
- Have clear real-world impact
- Include specific next steps
- Estimate realistic timeframes
- Suggest required skills/resources
- Connect to educational value

Remember: Reject busywork. Every project must serve someone or solve something real.

Format each project as:
**Project Title**
- Description: [what it is and who it helps]
- Skills: [list key skills they'll develop]
- Timeframe: [realistic estimate]
- Impact: [who benefits and how]
- Next Steps: [2-3 concrete first steps]`;

    // Generate the project ideas using LangChain
    const model = new ChatOpenAI({
      modelName: config.models.default,
      temperature: 0.7,
    });
    
    const response = await model.invoke([
      new HumanMessage({ content: brainstormPrompt })
    ], {
      system: systemPrompt,
    });
    
    const text = response.content as string;

    // Generate a GenUI payload for the MissionBriefing component
    const genUIPayload = {
      component: 'MissionBriefing',
      props: {
        title: 'Project Ideas',
        objective: 'Explore meaningful projects that serve others and develop your skills',
        steps: [
          'Choose a project that excites you and helps others',
          'Break it down into manageable steps',
          'Identify skills you want to develop',
          'Plan how you\'ll deliver value to others',
          'Document your learning journey'
        ],
        riskNote: 'Remember: every project must have a real purpose - no busywork allowed!'
      }
    };

    return {
      response_content: text || `I'd love to help you brainstorm some meaningful projects! Based on your interest in "${content}", let's explore some ideas that could make a real difference while helping you learn and grow.`,
      genUIPayload,
      metadata: {
        ...state.metadata,
        projectBrainstormer: {
          student_interest: content,
          ideas_generated: 3, // Estimated from response
          ai_generated: true,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Project Brainstormer error:', error);
    return {
      response_content: "I'm having trouble generating project ideas right now. Let's try a different approach - what subjects are you most interested in exploring? We can work together to find a project that matters.",
      metadata: {
        ...state.metadata,
        projectBrainstormer: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}
