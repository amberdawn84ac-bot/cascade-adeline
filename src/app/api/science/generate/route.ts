import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { getStudentContext } from '@/lib/learning/student-context';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';

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

    const body = await req.json();
    const { query } = body;
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    // --- Cache-first ---
    const studentCtx = await getStudentContext(user.userId, { subjectArea: 'Science' });
    const gradeBracket = getGradeBracket(studentCtx.activeGradeLevel);
    const topicKey = query.toLowerCase().trim();
    const cached = await getCachedContent('science-experiment', topicKey, gradeBracket);
    if (cached) {
      // Still award credits even on cache hit — student did the work
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'Science', activityType: 'experiment',
        activityName: `Science Experiment: ${cached.title}`,
        metadata: { topic: query, difficulty: cached.difficulty, timeRequired: cached.timeRequired },
        masteryDemonstrated: true,
      });
      return NextResponse.json({ ...cached, creditsEarned: creditResult.creditsEarned, standardLinked: creditResult.standardLinked, cached: true });
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
          content: `You are Adeline, a wise and encouraging science mentor. You love helping students discover the physical laws of the universe through BIG, EXCITING, MEMORABLE experiments.

CRITICAL EXPERIMENT DESIGN RULES:
- Generate HANDS-ON, VISUAL, DRAMATIC experiments that create a WOW moment
- The experiment MUST produce a visible, tangible result (eruption, color change, reaction, movement, explosion, etc.)
- Make it SOCIAL MEDIA WORTHY - something they'll want to film and share
- Use common household items, but create something SPECTACULAR
- NO writing exercises, NO observation journals, NO "write down what you see" - this is ACTIVE SCIENCE

Examples of GOOD experiments:
- Volcano: Baking soda + vinegar eruption with food coloring lava
- Elephant toothpaste: Hydrogen peroxide foam explosion
- Density tower: Layered liquids creating rainbow columns
- Slime chemistry: Polymer reactions creating stretchy goo
- Mentos geyser: Diet Coke fountain
- Invisible ink: Lemon juice revealed by heat
- Crystal growing: Overnight crystal formation
- Dry ice fog: Sublimation creating spooky clouds

Examples of BAD experiments (NEVER generate these):
- "Write down your observations"
- "Draw what you see"
- "Keep a journal"
- "Research and write a report"

The experiment should be:
1. VISUAL - creates something you can see/film
2. ACTIVE - student is mixing, building, creating
3. DRAMATIC - has a wow factor
4. SHAREABLE - worth posting on social media
5. EDUCATIONAL - teaches real science principles${studentCtx.systemPromptAddendum}

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

      await saveToCache('science-experiment', topicKey, gradeBracket, result as unknown as Record<string, unknown>);

      return NextResponse.json({
        ...result,
        creditsEarned: creditResult.creditsEarned,
        standardLinked: creditResult.standardLinked,
        cached: false,
      });
    } catch (llmError) {
      console.error("Experiment generation LLM error:", llmError);
      
      // Graceful fallback if AI fails - provide a classic volcano experiment
      return NextResponse.json({
        title: `DIY Volcano Eruption`,
        difficulty: "Beginner",
        timeRequired: "20 minutes",
        safetyWarnings: ["Do this experiment outside or in a tray to catch overflow.", "Wear old clothes - food coloring can stain.", "Adult supervision recommended."],
        materials: [
          "Baking soda (2-3 tablespoons)",
          "White vinegar (1/2 cup)",
          "Dish soap (1 tablespoon)",
          "Red or orange food coloring",
          "Empty plastic bottle or cup",
          "Modeling clay or playdough (optional, for volcano shape)",
          "Large tray or baking pan to catch overflow"
        ],
        procedures: [
          "Step 1: Place your bottle or cup in the center of the tray. If using clay, mold it around the bottle to create a volcano mountain shape.",
          "Step 2: Add 2-3 tablespoons of baking soda into the bottle.",
          "Step 3: Add 1 tablespoon of dish soap to the bottle.",
          "Step 4: Add 5-10 drops of red or orange food coloring to make it look like lava.",
          "Step 5: When you're ready for the eruption, quickly pour in 1/2 cup of vinegar and step back!",
          "Step 6: Watch the chemical reaction create a foaming 'lava' eruption! You can repeat by adding more baking soda and vinegar."
        ],
        theScience: "This is an acid-base reaction! Vinegar (acetic acid) reacts with baking soda (sodium bicarbonate) to produce carbon dioxide gas. The gas creates bubbles that push the foam up and out like a volcanic eruption. The dish soap helps trap the gas bubbles to make the foam more dramatic. Real volcanoes erupt when pressure from gases and molten rock builds up underground and forces its way to the surface.",
        systemicAction: {
          actionType: "community-alert",
          target: "Local Science Center or Library",
          draftText: "I conducted a hands-on science experiment and would love to see more accessible STEM programming in our community. I request that the library or community center offer monthly hands-on science workshops for homeschool families using common household materials.",
          reasoning: "Making science accessible through hands-on experiments helps all students develop critical thinking skills and scientific literacy, regardless of their school setting."
        }
      });
    }
  } catch (error) {
    console.error("Experiment generation error:", error);
    return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 });
  }
}
