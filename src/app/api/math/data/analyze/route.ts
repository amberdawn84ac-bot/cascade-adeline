import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const dataSchema = z.object({
  mean: z.number().describe("The arithmetic mean of the dataset"),
  median: z.number().describe("The median value of the dataset"),
  mode: z.string().describe("The mode(s) of the dataset, or 'No mode' if all values are unique"),
  range: z.number().describe("The range (max minus min)"),
  analysis: z.string().describe("A grade-appropriate narrative analysis of the data"),
  interpretation: z.string().describe("What the data tells us in plain language"),
  chartType: z.string().describe("The best chart type for this data e.g. 'Bar chart', 'Line graph', 'Pie chart'"),
  insight: z.string().describe("One surprising or interesting insight from the data"),
  policyAnalysis: z.object({
    injusticeDetected: z.string().describe("What systemic harm or inequality this data reveals (e.g., wage gaps, environmental racism, resource hoarding, discriminatory outcomes)"),
    affectedPopulation: z.string().describe("Who is being harmed according to this data"),
    policyRecommendation: z.string().describe("Specific policy change to address the inequality revealed by this data"),
    budgetImpact: z.string().describe("Cost analysis of implementing the policy with specific numbers from the data")
  }).optional().describe("If this data reveals systemic inequality or harm, analyze it and recommend policy"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { data, question } = await req.json();
    if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.4,
    }).withStructuredOutput(dataSchema);

    try {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are Adeline, a classical mathematics tutor specializing in data science.${studentContext} Analyze the dataset the student has provided. Calculate mean, median, mode, and range. Then explain what the data means in grade-appropriate language, recommend the best visualization, and find one surprising insight.

CRITICAL POLICY ANALYSIS DIRECTIVE: After analyzing the data, look for patterns that reveal systemic injustice:
- Wage gaps between groups (gender, race, age)
- Unequal resource distribution (wealth, food, healthcare, education)
- Environmental racism (pollution concentrated in poor/minority areas)
- Discriminatory outcomes (hiring, lending, sentencing, school discipline)
- Corporate profit from harm (price gouging, predatory lending, pollution)

If the data reveals ANY inequality or harm pattern, generate a policyAnalysis with:
1. The specific injustice the data proves
2. Who is being harmed (be specific with numbers from the data)
3. A concrete policy recommendation to fix it
4. Budget impact using the actual data values

Example: Data showing median income by zip code reveals $45k in poor areas vs $120k in wealthy areas → Policy: Progressive property tax + universal basic services → Budget: Redistribute $2.5M/year based on the income gap.`,
        },
        {
          role: 'user',
          content: `Dataset: ${data}\n${question ? `Question: ${question}` : ''}`,
        },
      ]);

      return NextResponse.json(result);
    } catch (llmError) {
      console.error('Data analyze LLM error:', llmError);
      
      // Attempt to extract numbers from the data for basic fallback math
      const numMatches = data.match(/-?\d+(?:\.\d+)?/g);
      const numbers = numMatches ? numMatches.map(Number).sort((a: number, b: number) => a - b) : [0];
      
      const sum = numbers.reduce((a: number, b: number) => a + b, 0);
      const mean = sum / numbers.length;
      const median = numbers.length % 2 === 0 
        ? (numbers[numbers.length / 2 - 1] + numbers[numbers.length / 2]) / 2
        : numbers[Math.floor(numbers.length / 2)];
      const range = numbers[numbers.length - 1] - numbers[0];
      
      // Basic mode calculation
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let modeNum = numbers[0];
      numbers.forEach((n: number) => {
        counts[n] = (counts[n] || 0) + 1;
        if (counts[n] > maxCount) {
          maxCount = counts[n];
          modeNum = n;
        }
      });
      const mode = maxCount > 1 ? modeNum.toString() : "No repeating numbers";

      return NextResponse.json({
        mean,
        median,
        mode,
        range,
        analysis: "Here is a basic statistical breakdown of the numbers you provided. A full analysis wasn't available at the moment.",
        insight: `Your data spans from ${numbers[0]} to ${numbers[numbers.length - 1]}, giving a range of ${range}.`,
        chartType: "Bar Chart",
      });
    }
  } catch (error) {
    console.error('Data analyze error:', error);
    return NextResponse.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
}

