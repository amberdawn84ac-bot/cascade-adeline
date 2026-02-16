import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: {
    reflectionEntry: {
      findMany: vi.fn(),
    },
    transcriptEntry: {
      findMany: vi.fn(),
    },
    highlight: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

describe('/api/highlights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when user not authenticated', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(null);

      const { GET } = await import('@/app/api/highlights/route');
      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('returns highlights from reflections and transcripts', async () => {
      vi.mocked(getSessionUser).mockResolvedValue({
        userId: 'test-user',
        role: 'STUDENT',
        email: 'test@test.com',
      });

      vi.mocked(prisma.reflectionEntry.findMany).mockResolvedValue([
        {
          id: 'ref-1',
          userId: 'test-user',
          activitySummary: 'Deep reflection on baking',
          insightScore: 0.85,
          createdAt: new Date('2026-01-15'),
        },
      ] as any);

      vi.mocked(prisma.transcriptEntry.findMany).mockResolvedValue([
        {
          id: 'trans-1',
          userId: 'test-user',
          creditsEarned: 0.5,
          mappedSubject: 'Chemistry',
          createdAt: new Date('2026-01-16'),
        },
      ] as any);

      const { GET } = await import('@/app/api/highlights/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.length).toBeGreaterThan(0);
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(getSessionUser).mockResolvedValue({
        userId: 'test-user',
        role: 'STUDENT',
        email: 'test@test.com',
      });

      vi.mocked(prisma.reflectionEntry.findMany).mockRejectedValue(new Error('DB error'));
      vi.mocked(prisma.transcriptEntry.findMany).mockRejectedValue(new Error('DB error'));

      const { GET } = await import('@/app/api/highlights/route');
      const response = await GET();

      // Should still return 200 with empty array
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('creates a manual highlight', async () => {
      vi.mocked(getSessionUser).mockResolvedValue({
        userId: 'test-user',
        role: 'STUDENT',
        email: 'test@test.com',
      });

      const { POST } = await import('@/app/api/highlights/route');
      const request = new NextRequest('http://localhost:3000/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Great learning moment!',
          userNote: 'Really proud of this',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.content).toBe('Great learning moment!');
      expect(data.type).toBe('MANUAL');
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(null);

      const { POST } = await import('@/app/api/highlights/route');
      const request = new NextRequest('http://localhost:3000/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 when content is missing', async () => {
      vi.mocked(getSessionUser).mockResolvedValue({
        userId: 'test-user',
        role: 'STUDENT',
        email: 'test@test.com',
      });

      const { POST } = await import('@/app/api/highlights/route');
      const request = new NextRequest('http://localhost:3000/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
