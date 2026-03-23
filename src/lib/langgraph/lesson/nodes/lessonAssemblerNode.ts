/**
 * Lesson Assembler LangGraph Node
 * 
 * Finds relevant lessons, adapts to student environment,
 * filters by ZPD/standards gaps, and prepares GenUI payload.
 */

import prisma from '@/lib/db';
import { getStudentContext } from '@/lib/learning/student-context';
import { getAllCodesForSubject } from '@/lib/standards/subjectStandardsMap';
import type { LessonAssemblerState, LessonData, LessonBlock, StudentEnvironment } from '@/types/lesson';

export async function lessonAssemblerNode(state: LessonAssemblerState): Promise<Partial<LessonAssemblerState>> {
  console.log(`[lessonAssembler] Processing lesson request: ${state.subject} - ${state.topic}`);
  
  try {
    // 1. Get student context and environment
    const studentCtx = await getStudentContext(state.userId, { subjectArea: state.subject });
    const environment = await getStudentEnvironment(state.userId);
    
    // 2. Find relevant lessons
    const relevantLessons = await findRelevantLessons(
      state.subject,
      state.topic,
      state.gradeLevel,
      environment
    );
    
    if (relevantLessons.length === 0) {
      console.log(`[lessonAssembler] No lessons found for: ${state.subject} - ${state.topic}`);
      return {
        environment,
        genUIPayload: {
          type: 'lesson',
          lesson: null as any,
          blocks: []
        }
      };
    }
    
    // 3. Select best lesson (first match for now, could add scoring)
    const selectedLesson = relevantLessons[0];
    console.log(`[lessonAssembler] Selected lesson: ${selectedLesson.title}`);
    
    // 4. Determine ZPD level based on subject-specific vs overall grade
    const zpdLevel = (studentCtx as any).zpdLevel || 'on-level';
    const adaptedBlocks = await adaptLessonBlocks(
      selectedLesson.lessonJson as LessonBlock[],
      environment,
      zpdLevel
    );
    
    // 5. Prepare GenUI payload
    const genUIPayload = {
      type: 'lesson' as const,
      lesson: selectedLesson,
      blocks: adaptedBlocks
    };
    
    return {
      environment,
      selectedLesson,
      adaptedBlocks,
      genUIPayload,
      standardsGaps: [], // TODO: Get from student context
      zpdLevel: (studentCtx as any).zpdLevel || 'on-level' // TODO: Get from student context
    };
    
  } catch (error) {
    console.error('[lessonAssembler] Error:', error);
    return {
      genUIPayload: {
        type: 'lesson',
        lesson: null as any,
        blocks: []
      }
    };
  }
}

/**
 * Find relevant lessons based on subject, topic, and grade level
 */
async function findRelevantLessons(
  subject: string,
  topic: string,
  gradeLevel: string,
  environment?: StudentEnvironment
): Promise<LessonData[]> {
  const lessons = await prisma.lesson.findMany({
    where: {
      subject: {
        contains: subject,
        mode: 'insensitive'
      },
      isActive: true,
      OR: [
        {
          title: {
            contains: topic,
            mode: 'insensitive'
          }
        },
        {
          // Could add semantic search here using embeddings
          lessonJson: {
            path: [],
            string_contains: topic
          }
        }
      ]
    },
    orderBy: [
      { gradeLevel: gradeLevel ? 'asc' : 'desc' },
      { estimatedDuration: 'asc' }
    ],
    take: 5
  });
  
  return lessons.map((lesson: any) => ({
    ...lesson,
    lessonJson: lesson.lessonJson as LessonBlock[]
  }));
}

/**
 * Adapt lesson blocks to student's environment and ZPD level
 */
async function adaptLessonBlocks(
  blocks: LessonBlock[],
  environment?: StudentEnvironment,
  zpdLevel: string = 'on-level'
): Promise<LessonBlock[]> {
  const adaptedBlocks = [...blocks];
  
  for (let i = 0; i < adaptedBlocks.length; i++) {
    let block = adaptedBlocks[i];
    
    // Adapt based on environment
    if (environment) {
      block = adaptBlockForEnvironment(block, environment);
    }
    
    // Adapt based on ZPD level
    block = adaptBlockForZPD(block, zpdLevel);
    
    adaptedBlocks[i] = block;
  }
  
  return adaptedBlocks;
}

/**
 * Adapt a single block for student's environment
 */
function adaptBlockForEnvironment(block: LessonBlock, environment: StudentEnvironment): LessonBlock {
  const adapted = { ...block };
  
  // Add environment-specific examples
  if (block.type === 'text' && environment.location === 'farm') {
    adapted.content = adaptContentForFarm(block.content as string);
  } else if (block.type === 'hands-on' && environment.resources.includes('garden')) {
    adapted.interactive = {
      ...adapted.interactive,
      // TODO: Add materials to interactive type definition
    };
  }
  
  return adapted;
}

/**
 * Adapt content for farm environment
 */
function adaptContentForFarm(content: string): string {
  // Add farm-specific examples and analogies
  const farmExamples = {
    'supply and demand': 'like crop prices at harvest time',
    'scarcity': 'like water during a drought',
    'production': 'like planting and harvesting crops',
    'labor': 'like hiring farmhands for planting season'
  };
  
  let adapted = content;
  Object.entries(farmExamples).forEach(([concept, example]) => {
    adapted = adapted.replace(new RegExp(concept, 'gi'), `${concept} (${example})`);
  });
  
  return adapted;
}

/**
 * Adapt block for ZPD level
 */
function adaptBlockForZPD(block: LessonBlock, zpdLevel: string): LessonBlock {
  const adapted = { ...block };
  
  if (zpdLevel === 'below') {
    // Add scaffolding for below-level students
    if (block.type === 'text') {
      adapted.content = `${adapted.content}\n\n**Key Vocabulary:**\n${extractKeyVocabulary(block.content as string).map(term => `- ${term}`).join('\n')}`;
    }
  } else if (zpdLevel === 'above') {
    // Add extension activities for above-level students
    if (block.type === 'investigation') {
      adapted.interactive = {
        ...adapted.interactive,
        // TODO: Add extensionQuestions to interactive type definition
      };
    }
  }
  
  return adapted;
}

/**
 * Extract key vocabulary from text content
 */
function extractKeyVocabulary(content: string): string[] {
  // Simple extraction - could be enhanced with NLP
  const vocabulary = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  return [...new Set(vocabulary)].slice(0, 5);
}

/**
 * Get student environment profile
 */
async function getStudentEnvironment(userId: string): Promise<StudentEnvironment | undefined> {
  const env = await prisma.studentEnvironment.findUnique({
    where: { userId }
  });
  
  if (!env) {
    // Create default environment if none exists
    const defaultEnv = await prisma.studentEnvironment.create({
      data: {
        userId,
        location: 'apartment' as any,
        resources: ['books', 'internet'],
        interests: [],
        constraints: [],
        preferences: {
          learningStyle: 'visual',
          pace: 'moderate'
        }
      }
    });
    
    return {
      ...defaultEnv,
      preferences: defaultEnv.preferences as any,
      location: defaultEnv.location as any
    };
  }
  
  return {
    ...env,
    preferences: env.preferences as any,
    location: env.location as any
  };
}
