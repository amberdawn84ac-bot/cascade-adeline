import { describe, it, expect } from 'vitest';
import { sm2, qualityToMasteryDelta } from '@/lib/spaced-repetition';

describe('sm2 algorithm', () => {
  const DEFAULT_EF = 2.5;

  it('first successful review gives interval of 1 day', () => {
    const result = sm2(4, 0, DEFAULT_EF, 0);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('second successful review gives interval of 6 days', () => {
    const result = sm2(4, 1, DEFAULT_EF, 1);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it('third successful review multiplies interval by ease factor', () => {
    const result = sm2(4, 6, DEFAULT_EF, 2);
    expect(result.interval).toBe(Math.round(6 * DEFAULT_EF));
    expect(result.repetitions).toBe(3);
  });

  it('perfect quality (5) increases ease factor', () => {
    const result = sm2(5, 6, DEFAULT_EF, 2);
    expect(result.easeFactor).toBeGreaterThan(DEFAULT_EF);
  });

  it('quality 3 (barely passing) decreases ease factor', () => {
    const result = sm2(3, 6, DEFAULT_EF, 2);
    expect(result.easeFactor).toBeLessThan(DEFAULT_EF);
  });

  it('failed recall (quality < 3) resets repetitions and interval', () => {
    const result = sm2(2, 15, 2.3, 5);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('ease factor never drops below 1.3', () => {
    let ef = DEFAULT_EF;
    // Repeatedly fail to drive EF down
    for (let i = 0; i < 20; i++) {
      const result = sm2(0, 1, ef, 0);
      ef = result.easeFactor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it('clamps quality to 0-5 range', () => {
    const high = sm2(10, 1, DEFAULT_EF, 1);
    expect(high.repetitions).toBe(2); // treated as 5

    const low = sm2(-3, 6, DEFAULT_EF, 3);
    expect(low.repetitions).toBe(0); // treated as 0, fails
  });
});

describe('qualityToMasteryDelta', () => {
  it('perfect recall gives positive delta', () => {
    expect(qualityToMasteryDelta(5)).toBe(0.15);
  });

  it('good recall gives positive delta', () => {
    expect(qualityToMasteryDelta(4)).toBe(0.10);
  });

  it('barely passing gives small positive delta', () => {
    expect(qualityToMasteryDelta(3)).toBe(0.05);
  });

  it('failed recall gives negative delta', () => {
    expect(qualityToMasteryDelta(2)).toBe(-0.02);
    expect(qualityToMasteryDelta(1)).toBe(-0.05);
    expect(qualityToMasteryDelta(0)).toBe(-0.08);
  });
});
