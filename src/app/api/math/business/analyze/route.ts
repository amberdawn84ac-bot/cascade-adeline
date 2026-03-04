import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const businessSchema = z.object({
  revenue: z.number().describe("Total revenue calculated"),
  costs: z.number().describe("Total costs calculated"),
  profit: z.number().describe("Net profit (revenue minus costs)"),
  profitMargin: z.string().describe("Profit margin as a percentage string e.g. '42.3%'"),
  analysis: z.string().describe("A grade-appropriate narrative analysis of the business performance"),
  advice: z.string().describe("One concrete business improvement tip for the student"),
  mathBreakdown: z.array(z.string()).describe("Step-by-step math operations shown as strings e.g. '50 cups × $1.50 = $75.00'"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { price, quantity, costPerUnit, fixedCosts, businessName } = await req.json();
    if (price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing price or quantity' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || 'gpt-4o',
      temperature: 0.4,
    }).withStructuredOutput(businessSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical educator teaching business math. ${gradeContext} ${styleContext} Analyze the student's virtual business with real math calculations. Show your work step by step. Adapt explanations to their grade level — simpler language for younger students, more sophisticated for older ones.`,
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
