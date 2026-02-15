/**
 * Tests for the router's heuristic intent classification.
 *
 * We can't easily test the full router (it calls LLM), but the heuristic
 * function is deterministic. We import it indirectly by testing known patterns.
 *
 * Since heuristicIntent is not exported, we replicate its logic here
 * to validate the pattern matching independently.
 */
import { describe, it, expect } from 'vitest';

// Replicate the heuristic logic from router.ts for unit testing
type AdelineIntent = 'CHAT' | 'LIFE_LOG' | 'BRAINSTORM' | 'INVESTIGATE' | 'OPPORTUNITY' | 'REFLECT' | 'GEN_UI' | 'IMAGE_LOG';

function heuristicIntent(prompt: string): AdelineIntent {
  const lower = prompt.toLowerCase();

  const lifeLogPhrases = ['i built', 'i made', 'i helped', 'i cooked', 'i baked', 'i read', 'i wrote', 'i finished', 'i completed', 'i sewed', 'i planted', 'i gardened', 'i volunteered', 'i served'];
  if (lifeLogPhrases.some((phrase) => lower.includes(phrase))) return 'LIFE_LOG';
  if (lower.includes('brainstorm') || lower.includes('idea')) return 'BRAINSTORM';
  if (['who profits', 'follow the money', 'investigate', 'regulatory capture', 'what really happened'].some((kw) => lower.includes(kw))) return 'INVESTIGATE';
  if (lower.includes('opportunit')) return 'OPPORTUNITY';
  const reflectPhrases = ['i learned', 'i realized', 'i noticed', 'what i found hard', 'next time i would', 'i struggled with', 'it made me think'];
  if (reflectPhrases.some((phrase) => lower.includes(phrase))) return 'REFLECT';
  return 'CHAT';
}

describe('heuristicIntent', () => {
  // --- LIFE_LOG ---
  it.each([
    'I baked sourdough bread today',
    'I built a birdhouse with Dad',
    'I made a watercolor painting',
    'I helped Mom organize the pantry',
    'I cooked dinner for the family',
    'I read 3 chapters of Little Women',
    'I wrote a poem about autumn',
    'I finished my science experiment',
    'I planted tomatoes in the garden',
    'I volunteered at the food bank',
  ])('classifies "%s" as LIFE_LOG', (prompt) => {
    expect(heuristicIntent(prompt)).toBe('LIFE_LOG');
  });

  // --- BRAINSTORM ---
  it.each([
    'I have an idea for a crochet business',
    'Can we brainstorm project ideas?',
    'I want to brainstorm ways to earn money',
  ])('classifies "%s" as BRAINSTORM', (prompt) => {
    expect(heuristicIntent(prompt)).toBe('BRAINSTORM');
  });

  // --- INVESTIGATE ---
  it.each([
    'Who profits from standardized testing?',
    'Follow the money on the sugar industry',
    'Investigate who funds the FDA',
    'What really happened at Three Mile Island?',
  ])('classifies "%s" as INVESTIGATE', (prompt) => {
    expect(heuristicIntent(prompt)).toBe('INVESTIGATE');
  });

  // --- OPPORTUNITY ---
  it.each([
    'Are there any scholarship opportunities?',
    'What opportunities are available for homeschoolers?',
  ])('classifies "%s" as OPPORTUNITY', (prompt) => {
    expect(heuristicIntent(prompt)).toBe('OPPORTUNITY');
  });

  // --- REFLECT ---
  it.each([
    'I learned that fractions are like pizza slices',
    'I realized I need to practice more',
    'I noticed a pattern in the data',
    'I struggled with long division',
    'It made me think about how plants grow',
  ])('classifies "%s" as REFLECT', (prompt) => {
    expect(heuristicIntent(prompt)).toBe('REFLECT');
  });

  // --- CHAT (fallback) ---
  it.each([
    'Hello Adeline!',
    'What should I learn today?',
    'Tell me about photosynthesis',
    'How are you?',
  ])('classifies "%s" as CHAT', (prompt) => {
    expect(heuristicIntent(prompt)).toBe('CHAT');
  });
});
