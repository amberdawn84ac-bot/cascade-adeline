import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const dataSchema = z.object({
  mean: z.number().describe("The arithmetic mean of the dataset"),
  median: z.number().describe("The median value of the dataset"),
  mode: z.string().describe("The mode(s) of the dataset, or 'No mode' if all values are unique"),
  range: z.number().describe("The range (max minus min)"),
  analysis: z.string().describe("A grade-appropriate narrative analysis of the data"),
  interpretation: z.string().describe("What the data tells us in plain language"),
  chartType: z.string().describe("The best chart type for this data e.g. 'Bar chart', 'Line graph', 'Pie chart'"),
  insight: z.string().describe("One surprising or interesting insight from the data"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { data, question } = await req.json();
    if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.4,
    }).withStructuredOutput(dataSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical mathematics tutor specializing in data science. ${gradeContext} ${styleContext} Analyze the dataset the student has provided. Calculate mean, median, mode, and range. Then explain what the data means in grade-appropriate language, recommend the best visualization, and find one surprising insight.`,
      },
      {
        role: 'user',
        content: `Dataset: ${data}\n${question ? `Question: ${question}` : ''}`,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Data analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
}

