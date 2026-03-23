/**
 * Lesson System Types
 * 
 * Defines the structure for structured lessons with standards mapping,
 * student progress tracking, and primary source integration.
 */

export interface LessonData {
  lessonId: string;
  title: string;
  subject: string;
  gradeLevel: string;
  lessonJson: LessonBlock[];
  standardsCodes: string[];
  estimatedDuration: number; // minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonBlock {
  id: string;
  type: 'text' | 'scripture' | 'primary_source' | 'investigation' | 'quiz' | 'hands-on' | 'photo' | 'video' | 'infographic';
  title?: string;
  content: string | Record<string, unknown>;
  interactive?: {
    // For quiz blocks
    options?: string[];
    correctIndex?: number;
    explanation?: string;
    
    // For primary source blocks
    sourceId?: string;
    narrativeRole?: 'official_claim' | 'eyewitness' | 'counter_document' | 'propagandist' | 'victim_testimony';
    investigationPrompts?: string[];
    
    // For investigation blocks
    investigationType?: 'follow-the-money' | 'compare-sources' | 'timeline' | 'network-map' | 'propaganda-analysis';
    guidingQuestions?: string[];
    whoBenefits?: string;
    
    // For scripture blocks
    reference?: string;
    translation?: string;
    wordStudies?: Record<string, { hebrew?: string; greek?: string; meaning?: string }>;
  };
  metadata?: {
    // For primary sources
    creator?: string;
    date?: string;
    collection?: string;
    url?: string;
    rights?: string;
    
    // For all blocks
    estimatedTime?: number; // minutes
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
  };
}

export interface StudentLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  blockId: string;
  completed: boolean;
  response?: Record<string, unknown>;
  timeSpent: number; // seconds
  score?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrimarySource {
  id: string;
  sourceId: string;
  title: string;
  creator?: string;
  date?: string;
  sourceType: 'document' | 'photo' | 'audio' | 'artifact';
  content: string;
  url?: string;
  collection?: string;
  rights: 'public_domain' | 'fair_use' | 'cc_by';
  embedding: number[];
  metadata: {
    era?: string;
    subjects?: string[];
    location?: string;
    context?: string;
    contentWarnings?: string[];
    readingLevel?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentEnvironment {
  id: string;
  userId: string;
  location: 'farm' | 'apartment' | 'urban' | 'rural';
  resources: string[];
  interests: string[];
  constraints: string[];
  preferences: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace?: 'quick' | 'moderate' | 'thorough';
    groupSize?: 'individual' | 'small' | 'large';
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
  updatedAt: Date;
}

export interface LessonProgressRequest {
  lessonId: string;
  blockId: string;
  completed: boolean;
  response?: Record<string, unknown>;
  timeSpent: number;
  score?: number;
}

export interface LessonProgressResponse {
  success: boolean;
  progress: StudentLessonProgress;
  lessonCompleted: boolean;
  creditsAwarded?: {
    subject: string;
    hours: number;
    standards: string[];
  }[];
}

// LangGraph integration types
export interface LessonAssemblerState {
  userId: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  lessonIntent: 'STRUCTURED_LESSON' | 'SCIENCE_EXPERIMENT';
  environment?: StudentEnvironment;
  standardsGaps?: string[];
  zpdLevel?: string;
  selectedLesson?: LessonData;
  adaptedBlocks?: LessonBlock[];
  genUIPayload?: {
    type: 'lesson';
    lesson: LessonData;
    blocks: LessonBlock[];
  };
}
