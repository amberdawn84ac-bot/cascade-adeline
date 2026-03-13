import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';

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

    try {
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

      // Award credits for science experiment
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'Science',
        activityType: 'experiment',
        activityName: `Science Experiment: ${result.title}`,
        metadata: {
          topic: query,
          difficulty: result.difficulty,
          timeRequired: result.timeRequired,
        },
        masteryDemonstrated: true,
      });

      await createTranscriptEntryWithCredits(
        user.userId,
        `Science Experiment: ${result.title}`,
        'Science',
        creditResult,
        `Completed ${result.difficulty} science experiment on ${query}`,
        { experiment: result }
      );

      return NextResponse.json({
        ...result,
        creditsEarned: creditResult.creditsEarned,
        standardLinked: creditResult.standardLinked,
      });
    } catch (llmError) {
      console.error("Experiment generation LLM error:", llmError);
      
      // Graceful fallback if AI fails
      return NextResponse.json({
        title: `Exploring ${query.charAt(0).toUpperCase() + query.slice(1)}`,
        difficulty: "Beginner",
        timeRequired: "30-45 minutes",
        safetyWarnings: ["Always ask an adult for permission before starting.", "Clean your workspace when finished."],
        materials: ["Paper", "Pencil or pen", "A quiet place to observe"],
        procedures: [
          "Step 1: Write down what you already know about this topic.",
          "Step 2: Spend 10 minutes closely observing something related to this topic in your environment.",
          "Step 3: Write down three questions you have based on your observations.",
          "Step 4: Form a hypothesis (a guess) to answer one of your questions."
        ],
        theScience: "Science begins with observation and curiosity. Even when we don't have a complex experiment planned, we can act as scientists by observing the world carefully and asking good questions.",
        systemicAction: {
          actionType: "community-alert",
          target: "Local Library or Community Board",
          draftText: "I am researching this topic and want to understand how it impacts our community. I request that the library feature more resources on this subject for local citizens."
        }
      });
    }
  } catch (error) {
    console.error("Experiment generation error:", error);
    return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 });
  }
}
