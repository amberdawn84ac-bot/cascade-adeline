import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { findPrimarySources } from '@/lib/hippocampus/retrieve';
import type { PrimarySourceRecord } from '@/lib/hippocampus/types';

// Content block schema for structured lesson content
export const ContentBlockSchema = z.object({
  type: z.enum(['title', 'primary_text', 'quiz']),
  content: z.string(),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
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
        type: 'title',
        content: `${topic} - Learning Exploration`
      },
      {
        type: 'primary_text',
        content: `We're currently gathering verified primary sources about "${topic}". In the meantime, let's explore this topic together using critical thinking and inquiry-based learning. ${gradeLevel ? `This content is adapted for ${gradeLevel} level.` : ''}`
      },
      ...(gradeLevel && parseInt(gradeLevel) >= 3 ? [{
        type: 'quiz' as const,
        content: `What aspect of ${topic} interests you most?`,
        question: `What would you like to learn about ${topic}?`,
        options: [
          "The historical context and timeline",
          "Key people and their contributions", 
          "How this affects us today",
          "Primary sources and evidence"
        ],
        answer: "All of these aspects are important for understanding this topic"
      }] : [])
    ];
  }

  /**
   * System prompt for LLM formatting
   */
  private getSystemPrompt(gradeLevel?: string, includeQuizzes = true, maxBlocks = 10): string {
    return `You are an expert educational content architect specializing in Truth-First learning. Your task is to format verified primary source text into structured JSON content blocks for dynamic lesson rendering.

STRICT REQUIREMENTS:
1. You MUST output a valid JSON array of objects
2. Each object MUST have a "type" and "content" field
3. Types allowed: "title", "primary_text", "quiz"
4. Maximum ${maxBlocks} blocks total
5. Content MUST be based ONLY on the provided verified sources

CONTENT TYPE RULES:
- "title": Large header text, concise and engaging
- "primary_text": Main content from sources, clearly attributed
- "quiz": Multiple choice questions to check understanding

QUIZ RULES (if enabled):
- Must have "question", "options" (array of 4 strings), and "answer" fields
- Questions should test comprehension of the provided text
- Answers should be clearly supported by the source material
- Make questions age-appropriate for ${gradeLevel || 'middle school'} level

TRUTH-FIRST PRINCIPLES:
- Never invent information not present in sources
- Clearly distinguish between facts and interpretations
- Encourage critical thinking about source reliability
- Maintain academic integrity while being engaging

GRADE LEVEL ADAPTATION:
- ${gradeLevel ? `Adapt complexity for ${gradeLevel} level` : 'Use middle school appropriate language'}
- Shorter sentences for younger grades
- More complex analysis for older grades

OUTPUT FORMAT:
[
  {"type": "title", "content": "..."},
  {"type": "primary_text", "content": "..."},
  ${includeQuizzes ? '{"type": "quiz", "question": "...", "options": ["...", "...", "...", "..."], "answer": "..."}' : ''}
]`
  }

  /**
   * User prompt for LLM formatting
   */
  private getUserPrompt(topic: string, sourceText: string, gradeLevel?: string, subject?: string): string {
    return `Please format the following verified primary source content about "${topic}" into structured content blocks.

TOPIC: ${topic}
${subject ? `SUBJECT: ${subject}` : ''}
${gradeLevel ? `GRADE LEVEL: ${gradeLevel}` : ''}

VERIFIED PRIMARY SOURCES:
${sourceText}

Requirements:
1. Create an engaging title block
2. Extract and organize the main content into primary_text blocks
3. ${gradeLevel && parseInt(gradeLevel) >= 3 ? 'Include at least one comprehension quiz' : 'Skip quiz blocks for this grade level'}
4. Ensure all content is based on the provided sources
5. Make it engaging while maintaining Truth-First principles

Please output only the JSON array, no additional text.`
  }
}

// Export singleton instance
export const lessonFormatter = new LessonFormatterService();
