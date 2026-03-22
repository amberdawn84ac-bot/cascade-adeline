import { Annotation } from '@langchain/langgraph';

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
    | 'infographic';
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
  };
  metadata: {
    skills: string[];
    ok_standard?: string;
    zpd_level: string;
    faith_tie?: boolean;
    agent?: string;
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
  metadata: Annotation<Record<string, unknown>>({
    reducer: (l, r) => ({ ...l, ...r }),
    default: () => ({}),
  }),
});

export type LessonStateType = typeof LessonState.State;
