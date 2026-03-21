import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getStudentContext } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

const learningPlanSchema = z.object({
  subjects: z.array(z.object({
    subject: z.string(),
    totalCreditsNeeded: z.number(),
    standards: z.array(z.object({
      standardCode: z.string(),
      description: z.string(),
      microcreditValue: z.number(),
      activityType: z.string(),
      masteryThreshold: z.object({
        description: z.string(),
        criteria: z.array(z.string()),
      }),
    })),
  })),
  adelineMessage: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { state, graduationYear } = await req.json();
    
    if (!state || !graduationYear) {
      return NextResponse.json({ 
        error: 'Missing required fields: state and graduationYear' 
      }, { status: 400 });
    }

    // Check if plan already exists
    const existingPlan = await prisma.learningPlan.findUnique({
      where: { userId: user.userId },
    });

    if (existingPlan) {
      return NextResponse.json({ 
        error: 'Learning plan already exists for this user',
        planId: existingPlan.id,
      }, { status: 409 });
    }

    const studentCtx = await getStudentContext(user.userId);

    // Generate personalized learning plan using AI
    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.7 })
      .withStructuredOutput(learningPlanSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, creating a personalized standards-based learning plan for a student in ${state}.

${studentCtx.systemPromptAddendum}

OFFICIAL STANDARDS FRAMEWORK: Common Core State Standards (CCSS)

CRITICAL STANDARDS-BASED PLANNING RULES:

1. BREAK DOWN EACH SUBJECT INTO GRANULAR STANDARDS
   - ELA: 200 vocabulary words (each = 0.005 cr), reading comprehension skills, writing standards
   - Math: 150 concept objectives (each = 0.0067 cr for 1 credit total)
   - Science: 100 investigation standards (each = 0.01 cr)
   - Technology: Keyboarding benchmarks by grade level
   - Computer Science: 50 programming concepts (each = 0.02 cr)

2. CALCULATE MICROCREDIT VALUES
   - Total credits needed for subject ÷ number of standards = microcredit per standard
   - Example: 1 ELA credit for vocabulary ÷ 200 words = 0.005 cr per word
   
3. MAP STANDARDS TO ACTIVITIES
   - Spelling Bee → ELA vocabulary standards
   - Typing Racer → Technology keyboarding standards
   - Code Quest → CS programming concept standards
   - Math workshops → Math concept standards
   - Science experiments → Science investigation standards

4. DEFINE MASTERY THRESHOLDS
   - What does it mean to "master" this standard?
   - Spelling: Correct spelling + understand definition + use in context
   - Typing: Meet WPM + accuracy benchmarks for grade level
   - Coding: Read code + predict behavior + explain concept

5. PERSONALIZE TO STUDENT INTERESTS
   - Map boring standards to their passions
   - "Master 200 vocabulary words" → "Learn words from horse care, homesteading, and adventure stories"

GRADUATION REQUIREMENTS (24 credits total):
- English: 4 credits
- Math: 3 credits
- Science: 3 credits
- History/Social Studies: 3 credits
- Electives: 6 credits
- Trade/Business/CLEP: 3 credits
- Character/Service: 2 credits

Generate a complete learning plan with granular standards for each subject.`,
      },
      {
        role: 'user',
        content: `Create my learning plan for ${state}. I'm in grade ${studentCtx.gradeLevel} and graduate in ${graduationYear}.`,
      },
    ]);

    // Create learning plan in database
    const plan = await prisma.learningPlan.create({
      data: {
        userId: user.userId,
        state,
        graduationYear,
      },
    });

    // Create standards and activities for each subject
    for (const subject of result.subjects) {
      for (const standard of subject.standards) {
        // Create or find the state standard
        const stateStandard = await prisma.stateStandard.upsert({
          where: {
            standardCode_jurisdiction: {
              standardCode: standard.standardCode,
              jurisdiction: state,
            },
          },
          update: {
            statementText: standard.description,
            subject: subject.subject,
            gradeLevel: studentCtx.gradeLevel || '9-12',
            typicalMicrocreditValue: standard.microcreditValue,
            masteryIndicators: {
              criteria: standard.masteryThreshold.criteria,
            },
          },
          create: {
            standardCode: standard.standardCode,
            jurisdiction: state,
            subject: subject.subject,
            gradeLevel: studentCtx.gradeLevel || '9-12',
            statementText: standard.description,
            typicalMicrocreditValue: standard.microcreditValue,
            masteryIndicators: {
              criteria: standard.masteryThreshold.criteria,
            },
          },
        });

        // Add to student's plan
        const planStandard = await prisma.planStandard.create({
          data: {
            planId: plan.id,
            standardId: stateStandard.id,
            microcreditValue: standard.microcreditValue,
          },
        });

        // Create activity mapping
        await prisma.standardActivity.create({
          data: {
            planStandardId: planStandard.id,
            activityType: standard.activityType,
            activityMetadata: {
              description: standard.description,
            },
            masteryThreshold: standard.masteryThreshold,
          },
        });
      }
    }

    // Fetch complete plan with relations
    const completePlan = await prisma.learningPlan.findUnique({
      where: { id: plan.id },
      include: {
        planStandards: {
          include: {
            standard: true,
            activities: true,
          },
        },
      },
    });

    return NextResponse.json({
      plan: completePlan,
      message: result.adelineMessage,
    });

  } catch (error) {
    console.error('[learning-plan/create] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create learning plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
