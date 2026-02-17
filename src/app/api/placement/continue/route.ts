import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai-models';
import { loadConfig } from '@/lib/config';

/**
 * POST /api/placement/continue — Submit an answer and get the next question.
 *
 * Adaptive placement: LLM generates contextual follow-up questions
 * based on the student's responses so far.
 */

const SUBJECTS = ['math', 'reading', 'science', 'writing'] as const;
const MAX_QUESTIONS_PER_SUBJECT = 3;

export async function POST(req: NextRequest) {
  const { assessmentId, answer } = await req.json();

  if (!assessmentId || !answer) {
    return NextResponse.json({ error: 'assessmentId and answer required' }, { status: 400 });
  }

  const assessment = await prisma.placementAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  if (assessment.status === 'COMPLETED') {
    return NextResponse.json({
      completed: true,
      results: assessment.results,
    });
  }

  const responses = (assessment.responses as Record<string, any>) || {};
  const responseCount = Object.keys(responses).length;
  const currentSubject = assessment.currentSubject || 'introduction';

  // Record the answer for the last question
  const lastKey = String(responseCount - 1);
  if (responses[lastKey]) {
    responses[lastKey].answer = answer;
    responses[lastKey].answeredAt = new Date().toISOString();
  }

  // Determine if we should move to next subject or finish
  const subjectQuestionCount = Object.values(responses).filter(
    (r: any) => r.subject === currentSubject && r.answer
  ).length;

  let nextSubject = currentSubject;
  const subjectIdx = SUBJECTS.indexOf(currentSubject as any);

  if (currentSubject === 'introduction' || subjectQuestionCount >= MAX_QUESTIONS_PER_SUBJECT) {
    // Move to next subject
    if (currentSubject === 'introduction') {
      nextSubject = SUBJECTS[0];
    } else if (subjectIdx < SUBJECTS.length - 1) {
      nextSubject = SUBJECTS[subjectIdx + 1];
    } else {
      // All subjects done — generate report
      const results = await generateReport(responses, assessment.learningProfile as any);

      await prisma.placementAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
          responses,
          results,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ completed: true, results });
    }
  }

  // Generate next question using LLM
  const config = loadConfig();
  const { text: nextQuestion } = await generateText({
    model: getModel(config.models.default),
    maxOutputTokens: 200,
    temperature: 0.3,
    prompt: `You are a friendly placement assessment for a homeschool student.
Subject: ${nextSubject}
Previous responses: ${JSON.stringify(Object.values(responses).slice(-3))}
Student's learning profile: ${JSON.stringify(assessment.learningProfile)}

Generate ONE age-appropriate question for ${nextSubject} to assess their level.
Keep it conversational and encouraging. Return ONLY the question text.`,
  });

  // Add new question to responses
  const newKey = String(responseCount);
  responses[newKey] = {
    question: nextQuestion.trim(),
    answer: null,
    subject: nextSubject,
    timestamp: new Date().toISOString(),
  };

  await prisma.placementAssessment.update({
    where: { id: assessmentId },
    data: {
      currentSubject: nextSubject,
      responses,
    },
  });

  return NextResponse.json({
    completed: false,
    nextQuestion: nextQuestion.trim(),
    currentSubject: nextSubject,
    progress: {
      questionsAnswered: responseCount,
      currentSubjectIndex: SUBJECTS.indexOf(nextSubject as any),
      totalSubjects: SUBJECTS.length,
    },
  });
}

async function generateReport(
  responses: Record<string, any>,
  learningProfile: any
): Promise<Record<string, any>> {
  const config = loadConfig();
  const { text } = await generateText({
    model: getModel(config.models.default),
    maxOutputTokens: 800,
    temperature: 0,
    prompt: `Analyze this placement assessment and generate a report.

Responses: ${JSON.stringify(responses)}
Learning profile: ${JSON.stringify(learningProfile)}

Return ONLY valid JSON (no markdown):
{
  "summary": "Brief overall assessment",
  "subjects": {
    "math": { "level": "grade level estimate", "confidence": "high|medium|low", "strengths": ["..."], "gaps": ["..."] },
    "reading": { "level": "...", "confidence": "...", "strengths": ["..."], "gaps": ["..."] },
    "science": { "level": "...", "confidence": "...", "strengths": ["..."], "gaps": ["..."] },
    "writing": { "level": "...", "confidence": "...", "strengths": ["..."], "gaps": ["..."] }
  },
  "recommendations": ["..."]
}`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { summary: text, subjects: {}, recommendations: [] };
  }
}
