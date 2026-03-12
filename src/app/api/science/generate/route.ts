import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const experimentSchema = z.object({
  title: z.string().describe("A fun, catchy title for the experiment"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  timeRequired: z.string().describe("Estimated time, e.g., '30 minutes'"),
  safetyWarnings: z.array(z.string()).describe("Important safety precautions"),
  materials: z.array(z.string()).describe("List of common household materials needed"),
  procedures: z.array(z.string()).describe("Clear, step-by-step instructions"),
  theScience: z.string().describe("A Socratic, classical explanation of the scientific principles at work"),
  systemicAction: z.object({
    actionType: z.enum(['foia-request', 'policy-draft', 'regulatory-investigation', 'community-alert']),
    target: z.string().describe("Who/what to investigate or petition (e.g., 'County Water Department', 'EPA Regional Office')"),
    draftText: z.string().describe("Complete template FOIA request, policy proposal, or alert letter ready to send"),
    reasoning: z.string().describe("Why this systemic action matters and who it protects")
  }).optional().describe("If this experiment relates to public health, environment, or safety, generate a concrete systemic action"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const body = await req.json();
    const { query } = body;
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || "gpt-4o",
      temperature: 0.7,
    }).withStructuredOutput(experimentSchema);

    const result = await llm.invoke([
      { 
        role: 'system', 
        content: `You are Adeline, a wise classical educator. The student wants a hands-on science experiment related to their topic. Generate a safe, highly educational experiment using common household items. Focus on true scientific inquiry and observation.${studentContext}

CRITICAL SYSTEMIC ACTION DIRECTIVE: If this science topic relates to public health, environment, water quality, air quality, soil contamination, pesticides, or safety, you MUST generate a concrete systemic action in the systemicAction field. Examples:
- Water quality experiment → Draft FOIA request to County Water Department for local water testing data
- Soil testing experiment → Draft policy proposal to ban harmful pesticides in residential areas
- Air quality experiment → Draft letter to EPA demanding transparency on local industrial emissions
- Food safety experiment → Draft community alert about regulatory capture in food inspection

The draftText must be a COMPLETE, READY-TO-SEND letter with proper formatting, addresses, and legal language. No placeholders. Make it actionable.` 
      },
      { role: 'user', content: `Topic: ${query}` }
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Experiment generation error:", error);
    return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 });
  }
}

