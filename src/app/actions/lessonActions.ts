'use server';

import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { lessonFormatter } from '@/lib/services/LessonFormatterService';
import { redirect } from 'next/navigation';

export async function generateAndSaveLesson(topic: string, subject: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');
  
  console.log(`[generateAndSaveLesson] Topic: ${topic}, Subject: ${subject}`);
  
  try {
    // Get user's grade level
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true }
    });
    
    const gradeLevel = userRecord?.gradeLevel || '8';
    
    // Generate lesson content using LessonFormatterService
    const contentBlocks = await lessonFormatter.formatLessonContent(topic, {
      gradeLevel,
      subject,
      includeQuizzes: true,
      maxBlocks: 15
    });
    
    console.log(`[generateAndSaveLesson] Generated ${contentBlocks.length} content blocks`);
    
    // Extract metadata from blocks
    const scriptureFoundation = extractScriptureFoundation(contentBlocks);
    const branchingLogic = extractBranchingLogic(contentBlocks);
    const credits = calculateCredits(contentBlocks, subject);
    
    // Save to database
    const lesson = await prisma.lesson.create({
      data: {
        lessonId: `lesson-${Date.now()}`,
        title: topic,
        subject: subject,
        gradeLevel,
        lessonJson: contentBlocks,
        standardsCodes: [],
        estimatedDuration: 45 // 45 minutes default
      }
    });
    
    // Create initial student progress tracking
    contentBlocks.forEach(async (block: any) => {
      await prisma.studentLessonProgress.create({
        data: {
          userId: user.userId,
          lessonId: lesson.id,
          blockId: block.block_id,
          completed: false,
          timeSpent: 0
        }
      });
    });
    
    console.log(`[generateAndSaveLesson] Created lesson ${lesson.id}`);
    return lesson.id;
    
  } catch (error) {
    console.error('[generateAndSaveLesson] Error:', error);
    throw new Error('Failed to generate and save lesson');
  }
}

function extractScriptureFoundation(blocks: any[]) {
  const scriptureBlock = blocks.find(b => b.block_type === 'scripture');
  if (!scriptureBlock) return null;
  
  return {
    primary_passage: scriptureBlock.reference,
    full_text: scriptureBlock.passage,
    connection: scriptureBlock.reflection_prompt
  };
}

function extractBranchingLogic(blocks: any[]) {
  const decisionPoints = blocks
    .filter(b => b.branching)
    .map(b => ({
      trigger_block: b.block_id,
      conditions: b.branching
    }));
  
  return { decision_points: decisionPoints };
}

function calculateCredits(blocks: any[], subject: string) {
  const hasInvestigation = blocks.some(b => b.block_type === 'investigation');
  const hasPrimarySources = blocks.filter(b => b.block_type === 'primary_source').length;
  const hasHandsOn = blocks.some(b => b.block_type === 'hands_on');
  
  const credits = [
    { subject: 'US History', hours: 1.5 },
    { subject: 'Critical Thinking', hours: hasInvestigation ? 1.0 : 0.5 },
    { subject: 'Research Skills', hours: hasPrimarySources * 0.25 }
  ];
  
  if (hasHandsOn) {
    credits.push({ subject: 'Practical Arts', hours: 0.5 });
  }
  
  return credits;
}
