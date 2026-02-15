/**
 * Content Moderation Guardrails
 *
 * Two-layer moderation for age-appropriate content:
 * 1. Fast local keyword/pattern check (zero latency)
 * 2. OpenAI Moderation API for nuanced detection (async)
 *
 * Designed for COPPA compliance — errs on the side of caution.
 */

export type ModerationSeverity = 'safe' | 'warning' | 'blocked';

export interface ModerationResult {
  severity: ModerationSeverity;
  flaggedCategories: string[];
  message?: string; // User-facing message if blocked/warned
}

// --- Local Pattern-Based Check (Layer 1) ---

const BLOCKED_PATTERNS: Array<{ category: string; patterns: RegExp[] }> = [
  {
    category: 'personal_contact',
    patterns: [
      /(?:what(?:'s| is) your|give me your|send me your)\s+(?:address|phone|number|email)/gi,
      /(?:where do you|do you) live/gi,
      /(?:meet|hang out|come over)\s+(?:up|at|to)/gi,
    ],
  },
  {
    category: 'explicit_content',
    patterns: [
      /\b(?:porn|xxx|nsfw|nude|naked)\b/gi,
    ],
  },
  {
    category: 'violence_threats',
    patterns: [
      /(?:i(?:'ll| will)|gonna|going to)\s+(?:kill|hurt|harm|shoot|stab|bomb)\b/gi,
      /\b(?:how to (?:make|build) a (?:bomb|weapon|gun))\b/gi,
    ],
  },
  {
    category: 'self_harm',
    patterns: [
      /(?:i want to|i'm going to|thinking about)\s+(?:kill(?:ing)? myself|end(?:ing)? (?:my life|it all)|hurt(?:ing)? myself)/gi,
      /\b(?:suicide|self[- ]harm)\b/gi,
    ],
  },
  {
    category: 'substance_abuse',
    patterns: [
      /\b(?:how to (?:buy|get|make|use))\s+(?:drugs|meth|cocaine|heroin|weed|marijuana)\b/gi,
    ],
  },
];

const CRISIS_RESOURCES = `If you or someone you know is struggling, please reach out:
- **988 Suicide & Crisis Lifeline:** Call or text 988
- **Crisis Text Line:** Text HOME to 741741
- **Childhelp National Child Abuse Hotline:** 1-800-422-4453

You are valued and loved. 💛`;

/**
 * Fast local moderation check using regex patterns.
 */
export function localModerate(text: string): ModerationResult {
  const flagged: string[] = [];

  for (const rule of BLOCKED_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        flagged.push(rule.category);
        break; // One match per category is enough
      }
    }
  }

  if (flagged.length === 0) {
    return { severity: 'safe', flaggedCategories: [] };
  }

  // Self-harm gets a special compassionate response
  if (flagged.includes('self_harm')) {
    return {
      severity: 'blocked',
      flaggedCategories: flagged,
      message: `I care about you deeply, and I want to make sure you're safe.\n\n${CRISIS_RESOURCES}`,
    };
  }

  // Personal contact info solicitation
  if (flagged.includes('personal_contact')) {
    return {
      severity: 'blocked',
      flaggedCategories: flagged,
      message: "For your safety, I can't help with sharing personal contact information. Let's keep our conversation focused on learning!",
    };
  }

  return {
    severity: 'blocked',
    flaggedCategories: flagged,
    message: "I'm not able to help with that topic. Let's get back to exploring and learning together!",
  };
}

// --- OpenAI Moderation API (Layer 2) ---

interface OpenAIModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
}

/**
 * Call OpenAI's Moderation API for nuanced content analysis.
 * Falls back gracefully if the API is unavailable.
 */
export async function apiModerate(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[ContentModerator] No OPENAI_API_KEY, skipping API moderation');
    return { severity: 'safe', flaggedCategories: [] };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      console.warn('[ContentModerator] Moderation API returned', response.status);
      return { severity: 'safe', flaggedCategories: [] };
    }

    const data = await response.json();
    const result = data.results?.[0] as OpenAIModerationResult | undefined;

    if (!result?.flagged) {
      return { severity: 'safe', flaggedCategories: [] };
    }

    const flaggedCategories = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([category]) => category);

    // Self-harm categories get the compassionate response
    if (flaggedCategories.some((c) => c.includes('self-harm') || c.includes('self_harm'))) {
      return {
        severity: 'blocked',
        flaggedCategories,
        message: `I care about you deeply, and I want to make sure you're safe.\n\n${CRISIS_RESOURCES}`,
      };
    }

    return {
      severity: 'warning',
      flaggedCategories,
      message: "Let's keep our conversation focused on learning and building great things!",
    };
  } catch (err) {
    console.warn('[ContentModerator] Moderation API error:', err);
    return { severity: 'safe', flaggedCategories: [] };
  }
}

/**
 * Full moderation pipeline: local check first (fast), then API check if local passes.
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  // Layer 1: Fast local check
  const localResult = localModerate(text);
  if (localResult.severity === 'blocked') {
    console.log('[ContentModerator] Blocked by local check:', localResult.flaggedCategories);
    return localResult;
  }

  // Layer 2: OpenAI Moderation API (async, more nuanced)
  const apiResult = await apiModerate(text);
  if (apiResult.severity !== 'safe') {
    console.log('[ContentModerator] Flagged by API:', apiResult.flaggedCategories);
    return apiResult;
  }

  return { severity: 'safe', flaggedCategories: [] };
}
