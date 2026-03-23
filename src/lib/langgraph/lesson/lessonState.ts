import { Annotation } from '@langchain/langgraph';

export interface RetrievedSourceSummary {
  title: string;
  citation: string;
  narrativeRole: string;
  creator?: string;
  date?: string;
  url?: string;
}

export interface CreditAward {
  subject: string;
  hours: number;
  standards: string[];
  sourceBlocks?: string[];
}

export interface LessonBlock {
  type:
    | 'text'
    | 'scripture'
    | 'prompt'
    | 'quiz'
    | 'flashcards'
    | 'game'
    | 'worksheet'
    | 'hands-on'
    | 'photo'
    | 'video'
    | 'animation'
    | 'infographic'
    | 'primary_source'
    | 'investigation'
    | 'source_gap';
  content: string | Record<string, unknown>;
  interactive?: {
    options?: string[];
    answer?: string;
    correctIndex?: number;
    explanation?: string;
    term?: string;
    definition?: string;
    example?: string;
    category?: string;
    sourceType?: 'document' | 'photo' | 'audio' | 'artifact' | 'court_record' | 'speech' | 'newspaper';
    narrativeRole?: 'official_claim' | 'eyewitness' | 'counter_document' | 'propagandist' | 'victim_testimony' | 'government_record' | 'scripture' | 'investigative_data' | 'evidence';
    citation?: string;
    creator?: string;
    date?: string;
    collection?: string;
    url?: string;
    investigationPrompts?: string[];
    investigationType?: 'follow-the-money' | 'compare-sources' | 'timeline' | 'network-map' | 'propaganda-analysis' | 'document-analysis';
    guidingQuestions?: string[];
    whoBenefits?: string;
  };
  metadata: {
    skills: string[];
    ok_standard?: string;
    zpd_level: string;
    faith_tie?: boolean;
    agent?: string;
    hippocampusId?: string;
    sourceSlug?: string;
  };
  next_handoff?: string;
}

export const LessonState = Annotation.Root({
  userId: Annotation<string>({
    reducer: (_, r) => r,
    default: () => '',
  }),
  gradeLevel: Annotation<string>({
    reducer: (_, r) => r,
    default: () => '',
  }),
  subject: Annotation<string>({
    reducer: (_, r) => r,
    default: () => '',
  }),
  topic: Annotation<string>({
    reducer: (_, r) => r,
    default: () => '',
  }),
  description: Annotation<string>({
    reducer: (_, r) => r,
    default: () => '',
  }),
  creditId: Annotation<string | undefined>({
    reducer: (_, r) => r,
    default: () => undefined,
  }),
  interests: Annotation<string[]>({
    reducer: (_, r) => r,
    default: () => [],
  }),
  learningStyle: Annotation<string>({
    reducer: (_, r) => r,
    default: () => 'EXPEDITION',
  }),
  learningMode: Annotation<'classic' | 'expedition'>({
    reducer: (_, r) => r,
    default: () => 'classic',
  }),
  blueprint: Annotation<string[] | undefined>({
    reducer: (_, r) => r,
    default: () => undefined,
  }),
  bktSummary: Annotation<string>({
    reducer: (_, r) => r,
    default: () => '',
  }),
  blocks: Annotation<LessonBlock[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  quizScore: Annotation<number | undefined>({
    reducer: (_, r) => r,
    default: () => undefined,
  }),
  engagementSignal: Annotation<'high' | 'low' | 'neutral'>({
    reducer: (_, r) => r,
    default: () => 'neutral',
  }),
  loopCount: Annotation<number>({
    reducer: (_, r) => r,
    default: () => 0,
  }),
  masteryAchieved: Annotation<boolean>({
    reducer: (_, r) => r,
    default: () => false,
  }),
  phase: Annotation<string>({
    reducer: (_, r) => r,
    default: () => 'intro',
  }),
  standardsCodes: Annotation<string[]>({
    reducer: (_, r) => r,
    default: () => [],
  }),
  retrievedSources: Annotation<RetrievedSourceSummary[]>({
    reducer: (_, r) => r,
    default: () => [],
  }),
  creditAwards: Annotation<CreditAward[]>({
    reducer: (_, r) => r,
    default: () => [],
  }),
  metadata: Annotation<Record<string, unknown>>({
    reducer: (l, r) => ({ ...l, ...r }),
    default: () => ({}),
  }),
  _skipTo: Annotation<string | undefined>({
    reducer: (_, r) => r,
    default: () => undefined,
  }),
  genUIPayload: Annotation<Record<string, unknown> | undefined>({
    reducer: (_, r) => r,
    default: () => undefined,
  }),
});

export type LessonStateType = typeof LessonState.State;
