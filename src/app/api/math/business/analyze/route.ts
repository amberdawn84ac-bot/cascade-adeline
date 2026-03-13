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

    try {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are Adeline, a wise and encouraging classical educator teaching business math. Analyze the student's virtual business with real math calculations. Show your work step by step. Keep your tone supportive and inspiring—you are helping them build their dreams, not auditing them.${studentContext}

CRITICAL POLICY ANALYSIS DIRECTIVE: After calculating the business math, analyze whether this business model could enable profit-from-harm if scaled unethically. Consider:
- Could this business exploit vulnerable populations (elderly, poor, children)?
- Are there hidden environmental or social costs to this profit?
- How could they adjust the model to prioritize human flourishing over unchecked profit?

Frame this ethical analysis as a vital part of being a noble business owner, not as a harsh critique.`,
        },
        {
          role: 'user',
          content: `Business: ${businessName || 'Lemonade Stand'}
Selling price per unit: $${price}
Units to sell: ${quantity}
Cost per unit: $${costPerUnit}
Fixed costs: $${fixedCosts}

Calculate revenue, costs, profit, profit margin, and give me business advice.`,
        },
      ]);

      return NextResponse.json(result);
    } catch (llmError) {
      console.error('Business analyze LLM error:', llmError);
      
      // Calculate basic math for fallback
      const revenue = price * quantity;
      const costs = (costPerUnit * quantity) + fixedCosts;
      const profit = revenue - costs;
      const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + '%' : '0%';
      
      // Graceful fallback if AI fails
      return NextResponse.json({
        revenue,
        costs,
        profit,
        profitMargin,
        analysis: `Your ${businessName || 'business'} looks like a great start! You are bringing in $${revenue.toFixed(2)} in revenue.`,
        advice: "Keep a close eye on your fixed costs as you grow.",
        mathBreakdown: [
          `Revenue: ${quantity} units × $${price.toFixed(2)} = $${revenue.toFixed(2)}`,
          `Variable Costs: ${quantity} units × $${costPerUnit.toFixed(2)} = $${(costPerUnit * quantity).toFixed(2)}`,
          `Total Costs: $${(costPerUnit * quantity).toFixed(2)} + $${fixedCosts.toFixed(2)} fixed = $${costs.toFixed(2)}`,
          `Profit: $${revenue.toFixed(2)} - $${costs.toFixed(2)} = $${profit.toFixed(2)}`
        ],
        policyAnalysis: {
          injusticeDetected: "Could potentially encourage cutting corners on quality or labor to increase margins.",
          affectedPopulation: "Customers or future employees",
          policyRecommendation: "Implement strict quality standards and fair wage guarantees.",
          budgetImpact: "May increase cost per unit slightly but builds long-term trust."
        }
      });
    }
  } catch (error) {
    console.error('Business analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze business' }, { status: 500 });
  }
}

