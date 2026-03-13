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
        content: `You are Adeline, a wise and encouraging science mentor. You love helping students discover the physical laws of the universe. The student wants a hands-on science experiment related to their topic. Generate a safe, highly educational experiment using common household items. Make the tone warm, approachable, and inspiring. Break down complex ideas so they are easy to understand.${studentContext}

CRITICAL SYSTEMIC ACTION DIRECTIVE: If this science topic relates to public health, environment, water quality, air quality, soil contamination, pesticides, or safety, you MUST generate a concrete systemic action that creates REAL POLICY CHANGE, not just neighbor delivery.

FORBIDDEN: Do NOT suggest "delivering results to elderly neighbors" or "sharing findings with community members." That does nothing. That changes nothing.

REQUIRED: Generate actions that force institutional accountability and policy change:
- Water quality experiment → Draft FOIA request to County Water Department + template for public testimony at next County Board meeting demanding water testing transparency
- Soil testing experiment → Draft petition to City Council to ban specific pesticides + template letter to local newspaper exposing contamination data
- Air quality experiment → Draft complaint to EPA Regional Office with legal citation + template for organizing neighborhood petition drive
- Food safety experiment → Draft formal complaint to State Health Department + media pitch template to local investigative journalists

The draftText must include:
1. The primary action (FOIA, petition, complaint, testimony)
2. Follow-up escalation plan (media, legal action, organizing)
3. Specific policy change demanded
4. Timeline for action

Make it create REAL CHANGE, not feel-good neighbor visits. But present this to the student as an exciting opportunity to use their science for good, not as a grim, overwhelming burden.` 
      },
      { role: 'user', content: `Topic: ${query}` }
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Experiment generation error:", error);
    return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 });
  }
}

