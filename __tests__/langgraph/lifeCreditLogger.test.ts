import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock generateText before importing the module
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@/lib/ai-models', () => ({
  getModel: vi.fn(() => 'mock-model'),
}));

vi.mock('@/lib/config', () => ({
  loadConfig: vi.fn(() => ({
    models: { default: 'gpt-4o' },
    lifeCreditRules: {
      baking: 'Chemistry: Fermentation, Math: Ratios',
      gardening: 'Biology: Botany, Chemistry: Soil Science',
      coding: 'Computer Science: Programming, Math: Logic',
      woodworking: 'Physics: Mechanics, Math: Geometry',
    },
  })),
}));

vi.mock('@/lib/spaced-repetition', () => ({
  scheduleConceptReview: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: {
    transcriptEntry: { create: vi.fn() },
    conversationMemory: { create: vi.fn() },
  },
}));

import { generateText } from 'ai';

describe('lifeCreditLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls generateText with the prompt and rules', async () => {
    const mockResponse = JSON.stringify({
      matchedRuleKey: 'baking',
      activityDescription: 'Baked sourdough bread',
      mappedSubjects: ['Chemistry: Fermentation'],
      creditAmount: 0.01,
      gradeLevel: '6-8',
      narrative: 'Great work baking bread! You earned chemistry credits.',
    });

    vi.mocked(generateText).mockResolvedValue({
      text: mockResponse,
    } as any);

    const { lifeCreditLogger } = await import('@/lib/langgraph/lifeCreditLogger');

    const state = {
      prompt: 'I baked sourdough bread today',
      intent: 'LIFE_LOG' as const,
      selectedModel: 'gpt-4o',
      userId: 'test-user',
    };

    const result = await lifeCreditLogger(state as any);

    expect(generateText).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('returns state with responseContent', async () => {
    const mockResponse = JSON.stringify({
      matchedRuleKey: 'gardening',
      activityDescription: 'Planted tomatoes',
      mappedSubjects: ['Biology: Botany'],
      creditAmount: 0.02,
      gradeLevel: '3-5',
      narrative: 'Planting tomatoes teaches biology!',
    });

    vi.mocked(generateText).mockResolvedValue({
      text: mockResponse,
    } as any);

    const { lifeCreditLogger } = await import('@/lib/langgraph/lifeCreditLogger');

    const state = {
      prompt: 'I planted tomatoes in the garden',
      intent: 'LIFE_LOG' as const,
      selectedModel: 'gpt-4o',
      userId: 'test-user',
    };

    const result = await lifeCreditLogger(state as any);

    expect(result.responseContent).toBeDefined();
    if (result.responseContent) {
      expect(result.responseContent.length).toBeGreaterThan(0);
    }
  });

  it('handles JSON parse errors gracefully', async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: 'not valid json',
    } as any);

    const { lifeCreditLogger } = await import('@/lib/langgraph/lifeCreditLogger');

    const state = {
      prompt: 'I did something unusual',
      intent: 'LIFE_LOG' as const,
      selectedModel: 'gpt-4o',
      userId: 'test-user',
    };

    // Should not throw
    const result = await lifeCreditLogger(state as any);
    expect(result).toBeDefined();
  });

  it('propagates generateText failures', async () => {
    vi.mocked(generateText).mockRejectedValue(new Error('API error'));

    const { lifeCreditLogger } = await import('@/lib/langgraph/lifeCreditLogger');

    const state = {
      prompt: 'I learned quantum physics',
      intent: 'LIFE_LOG' as const,
      selectedModel: 'gpt-4o',
      userId: 'test-user',
    };

    // lifeCreditLogger does not catch generateText errors
    await expect(lifeCreditLogger(state as any)).rejects.toThrow('API error');
  });
});
