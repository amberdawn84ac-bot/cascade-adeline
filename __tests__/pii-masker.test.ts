import { describe, it, expect } from 'vitest';
import { maskPII, maskMessagesForLLM } from '@/lib/safety/pii-masker';

describe('maskPII', () => {
  it('masks email addresses', () => {
    const result = maskPII('Contact me at john@example.com please');
    expect(result.masked).toBe('Contact me at [EMAIL_REDACTED] please');
    expect(result.hadPII).toBe(true);
    expect(result.detections[0].type).toBe('email');
  });

  it('masks phone numbers', () => {
    const result = maskPII('Call me at (555) 123-4567');
    expect(result.masked).toContain('[PHONE_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('masks SSNs', () => {
    const result = maskPII('My SSN is 123-45-6789');
    expect(result.masked).toContain('[SSN_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('masks credit card numbers (space-separated)', () => {
    const result = maskPII('Card: 4111 1111 1111 1111');
    expect(result.masked).toContain('[CARD_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('masks IP addresses', () => {
    const result = maskPII('Server at 192.168.1.100');
    expect(result.masked).toContain('[IP_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('masks street addresses', () => {
    const result = maskPII('I live at 123 Main Street');
    expect(result.masked).toContain('[ADDRESS_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('masks name disclosures', () => {
    const result = maskPII('My name is John Smith');
    expect(result.masked).toContain('[NAME_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('masks date of birth', () => {
    const result = maskPII('I was born on 01/15/2010');
    expect(result.masked).toContain('[DOB_REDACTED]');
    expect(result.hadPII).toBe(true);
  });

  it('returns clean text unchanged', () => {
    const clean = 'I baked bread today and learned about chemistry';
    const result = maskPII(clean);
    expect(result.masked).toBe(clean);
    expect(result.hadPII).toBe(false);
    expect(result.detections).toHaveLength(0);
  });

  it('masks multiple PII types in one string', () => {
    const result = maskPII('My name is Jane Doe, email jane@test.com, phone 555-123-4567');
    expect(result.masked).toContain('[NAME_REDACTED]');
    expect(result.masked).toContain('[EMAIL_REDACTED]');
    expect(result.masked).toContain('[PHONE_REDACTED]');
    expect(result.detections.length).toBeGreaterThanOrEqual(3);
  });
});

describe('maskMessagesForLLM', () => {
  it('only masks user messages', () => {
    const messages = [
      { role: 'system', content: 'You are Adeline' },
      { role: 'user', content: 'My email is test@example.com' },
      { role: 'assistant', content: 'Hello!' },
    ];
    const masked = maskMessagesForLLM(messages);
    expect(masked[0].content).toBe('You are Adeline');
    expect(masked[1].content).toContain('[EMAIL_REDACTED]');
    expect(masked[2].content).toBe('Hello!');
  });
});
