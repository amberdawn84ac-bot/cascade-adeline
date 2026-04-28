export const TIER_LIMITS = {
  FREE: {
    messages: Infinity,
    students: 1,
    canCreateClubs: true,
    hasParentDashboard: false,
    hasTranscripts: false,
    hasLearningPath: false,
    hasJournal: false,
  },
  STUDENT: {
    messages: Infinity,
    students: 1,
    canCreateClubs: true,
    hasParentDashboard: false,
    hasTranscripts: false,
    hasLearningPath: true,
    hasJournal: true,
  },
  PARENT: {
    messages: Infinity,
    students: 5,
    canCreateClubs: true,
    hasParentDashboard: true,
    hasTranscripts: true,
    hasLearningPath: true,
    hasJournal: true,
  },
  TEACHER: {
    messages: Infinity,
    students: 40,
    canCreateClubs: true,
    hasParentDashboard: true,
    hasTranscripts: true,
    hasLearningPath: true,
    hasJournal: true,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;
