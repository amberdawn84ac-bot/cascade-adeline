import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const storyAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Overall quality score (0-100)"),
  strengths: z.array(z.string()).describe("3-5 specific strengths in the story"),
  areasForGrowth: z.array(z.string()).describe("2-3 gentle suggestions for improvement"),
  grammarScore: z.number().min(0).max(100).describe("Grammar and mechanics score"),
  creativityScore: z.number().min(0).max(100).describe("Creativity and originality score"),
  narrativeScore: z.number().min(0).max(100).describe("Narrative structure and coherence score"),
  vocabularyScore: z.number().min(0).max(100).describe("Vocabulary richness and word choice score"),
  encouragement: z.string().describe("A warm, specific encouragement message"),
  nextSteps: z.string().describe("Concrete next steps for the writer to improve"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { prompt, studentStory } = await req.json();
    
    if (!studentStory || studentStory.trim().length < 10) {
      return NextResponse.json({ error: 'Story is too short to analyze' }, { status: 400 });
    }

    const wordCount = studentStory.trim().split(/\s+/).length;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';

    // Calculate credits based on word count and quality
    // Base: 0.1 for any submission, +0.1 per 100 words (max 0.5 total)
    const baseCredits = 0.1;
    const wordCredits = Math.min(0.4, Math.floor(wordCount / 100) * 0.1);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.3, // Lower temperature for consistent analysis
    }).withStructuredOutput(storyAnalysisSchema);

    const analysis = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a nurturing creative writing mentor. ${gradeContext}

Analyze this student's creative writing with warmth and specificity. Your feedback should:
- Celebrate what they did well with concrete examples
- Offer gentle, actionable suggestions for growth
- Encourage their unique voice and creativity
- Be age-appropriate and confidence-building
- Focus on the craft of storytelling, not just mechanics

Rate each dimension (grammar, creativity, narrative, vocabulary) on a 0-100 scale appropriate for their grade level.
Be generous but honest - the goal is to inspire continued writing, not discourage.`,
      },
      { 
        role: 'user', 
        content: `Original Prompt: ${JSON.stringify(prompt)}

Student's Story (${wordCount} words):
${studentStory}

Please provide a detailed, encouraging analysis.`
      },
    ]);

    // Calculate final credits with quality bonus
    const qualityMultiplier = analysis.overallScore >= 80 ? 1.2 : analysis.overallScore >= 60 ? 1.0 : 0.8;
    const creditsEarned = Math.min(0.5, (baseCredits + wordCredits) * qualityMultiplier);

    // Mint credits via transcript entry
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Creative Writing: ${prompt?.genre || 'Story'}`,
        mappedSubject: 'English Language Arts',
        creditsEarned,
        dateCompleted: new Date(),
        notes: `${wordCount} words | Overall: ${analysis.overallScore}/100 | Grammar: ${analysis.grammarScore} | Creativity: ${analysis.creativityScore}`,
        metadata: {
          prompt,
          wordCount,
          analysis,
          storyExcerpt: studentStory.substring(0, 500), // Store first 500 chars
        },
      },
    });

    return NextResponse.json({
      analysis,
      creditsEarned,
      wordCount,
      transcriptEntry,
    });
  } catch (error) {
    console.error('Story analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze story' }, { status: 500 });
  }
}

