import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

const fieldProjectSchema = z.object({
  projects: z.array(
    z.object({
      title: z.string().describe('A plain, direct project title'),
      objective: z.string().describe('What the student will do and measure'),
      communityImpact: z.string().describe('Who this helps and why it matters'),
      materialsNeeded: z.array(z.string()).describe('Household or farm items required'),
      systemicAction: z.object({
        actionType: z.enum(['foia-request', 'policy-draft', 'community-alert', 'delivery-mission']),
        target: z.string().describe('Specific neighbor, family member, or government agency to serve or petition'),
        draftText: z.string().describe('Complete letter, FOIA request, or delivery plan ready to execute'),
        reasoning: z.string().describe('Why this action matters and who it protects or serves')
      }).describe('Concrete systemic action or delivery mission for this field project'),
    })
  ).length(3),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const studentCtx = await getStudentContext(user.userId, { subjectArea: 'Science' });

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.8 })
      .withStructuredOutput(fieldProjectSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical homestead educator. Generate exactly 3 gritty, real-world science field projects for a homeschool student.${studentCtx.systemPromptAddendum}

RULES:
- Projects must be grounded in the real homestead: sheep pasture, saltbox greenhouse, chickens, ducks, horses, soil, water, food preservation, or local land.
- Each project must involve actual observation, measurement, or building — not reading or watching.
- Examples of the right spirit: "Test whether the north corner of the sheep pasture has lower nitrogen than the south corner using a vinegar-baking soda soil test", "Calculate how much thermal mass the saltbox greenhouse needs to stay above 40°F on a 20°F night using jugs of water", "Map the invasive plants within 100 feet of the garden fence and identify which ones the chickens will eat".
- Use plain language. No corporate edu-speak.
- Materials must come from the farm or house. No kits, no purchases.

CRITICAL SYSTEMIC ACTION DIRECTIVE: For EVERY field project, generate a concrete systemicAction that connects the work to serving others or exposing harm:
- If testing water quality → Draft FOIA request to County Water Department + plan to deliver results to elderly neighbor who drinks well water
- If measuring soil contamination → Draft policy proposal to ban harmful chemicals + plan to share findings with local farmers
- If studying invasive species → Draft community alert about ecosystem damage + plan to deliver native plant guide to neighbors
- If analyzing greenhouse efficiency → Plan to deliver excess produce to specific family in need + calculate food security impact

The draftText must be COMPLETE and ACTIONABLE. Name specific neighbors, agencies, or community members. No generic placeholders.`,
      },
      {
        role: 'user',
        content: 'Generate 3 field work projects for me.',
      },
    ]);

    return NextResponse.json(result.projects);
  } catch (error) {
    console.error('Field work generation error:', error);
    return NextResponse.json({ error: 'Failed to generate field projects' }, { status: 500 });
  }
}

