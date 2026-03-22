/**
 * Multi-Subject Credit Calculator
 * 
 * Calculates credit hours for multiple subjects based on lesson content and student performance.
 * A single lesson can award credits to multiple subjects simultaneously.
 * 
 * Example: A Dawes Act lesson might award:
 * - 1.5 hours US History (primary subject)
 * - 0.5 hours Critical Thinking (investigation skills)
 * - 1.0 hours Research Skills (document analysis)
 * - 0.5 hours Biblical Studies (if scripture analysis included)
 */

import type { CreditAward } from '../langgraph/lesson/lessonState';
import type { LessonBlock } from '../langgraph/lesson/lessonState';

interface CreditCalculationInput {
  subject: string;
  topic: string;
  blocks: LessonBlock[];
  standardsCodes: string[];
  quizScore?: number;
  completedBlocks: string[];
}

interface SubjectCreditConfig {
  baseHours: number;
  bonusForInvestigation?: number;
  bonusForScripture?: number;
  bonusForHandsOn?: number;
  bonusForPrimarySources?: number;
  requiredBlockTypes?: string[];
}

const SUBJECT_CREDIT_CONFIGS: Record<string, SubjectCreditConfig> = {
  // History subjects - base hours + bonuses for investigation depth
  'US History': {
    baseHours: 0.75,
    bonusForPrimarySources: 0.25,
    bonusForInvestigation: 0.5,
    requiredBlockTypes: ['text', 'primary_source'],
  },
  'World History': {
    baseHours: 0.75,
    bonusForPrimarySources: 0.25,
    bonusForInvestigation: 0.5,
    requiredBlockTypes: ['text', 'primary_source'],
  },
  'Oklahoma History': {
    baseHours: 0.5,
    bonusForPrimarySources: 0.25,
    bonusForInvestigation: 0.5,
    requiredBlockTypes: ['text', 'primary_source'],
  },
  
  // Cross-cutting skills - awarded when specific block types are present
  'Critical Thinking': {
    baseHours: 0.5,
    requiredBlockTypes: ['investigation'],
  },
  'Research Skills': {
    baseHours: 0.5,
    bonusForPrimarySources: 0.5,
    requiredBlockTypes: ['primary_source', 'investigation'],
  },
  'Document Analysis': {
    baseHours: 0.5,
    bonusForPrimarySources: 0.25,
    requiredBlockTypes: ['primary_source'],
  },
  'Biblical Studies': {
    baseHours: 0.5,
    requiredBlockTypes: ['scripture'],
  },
  
  // Economics - awarded for economic investigation types
  'Economics': {
    baseHours: 0.5,
    bonusForInvestigation: 0.25,
    requiredBlockTypes: ['investigation'],
  },
  
  // English Language Arts
  'English Language Arts': {
    baseHours: 0.5,
    bonusForPrimarySources: 0.25,
    requiredBlockTypes: ['text'],
  },
};

const INVESTIGATION_TYPE_CREDITS: Record<string, string[]> = {
  'follow-the-money': ['Economics', 'Critical Thinking', 'Research Skills'],
  'compare-sources': ['Critical Thinking', 'Document Analysis', 'Research Skills'],
  'timeline': ['Critical Thinking', 'Research Skills'],
  'network-map': ['Critical Thinking', 'Research Skills'],
  'propaganda-analysis': ['Critical Thinking', 'Document Analysis'],
  'document-analysis': ['Document Analysis', 'Research Skills'],
};

/**
 * Calculate multi-subject credit awards for a lesson
 */
export function calculateLessonCredits(input: CreditCalculationInput): CreditAward[] {
  const awards: CreditAward[] = [];
  
  // 1. Determine primary subject credit
  const primaryCredit = calculatePrimarySubjectCredit(input);
  if (primaryCredit) {
    awards.push(primaryCredit);
  }
  
  // 2. Add Biblical Studies credit if scripture present
  const scriptureBlocks = input.blocks.filter(b => b.type === 'scripture');
  if (scriptureBlocks.length > 0) {
    awards.push({
      subject: 'Biblical Studies',
      hours: 0.5,
      standards: [], // Could map to biblical literacy standards
      sourceBlocks: scriptureBlocks.map((_, i) => `scripture-${i}`),
    });
  }
  
  // 3. Add investigation-based credits
  const investigationBlocks = input.blocks.filter(b => b.type === 'investigation');
  if (investigationBlocks.length > 0) {
    const investigationType = investigationBlocks[0]?.interactive?.investigationType;
    if (investigationType && INVESTIGATION_TYPE_CREDITS[investigationType]) {
      const skillSubjects = INVESTIGATION_TYPE_CREDITS[investigationType];
      
      for (const skillSubject of skillSubjects) {
        // Don't duplicate if already awarded as primary
        if (awards.some(a => a.subject === skillSubject)) continue;
        
        const config = SUBJECT_CREDIT_CONFIGS[skillSubject];
        if (config) {
          const hours = calculateSkillCreditHours(input.blocks, config);
          if (hours > 0) {
            awards.push({
              subject: skillSubject,
              hours,
              standards: [],
              sourceBlocks: investigationBlocks.map((_, i) => `investigation-${i}`),
            });
          }
        }
      }
    }
  }
  
  // 4. Add primary source analysis credit if significant source work
  const primarySourceBlocks = input.blocks.filter(b => b.type === 'primary_source');
  if (primarySourceBlocks.length >= 2 && !awards.some(a => a.subject === 'Document Analysis')) {
    awards.push({
      subject: 'Document Analysis',
      hours: 0.5 + (primarySourceBlocks.length - 2) * 0.25,
      standards: [],
      sourceBlocks: primarySourceBlocks.map((_, i) => `primary_source-${i}`),
    });
  }
  
  return awards;
}

/**
 * Calculate credit hours for primary subject
 */
function calculatePrimarySubjectCredit(input: CreditCalculationInput): CreditAward | null {
  // Map subject to credit subject name
  const creditSubjectMap: Record<string, string> = {
    'american history': 'US History',
    'u.s. history': 'US History',
    'us history': 'US History',
    'history': 'US History',
    'world history': 'World History',
    'oklahoma history': 'Oklahoma History',
    'social studies': 'US History',
    'civics': 'US Government',
    'government': 'US Government',
    'economics': 'Economics',
    'english': 'English Language Arts',
    'language arts': 'English Language Arts',
    'math': 'Mathematics',
    'mathematics': 'Mathematics',
    'science': 'Science',
    'biology': 'Biology',
    'bible': 'Biblical Studies',
    'biblical studies': 'Biblical Studies',
  };
  
  const subjectKey = input.subject.toLowerCase().trim();
  const creditSubject = creditSubjectMap[subjectKey] || input.subject;
  const config = SUBJECT_CREDIT_CONFIGS[creditSubject];
  
  if (!config) {
    // Default credit for unmapped subjects
    return {
      subject: creditSubject,
      hours: 0.5,
      standards: input.standardsCodes,
      sourceBlocks: input.completedBlocks,
    };
  }
  
  let hours = config.baseHours;
  
  // Add bonuses based on block types present
  const blockTypes = new Set(input.blocks.map(b => b.type));
  
  if (config.bonusForPrimarySources && blockTypes.has('primary_source')) {
    const count = input.blocks.filter(b => b.type === 'primary_source').length;
    hours += config.bonusForPrimarySources * Math.min(count, 3);
  }
  
  if (config.bonusForInvestigation && blockTypes.has('investigation')) {
    hours += config.bonusForInvestigation;
  }
  
  if (config.bonusForScripture && blockTypes.has('scripture')) {
    hours += config.bonusForScripture;
  }
  
  if (config.bonusForHandsOn && blockTypes.has('hands-on')) {
    hours += config.bonusForHandsOn;
  }
  
  // Cap at 3 hours per lesson for any single subject
  hours = Math.min(hours, 3.0);
  
  return {
    subject: creditSubject,
    hours: parseFloat(hours.toFixed(2)),
    standards: input.standardsCodes,
    sourceBlocks: input.completedBlocks,
  };
}

/**
 * Calculate credit hours for skill-based subjects
 */
function calculateSkillCreditHours(blocks: LessonBlock[], config: SubjectCreditConfig): number {
  const blockTypes = new Set(blocks.map(b => b.type));
  
  // Check if required block types are present
  if (config.requiredBlockTypes) {
    const hasRequired = config.requiredBlockTypes.some(type => 
      blockTypes.has(type as LessonBlock['type'])
    );
    if (!hasRequired) return 0;
  }
  
  let hours = config.baseHours;
  
  // Add bonuses
  if (config.bonusForPrimarySources && blockTypes.has('primary_source')) {
    const count = blocks.filter(b => b.type === 'primary_source').length;
    hours += config.bonusForPrimarySources * Math.min(count, 2);
  }
  
  if (config.bonusForInvestigation && blockTypes.has('investigation')) {
    hours += config.bonusForInvestigation;
  }
  
  return parseFloat(hours.toFixed(2));
}

/**
 * Get total hours across all credit awards
 */
export function getTotalCreditHours(awards: CreditAward[]): number {
  return parseFloat(
    awards.reduce((sum, award) => sum + award.hours, 0).toFixed(2)
  );
}

/**
 * Group credits by subject for transcript display
 */
export function groupCreditsBySubject(awards: CreditAward[]): Map<string, number> {
  const grouped = new Map<string, number>();
  
  for (const award of awards) {
    const current = grouped.get(award.subject) || 0;
    grouped.set(award.subject, current + award.hours);
  }
  
  return grouped;
}
