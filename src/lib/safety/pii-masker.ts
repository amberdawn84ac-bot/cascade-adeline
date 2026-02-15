/**
 * PII Masking Middleware
 *
 * Strips personally identifiable information from text before it's sent
 * to third-party LLM providers. Critical for COPPA/FERPA compliance
 * when serving minors.
 *
 * Detected PII types:
 * - Email addresses
 * - Phone numbers (US formats)
 * - Social Security Numbers
 * - Street addresses (partial)
 * - IP addresses
 * - Credit card numbers
 * - Full names (when explicitly provided in "my name is" patterns)
 */

export interface PIIMaskResult {
  masked: string;
  detections: PIIDetection[];
  hadPII: boolean;
}

export interface PIIDetection {
  type: string;
  original: string;
  position: number;
}

// --- Regex Patterns ---

const PII_PATTERNS: Array<{ type: string; regex: RegExp; replacement: string | ((...args: string[]) => string) }> = [
  {
    type: 'email',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL_REDACTED]',
  },
  {
    type: 'credit_card',
    regex: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
  },
  {
    type: 'ssn',
    regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
  },
  {
    type: 'phone',
    regex: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[PHONE_REDACTED]',
  },
  {
    type: 'ip_address',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
  },
  {
    type: 'street_address',
    regex: /\b\d{1,5}\s+(?:[A-Z][a-z]+\s?){1,3}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Ct|Court|Way|Pl|Place)\.?\b/gi,
    replacement: '[ADDRESS_REDACTED]',
  },
  {
    type: 'name_disclosure',
    regex: /(?:my (?:name|full name) is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
    replacement: '[NAME_REDACTED]',
  },
  {
    type: 'date_of_birth',
    regex: /(?:born on|birthday is|dob[:\s])\s*(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/gi,
    replacement: '[DOB_REDACTED]',
  },
];

/**
 * Mask PII in a text string.
 * Returns the masked text and a list of detections.
 */
export function maskPII(text: string): PIIMaskResult {
  const detections: PIIDetection[] = [];
  let masked = text;

  for (const pattern of PII_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.regex.source, pattern.regex.flags));

    for (const match of matches) {
      if (match.index !== undefined) {
        detections.push({
          type: pattern.type,
          original: match[0],
          position: match.index,
        });
      }
    }

    if (typeof pattern.replacement === 'function') {
      masked = masked.replace(pattern.regex, pattern.replacement);
    } else {
      masked = masked.replace(pattern.regex, pattern.replacement);
    }
  }

  return {
    masked,
    detections,
    hadPII: detections.length > 0,
  };
}

/**
 * Mask PII in an array of chat messages.
 * Only masks user messages (assistant/system messages are already controlled).
 */
export function maskMessagesForLLM(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  return messages.map((m) => {
    if (m.role !== 'user') return m;
    const { masked } = maskPII(m.content);
    return { ...m, content: masked };
  });
}
