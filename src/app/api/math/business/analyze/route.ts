import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const businessSchema = z.object({
  revenue: z.number().describe("Total revenue calculated"),
  costs: z.number().describe("Total costs calculated"),
  profit: z.number().describe("Net profit (revenue minus costs)"),
  profitMargin: z.string().describe("Profit margin as a percentage string e.g. '42.3%'"),
  analysis: z.string().describe("A grade-appropriate narrative analysis of the business performance"),
  advice: z.string().describe("One concrete business improvement tip for the student"),
  mathBreakdown: z.array(z.string()).describe("Step-by-step math operations shown as strings e.g. '50 cups × $1.50 = $75.00'"),
  policyAnalysis: z.object({
    injusticeDetected: z.string().describe("What systemic harm or profit-from-harm pattern this business model could enable (e.g., predatory pricing, wage theft, environmental damage for profit, exploiting vulnerable populations)"),
    affectedPopulation: z.string().describe("Who could be harmed by this business model if scaled unethically"),
    policyRecommendation: z.string().describe("Specific policy change or regulation to prevent this harm (e.g., minimum wage laws, environmental protections, consumer protections)"),
    budgetImpact: z.string().describe("Cost analysis of implementing the policy recommendation with specific numbers")
  }).optional().describe("If this business model could enable profit-from-harm at scale, analyze the systemic risk and recommend policy"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { price, quantity, costPerUnit, fixedCosts, businessName } = await req.json();
    if (price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing price or quantity' }, { status: 400 });
    }

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.4,
    }).withStructuredOutput(businessSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical educator teaching business math. Analyze the student's virtual business with real math calculations. Show your work step by step.${studentContext}

CRITICAL POLICY ANALYSIS DIRECTIVE: After calculating the business math, analyze whether this business model could enable profit-from-harm if scaled unethically. Consider:
- Could this business exploit vulnerable populations (elderly, poor, children)?
- Could it cause environmental damage for profit?
- Could it enable wage theft or worker exploitation?
- Could it use predatory pricing or deceptive practices?
- Could it profit from regulatory capture or lack of oversight?

If ANY of these risks exist, generate a policyAnalysis with:
1. The specific injustice this model could enable
2. Who would be harmed
3. A concrete policy recommendation with specific regulatory language
4. Budget impact analysis with real numbers

Example: A lemonade stand that undercuts local businesses by not paying minimum wage → Policy: Require business licenses for all food vendors + minimum wage compliance → Budget: $500/year licensing + $15/hr wages = $7,800/year for part-time operation.`,
      },
      {
        role: 'user',
        content: `Business: ${businessName || 'Lemonade Stand'}
Selling price per unit: $${price}
Units to sell: ${quantity}
Cost per unit: $${costPerUnit || 0}
Fixed costs: $${fixedCosts || 0}

Calculate revenue, costs, profit, profit margin, and give me business advice.`,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Business analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze business' }, { status: 500 });
  }
}

