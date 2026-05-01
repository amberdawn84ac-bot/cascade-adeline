import { AdelineStateType } from '../state';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';

export async function projectBrainstormer(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content as string;
    
    const studentCtx = await getStudentContext(state.userId);

    // Derive learning mode from learningStyle: EXPEDITION style → expedition mode, else classic
    const isExpedition = (studentCtx.learningStyle || '').toUpperCase().includes('EXPEDITION');
    const learningMode: 'classic' | 'expedition' = isExpedition ? 'expedition' : 'classic';

    // Build the system prompt with Adeline's voice and rules
    const systemPrompt = buildSystemPrompt(config, studentCtx.systemPromptAddendum);
    
    // Create the project brainstorming-specific prompt
    const modeInstructions = learningMode === 'expedition'
      ? `
LEARNING MODE: EXPEDITION
MANDATORY: Every project idea MUST be cross-curricular — combining 2 or more of the 10 INTEGRATED TRACKS in a single project.

THE 10 TRACKS:
1. God's Creation Science — Biology, Chemistry, Physics, Earth Science
2. Truth-Based History — Primary source investigation, narrative gap analysis
3. Mathematical Thinking — Real-world problem solving, data analysis, business math
4. Literary Arts — Reading, writing, rhetoric, public speaking
5. Homesteading — Cooking, sewing, gardening, household management, food preservation
6. Health & Naturopathy — Nutrition, herbalism, fitness, natural remedies
7. Trades & Entrepreneurship — Business, skilled trades, apprenticeships
8. Civic Engagement & Justice — Government, economics, social justice, community service
9. Applied Math — Practical mathematics for real-world applications, measurement, construction math, financial calculations
10. Creative Economics — Understanding money systems, personal finance, market dynamics, economic thinking

CROSS-TRACK PROJECT EXAMPLES:
- Building a raised garden bed: Track 1 (Science - soil testing), Track 3 (Math - calculate lumber/volume), Track 2 (History - research crop origins), Track 4 (ELA - write planting plan), Track 5 (Homesteading - garden design), Track 9 (Applied Math - measuring and layout)
- Starting a baking business: Track 5 (Homesteading - baking), Track 3 (Math - pricing/profit), Track 7 (Entrepreneurship - business plan), Track 4 (ELA - marketing copy), Track 6 (Health - nutrition analysis), Track 10 (Creative Economics - market analysis)
- Community justice project: Track 8 (Civic Engagement - identify issue), Track 2 (History - research precedents), Track 4 (ELA - write proposal), Track 3 (Math - budget analysis), Track 10 (Creative Economics - economic impact)

Each project MUST explicitly state: "This project integrates Track X (how), Track Y (how), and Track Z (how)." Single-track projects are NOT acceptable in Expedition mode.`
      : `
LEARNING MODE: CLASSIC
Projects should be focused and single-subject — one clear academic discipline per project. Examples:
- A focused math problem set applying a specific concept (e.g., budgeting a $500 purchase with tax and savings plan)
- A standalone ELA essay or structured writing assignment (e.g., persuasive letter to a local official)
- A targeted science experiment with hypothesis, method, and recorded results
Avoid cross-subject mixing. Each project should have one primary academic objective with clear mastery criteria.`;

    const brainstormPrompt = `The student is interested in: "${content}"
${modeInstructions}

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
      model: config.models.default,
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(brainstormPrompt)
    ]);
    
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

