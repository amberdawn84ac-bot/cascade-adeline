import { AdelineStateType } from '../state';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { loadConfig, buildSystemPrompt } from '@/lib/config';

export async function opportunityScout(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content as string;
    
    // Build the system prompt with Adeline's voice and rules
    const systemPrompt = buildSystemPrompt(config);
    
    // Create the opportunity scouting-specific prompt
    const scoutPrompt = `The student is looking for opportunities: "${content}"

As Adeline the opportunity scout, I need to find real, current opportunities that:
1. Are age-appropriate and educational
2. Align with the student's interests and skills
3. Have real-world value and impact
4. Are from legitimate organizations
5. Include current deadlines and requirements

Generate 3-4 real opportunities that could include:
- Academic competitions (science fairs, writing contests, math competitions)
- Summer programs and camps
- Internships or volunteer opportunities
- Scholarships and grants
- Workshops and conferences
- Online challenges and hackathons

For each opportunity, include:
- **Title** and **Type** (Competition/Program/Workshop/etc)
- **Description** of what it involves
- **Deadline** (use realistic current or future dates)
- **Requirements** (age, skills, application materials)
- **Organization** (real or realistic educational institution)
- **Match Score** (how well it fits their interests)
- **Why it matters** (educational value and impact)

IMPORTANT: 
- Use current year (2025) for deadlines
- Be specific about requirements
- Include real educational organizations when possible
- Avoid fake or outdated opportunities
- Focus on educational value over prestige

Format the response clearly and conversationally, not as a sterile list.`;

    // Generate the opportunities using LangChain
    const model = new ChatOpenAI({
      modelName: config.models.default,
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(scoutPrompt)
    ]);
    
    const text = response.content as string;

    // Generate a GenUI payload for the ProjectImpactCard component
    const genUIPayload = {
      component: 'ProjectImpactCard',
      props: {
        title: 'Opportunity Match',
        impact: 'Real-world learning experiences that build your skills and portfolio',
        actions: ['Research requirements', 'Prepare application', 'Meet deadlines', 'Showcase your work'],
        metrics: ['Skill development', 'Portfolio building', 'Network expansion', 'Recognition opportunities']
      }
    };

    return {
      response_content: text || `I found some exciting opportunities that could be a great fit for you! Let me help you explore these options that align with your interests and could provide valuable real-world experience.`,
      genUIPayload,
      metadata: {
        ...state.metadata,
        opportunityScout: {
          student_query: content,
          opportunities_found: 3, // Estimated from response
          ai_generated: true,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Opportunity Scout error:', error);
    return {
      response_content: "I'm having trouble finding current opportunities right now, but I'll keep looking for programs that match your interests. Check back soon for new opportunities! In the meantime, let me help you prepare for applications or develop skills that will make you a strong candidate.",
      metadata: {
        ...state.metadata,
        opportunityScout: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}
