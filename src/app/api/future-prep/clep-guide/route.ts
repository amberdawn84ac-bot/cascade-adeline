import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

const LAUNCHPAD_SYSTEM_PROMPT = `You are an elite academic coach specializing in CLEP exam preparation and Dual Enrollment success.

STRICT RULES — NEVER break these:
1. You do NOT grant college credit yourself. You prepare students to earn it through official external channels.
2. Hold students to genuine university-level standards — not high school rigor. CLEP exams are 50th-percentile college-sophomore material.
3. Be specific. When generating a study guide, name actual concepts, theorems, authors, movements, formulas, and time periods that appear on the real exam.
4. For every topic area, include: what to master, what common mistakes to avoid, and what depth of knowledge the exam expects.
5. Proactively flag the hardest sections. Do not sugarcoat difficulty.
6. End every guide with a realistic weekly study schedule.`;

const requestSchema = z.object({
  examName: z.string().min(2),
  weeksTilExam: z.number().int().min(1).max(52).optional(),
  priorKnowledge: z.string().optional(),
});

const studyGuideSchema = z.object({
  guide: z.string().describe("Complete CLEP study guide with all sections"),
  careerEthics: z.object({
    industryHarms: z.string().describe("Common ways this career field profits from harming others (regulatory capture, exploitation, environmental damage, predatory practices)"),
    ethicalAlternatives: z.string().describe("How to practice this profession without causing harm - specific ethical frameworks and practices"),
    advocacyOpportunities: z.string().describe("Policy reforms, whistleblower paths, or advocacy organizations in this field - name specific groups and campaigns")
  }).describe("Ethical analysis of the career field this exam prepares students for"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { examName, weeksTilExam, priorKnowledge } = requestSchema.parse(body);

    const studentCtx = await getStudentContext(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.4, maxTokens: 1500 }).withStructuredOutput(studyGuideSchema);

    const userPrompt = [
      `Generate a rigorous, college-level CLEP study guide for: **${examName}**.`,
      weeksTilExam ? `The student has ${weeksTilExam} weeks until the exam.` : '',
      priorKnowledge ? `Prior knowledge level: ${priorKnowledge}.` : 'Assume minimal prior knowledge.',
      '',
      'Structure the guide as follows:',
      '1. EXAM OVERVIEW — format, time limit, # questions, passing score (typically 50/80)',
      '2. CRITICAL TOPIC AREAS — list every major domain tested with the depth required',
      '3. THE HARD SECTIONS — the 2-3 areas that trip most students up and why',
      '4. RESOURCES — specific free and paid study resources (Khan Academy, REA guides, etc.)',
      '5. WEEKLY STUDY SCHEDULE — broken into concrete daily tasks',
      '6. ADELINE\'S CHALLENGE — end with one hard question from the exam to answer right now',
    ].filter(Boolean).join('\n');

    const result = await llm.invoke([
      { role: 'system', content: `${LAUNCHPAD_SYSTEM_PROMPT}${studentCtx.systemPromptAddendum}

CRITICAL CAREER ETHICS DIRECTIVE: After generating the study guide, you MUST analyze the ethical implications of the career field this exam prepares students for. Address:
1. INDUSTRY HARMS: How does this field commonly profit from harming others? (e.g., Healthcare → Insurance denials for profit, Law → Defending corporate polluters, Business → Exploiting workers, Psychology → Over-medication for profit)
2. ETHICAL ALTERNATIVES: Specific ways to practice this profession ethically (e.g., Pro bono work, worker co-ops, environmental law, community mental health)
3. ADVOCACY OPPORTUNITIES: Name SPECIFIC organizations, whistleblower protections, or policy reforms (e.g., "Public Citizen for corporate accountability", "Physicians for a National Health Program", "Whistleblower Protection Act")

Never present careers as morally neutral. Every profession has ethical pitfalls and opportunities for justice work.` },
      { role: 'user', content: userPrompt },
    ]);

    return NextResponse.json({ guide: result.guide, careerEthics: result.careerEthics, examName });
  } catch (error) {
    console.error('[clep-guide] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to generate study guide' }, { status: 500 });
  }
}

