export interface ScaffoldingContext {
  userId?: string;
  subject?: string;
  recentAttempts?: number;
  bookTitle?: string;
}

export interface RefusalDecision {
  refuse: boolean;
  reason: string;
  socraticPrompt: string;
}

const ESSAY_WRITING_PATTERNS = [
  /write (me )?(an?|my|a complete|a full) (essay|report|paper|paragraph|summary|abstract)/i,
  /can you write/i,
  /write (this|the) (essay|report|paper|abstract|conclusion|introduction)/i,
  /finish (this|my) (essay|report|paper|paragraph)/i,
  /complete (this|my) (essay|paper|paragraph|assignment)/i,
  /do (this|my) (homework|assignment|essay|project)/i,
];

const ANSWER_SEEKING_PATTERNS = [
  /^what('s| is) the answer\??$/i,
  /just tell me the answer/i,
  /give me the answer/i,
  /what is the correct answer/i,
  /solve this for me/i,
  /do this for me/i,
];

const COMPETITION_SUBMISSION_KEYWORDS = [
  'isef abstract',
  'sts submission',
  'regeneron abstract',
  'competition abstract',
  'science fair report',
  'jshs paper',
  'competition essay',
  'submit to',
  'competition application',
];

const SOCRATIC_PROMPTS_BY_CONTEXT: Record<string, string[]> = {
  essay: [
    "I won't write it for you — but let's build it together. What's your main argument or the central idea you want to get across?",
    "Writing is thinking made visible. What do you already know about this topic? Start with that.",
    "Let's outline it first. What are the three most important points you want to make?",
  ],
  math: [
    "Before I show you how, tell me: what have you tried so far? Where did you get stuck?",
    "Let's think through it step by step. What information does the problem give you?",
    "What formula or concept do you think applies here? Even a wrong guess helps us find the right path.",
  ],
  competition: [
    "Competition rules are clear that the work must be yours — and that's actually great news! Your own thinking is more valuable than anything I could write. What's the core finding of your research?",
    "I can be your thought partner, not your ghostwriter. Walk me through your research. What did you discover?",
    "Let's make sure your abstract sounds like YOU. Tell me your results in your own words first.",
  ],
  general: [
    "I'm not going to hand you the answer — but I'm going to help you find it. What do you think might be true here?",
    "The best learning happens when you struggle a little. What's your instinct on this?",
    "Let's think out loud together. What do you already know that might help?",
  ],
};

function getRandomPrompt(prompts: string[]): string {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export function shouldRefuse(prompt: string, context: ScaffoldingContext = {}): RefusalDecision {
  const lower = prompt.toLowerCase().trim();

  for (const pattern of ESSAY_WRITING_PATTERNS) {
    if (pattern.test(prompt)) {
      const isCompetition = COMPETITION_SUBMISSION_KEYWORDS.some(kw => lower.includes(kw));
      return {
        refuse: true,
        reason: isCompetition
          ? 'Competition submission — academic integrity requires student-authored work'
          : 'Essay/report writing request — scaffolding refusal to prevent cognitive offloading',
        socraticPrompt: getRandomPrompt(
          isCompetition ? SOCRATIC_PROMPTS_BY_CONTEXT.competition : SOCRATIC_PROMPTS_BY_CONTEXT.essay
        ),
      };
    }
  }

  for (const pattern of ANSWER_SEEKING_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        refuse: true,
        reason: 'Direct answer request without attempted reasoning',
        socraticPrompt: getRandomPrompt(
          context.subject === 'math' ? SOCRATIC_PROMPTS_BY_CONTEXT.math : SOCRATIC_PROMPTS_BY_CONTEXT.general
        ),
      };
    }
  }

  if (COMPETITION_SUBMISSION_KEYWORDS.some(kw => lower.includes(kw))) {
    if (/write|draft|create|generate|make|compose/i.test(prompt)) {
      return {
        refuse: true,
        reason: 'Competition submission content — academic integrity guardrail',
        socraticPrompt: getRandomPrompt(SOCRATIC_PROMPTS_BY_CONTEXT.competition),
      };
    }
  }

  if (context.recentAttempts !== undefined && context.recentAttempts >= 3) {
    if (/help|explain|tell|show|what|how/i.test(prompt) && prompt.length < 60) {
      return {
        refuse: false,
        reason: 'Multiple attempts detected — adding productive friction',
        socraticPrompt: `You've asked about this a few times. Before I help further — tell me what you've tried so far and what result you got. That context will help me give you the most useful nudge.`,
      };
    }
  }

  return { refuse: false, reason: '', socraticPrompt: '' };
}
