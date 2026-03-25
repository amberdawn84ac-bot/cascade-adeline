import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { findPrimarySources } from '@/lib/hippocampus/retrieve';
import type { PrimarySourceRecord } from '@/lib/hippocampus/types';

// Content block schema for structured lesson content
export const ContentBlockSchema = z.object({
  block_id: z.string(),
  block_type: z.enum([
    'text', 'scripture', 'primary_source', 'investigation', 
    'quiz', 'hands_on', 'photo', 'video', 'flashcard', 
    'infographic', 'game', 'worksheet'
  ]),
  order: z.number(),
  content: z.any(),
  
  // Text block
  visual_style: z.enum(['paragraph', 'callout', 'handwritten']).optional(),
  emphasis: z.enum(['normal', 'highlighted', 'important']).optional(),
  
  // Scripture block
  reference: z.string().optional(),
  translation: z.string().optional(),
  passage: z.string().optional(),
  hebrew_notes: z.string().optional(),
  reflection_prompt: z.string().optional(),
  
  // Primary source block
  source_type: z.enum(['document', 'photo', 'audio', 'video', 'artifact']).optional(),
  title: z.string().optional(),
  source_id: z.string().optional(),
  date: z.string().optional(),
  creator: z.string().optional(),
  context: z.string().optional(),
  citation: z.string().optional(),
  investigation_prompts: z.array(z.string()).optional(),
  excerpt: z.string().optional(),
  image_url: z.string().optional(),
  caption: z.string().optional(),
  
  // Investigation block
  prompt: z.string().optional(),
  investigation_type: z.enum([
    'follow-the-money', 'compare-sources', 'timeline', 
    'network-map', 'propaganda-analysis'
  ]).optional(),
  guiding_questions: z.array(z.string()).optional(),
  resources: z.array(z.any()).optional(),
  expected_duration: z.string().optional(),
  
  // Quiz block
  question: z.string().optional(),
  quiz_type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'matching']).optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  explanation: z.string().optional(),
  passing_score: z.number().optional(),
  
  // Hands-on block
  activity_title: z.string().optional(),
  description: z.string().optional(),
  materials_needed: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  safety_notes: z.array(z.string()).optional(),
  documentation_prompts: z.array(z.string()).optional(),
  
  // Photo/Video block
  video_url: z.string().optional(),
  duration: z.string().optional(),
  transcript_available: z.boolean().optional(),
  viewing_prompts: z.array(z.string()).optional(),
  analysis_prompts: z.array(z.string()).optional(),
  
  // Flashcard block
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    etymology: z.string().optional()
  })).optional(),
  style: z.enum(['flip', 'swipe', 'quiz']).optional(),
  
  // Infographic block
  data_visualization: z.enum(['timeline', 'bar-chart', 'network', 'map']).optional(),
  data_source: z.string().optional(),
  svg_content: z.string().optional(),
  interpretation_guide: z.string().optional(),
  data_points: z.array(z.any()).optional(),
  
  // Game block
  game_type: z.enum(['matching', 'sorting', 'timeline', 'map-placement']).optional(),
  instructions: z.string().optional(),
  items: z.array(z.any()).optional(),
  
  // Worksheet block
  format: z.enum(['pdf', 'interactive']).optional(),
  sections: z.array(z.any()).optional(),
  downloadable: z.boolean().optional(),
  
  // Branching
  branching: z.object({
    on_score_above_80: z.object({
      show_blocks: z.array(z.string()),
      skip_blocks: z.array(z.string()).optional(),
      message: z.string().optional()
    }).optional(),
    on_score_below_70: z.object({
      show_blocks: z.array(z.string()),
      skip_blocks: z.array(z.string()).optional(),
      message: z.string().optional()
    }).optional(),
    branches: z.record(z.any()).optional()
  }).optional(),
  
  // Conditions
  conditions: z.object({
    requires_completion: z.array(z.string()).optional(),
    requires_score_above: z.number().optional(),
    or_has_completed_lessons: z.array(z.string()).optional()
  }).optional(),
  
  // Metadata
  metadata: z.object({
    estimatedTime: z.number().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    prerequisites: z.array(z.string()).optional()
  }).optional()
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export interface FormatterOptions {
  gradeLevel?: string;
  subject?: string;
  includeQuizzes?: boolean;
  maxBlocks?: number;
}

/**
 * LessonFormatterService - Takes verified text from Hippocampus Retriever
 * and formats it into structured JSON content blocks for dynamic rendering
 */
export class LessonFormatterService {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({ 
      model: 'gpt-4o-mini', 
      temperature: 0.3,
      maxTokens: 2000
    });
  }

  /**
   * Format retrieved primary sources into structured content blocks
   */
  async formatLessonContent(
    topic: string,
    options: FormatterOptions = {}
  ): Promise<ContentBlock[]> {
    const { gradeLevel, subject, includeQuizzes = true, maxBlocks = 10 } = options;

    console.log(`[LessonFormatter] Formatting content for topic: "${topic}"`);

    // 1. Retrieve verified primary sources from Hippocampus
    const sources = await findPrimarySources(topic, {
      subjectTrack: subject,
      limit: 5,
      minSimilarity: 0.85
    });

    if (sources.length === 0) {
      console.warn(`[LessonFormatter] No verified sources found for topic: "${topic}"`);
      return this.generateFallbackContent(topic, gradeLevel);
    }

    console.log(`[LessonFormatter] Found ${sources.length} verified sources`);

    // 2. Combine sources into formatted text
    const combinedText = sources.map((source, index) => 
      `SOURCE ${index + 1}: ${source.title}\n${source.content}`
    ).join('\n\n---\n\n');

    // 3. Format using LLM with strict schema
    const structuredContent = await this.llm.withStructuredOutput(
      z.array(ContentBlockSchema)
    ).invoke([
      {
        role: 'system',
        content: this.getSystemPrompt(gradeLevel, includeQuizzes, maxBlocks),
      },
      {
        role: 'user',
        content: this.getUserPrompt(topic, combinedText, gradeLevel, subject),
      },
    ]);

    console.log(`[LessonFormatter] Generated ${structuredContent.length} content blocks`);
    return structuredContent;
  }

  /**
   * Generate fallback content when no sources are found
   */
  private generateFallbackContent(topic: string, gradeLevel?: string): ContentBlock[] {
    return [
      {
        block_id: 'text-1',
        block_type: 'text',
        order: 1,
        content: `${topic} - Learning Exploration`,
        visual_style: 'callout',
        emphasis: 'highlighted'
      },
      {
        block_id: 'text-2',
        block_type: 'text',
        order: 2,
        content: `We're currently gathering verified primary sources about "${topic}". In the meantime, let's explore this topic together using critical thinking and inquiry-based learning. ${gradeLevel ? `This content is adapted for ${gradeLevel} level.` : ''}`,
        visual_style: 'paragraph',
        emphasis: 'normal'
      },
      ...(gradeLevel && parseInt(gradeLevel) >= 3 ? [{
        block_id: 'quiz-1',
        block_type: 'quiz' as const,
        order: 3,
        question: `What aspect of ${topic} interests you most?`,
        quiz_type: 'multiple-choice' as const,
        options: [
          "The historical context and timeline",
          "Key people and their contributions", 
          "How this affects us today",
          "Primary sources and evidence"
        ],
        answer: "All of these aspects are important for understanding this topic",
        explanation: "Understanding a topic requires examining multiple perspectives and evidence types."
      }] : [])
    ];
  }

  /**
   * System prompt for LLM formatting
   */
  private getSystemPrompt(gradeLevel?: string, includeQuizzes = true, maxBlocks = 15): string {
    return `You are an expert educational content architect for Dear Adeline, specializing in Truth-First learning through PRIMARY SOURCES.

Your task: Format verified primary source text into a structured lesson following the Dear Adeline lesson schema.

PHILOSOPHY (CRITICAL):
- History is studied to LEARN FROM MISTAKES
- Present PRIMARY SOURCES (documents, photos, testimonies) - NEVER textbooks
- Ask "Who benefits?" - expose propaganda and hidden agendas
- Let students draw conclusions from evidence
- Reference model: "Lies My Teacher Told Me" by James Loewen
- All historical information must come from PRIMARY SOURCES
- No hidden agendas. No sanitized narratives. No whitewashing.
- The goal: present official narrative alongside primary sources, then ask "who benefits from the gap?"

BLOCK TYPES YOU MUST USE:
1. text - Introductory content, transitions
2. scripture - Biblical foundation (if relevant)
3. primary_source - Historical documents, photos, artifacts
4. investigation - "Follow the money" prompts
5. quiz - Comprehension checks with branching
6. hands_on - Farm/practical activities (if applicable)

REQUIRED STRUCTURE:
1. Start with engaging text block introducing topic
2. Add scripture block if moral/ethical dimension exists
3. Present 2-3 primary_source blocks with investigation_prompts
4. Include investigation block with "follow-the-money" or "compare-sources" type
5. Add quiz block with branching logic (score > 80 = advanced content)
6. Maximum ${maxBlocks} blocks total

PRIMARY SOURCE REQUIREMENTS:
- Each primary_source block MUST have:
  * source_type: document, photo, audio, or artifact
  * title, date, creator
  * excerpt or image_url
  * citation
  * investigation_prompts: ["What do you notice?", "Who created this and why?", "What's missing?"]

INVESTIGATION REQUIREMENTS:
- investigation_type: "follow-the-money", "compare-sources", "timeline", or "network-map"
- guiding_questions that push critical thinking:
  * "Who profited from this?"
  * "What resources were at stake?"
  * "Whose perspective is missing?"

QUIZ BRANCHING:
- Include branching logic in quiz blocks:
  * on_score_above_80: show advanced investigation blocks
  * on_score_below_70: show review/scaffolding blocks

GRADE LEVEL: ${gradeLevel || 'middle school'}
- Adapt language complexity
- Younger: shorter sentences, concrete examples
- Older: complex analysis, multiple perspectives

OUTPUT: Valid JSON array of block objects following the schema exactly.`;
  }

  /**
   * User prompt for LLM formatting
   */
  private getUserPrompt(topic: string, sourceText: string, gradeLevel?: string, subject?: string): string {
    return `Create a Truth-First lesson about "${topic}" using these verified primary sources.

TOPIC: ${topic}
SUBJECT: ${subject || 'truth-based-history'}
GRADE: ${gradeLevel || '8'}

PRIMARY SOURCES:
${sourceText}

REQUIREMENTS:
1. Start with text block: engaging introduction
2. If moral dimension exists: add scripture block
3. Present sources as primary_source blocks with investigation prompts
4. Add investigation block: "Follow the money - who benefited from ${topic}?"
5. Include quiz with branching (score > 80 → advanced content)
6. Each primary source must have investigation_prompts asking:
   - "What do you notice?"
   - "Who created this and why?"
   - "What perspective is missing?"

CRITICAL: Base ALL content on provided sources. Never invent facts.

Output JSON array of blocks following schema.`;
  }
}

// Export singleton instance
export const lessonFormatter = new LessonFormatterService();
