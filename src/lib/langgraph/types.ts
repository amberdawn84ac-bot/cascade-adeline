export type AdelineIntent =
  | 'CHAT'
  | 'LIFE_LOG'
  | 'BRAINSTORM'
  | 'INVESTIGATE'
  | 'GEN_UI'
  | 'OPPORTUNITY'
  | 'REFLECT'
  | 'IMAGE_LOG';

export interface LifeCreditMapping {
  activity: string;
  matchedRuleKey: string;
  mappedSubjects: string;
  confidence: number;
}

export interface TranscriptDraft {
  activityName: string;
  mappedSubject: string;
  creditsEarned: number;
  notes?: string;
}

export interface AdelineGraphState {
  userId?: string;
  gradeLevel?: string;
  prompt: string;
  intent?: AdelineIntent;
  selectedModel?: string;
  lifeCredit?: LifeCreditMapping;
  transcriptDraft?: TranscriptDraft;
  conversationHistory?: Array<{ role: string; content: string }>;
  studentContext?: {
    interests: string[];
    recentTranscripts: TranscriptDraft[];
    activeProjects: string[];
    detectedGaps: string[];
  };
  serviceGoal?: string;
  responseContent?: string;
  genUIPayload?: {
    component: string;
    props: Record<string, unknown>;
  };
  // Additional payload for downstream planners
  metadata?: {
    imageUrl?: string;
    reflectionMode?: string;
    gapNudge?: string;
    errors?: string[];
    lifeCreditLogger?: { matched?: boolean; mapping?: LifeCreditMapping; transcriptDraft?: TranscriptDraft };
    discernmentEngine?: { model?: string; sourcesUsed?: string | number };
    reflectionEntryId?: string;
    pendingReflection?: { reflectionEntryId?: string; dimension?: string; promptUsed?: string; activitySummary?: string };
    [key: string]: unknown;
  };
}
