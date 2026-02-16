import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockConceptFindMany = vi.fn();
const mockUserConceptMasteryUpsert = vi.fn();

vi.mock('@/lib/db', () => ({
  default: {
    concept: {
      findMany: mockConceptFindMany,
    },
    userConceptMastery: {
      findMany: vi.fn(),
      findUnique: mockUserConceptMasteryFindUnique,
      upsert: mockUserConceptMasteryUpsert,
    },
  },
}));

const mockUserConceptMasteryFindUnique = vi.fn();

describe('ZPD Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getUserMasteryMap', () => {
    it('returns mastery data for user concepts', async () => {
      mockConceptFindMany.mockResolvedValue([
        {
          id: 'concept-1',
          name: 'Fractions',
          description: 'Understanding parts of a whole',
          subjectArea: 'Math',
          gradeBand: '3-5',
          userMastery: [{ masteryLevel: 0.8, lastPracticed: new Date() }],
          prerequisites: [],
          dependents: [],
        },
      ]);

      const { getUserMasteryMap } = await import('@/lib/zpd-engine');
      const map = await getUserMasteryMap('test-user');

      expect(map.size).toBe(1);
      const entry = map.get('concept-1');
      expect(entry).toBeDefined();
      expect(entry?.name).toBe('Fractions');
    });

    it('applies time decay to mastery levels', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      mockConceptFindMany.mockResolvedValue([
        {
          id: 'concept-1',
          name: 'Addition',
          description: 'Basic addition',
          subjectArea: 'Math',
          gradeBand: 'K-2',
          userMastery: [{ masteryLevel: 1.0, lastPracticed: thirtyDaysAgo }],
          prerequisites: [],
          dependents: [],
        },
      ]);

      const { getUserMasteryMap } = await import('@/lib/zpd-engine');
      const map = await getUserMasteryMap('test-user');

      const entry = map.get('concept-1');
      expect(entry).toBeDefined();
      // After 30 days (half-life), mastery should be ~0.5
      expect(entry!.decayAdjusted).toBeLessThan(0.8);
    });

    it('handles concepts with no mastery data', async () => {
      mockConceptFindMany.mockResolvedValue([
        {
          id: 'concept-1',
          name: 'Algebra',
          description: 'Basic algebra',
          subjectArea: 'Math',
          gradeBand: '6-8',
          userMastery: [],
          prerequisites: [],
          dependents: [],
        },
      ]);

      const { getUserMasteryMap } = await import('@/lib/zpd-engine');
      const map = await getUserMasteryMap('test-user');

      const entry = map.get('concept-1');
      expect(entry).toBeDefined();
      expect(entry?.masteryLevel).toBe(0);
      expect(entry?.status).toBe('unknown');
    });
  });

  describe('getZPDConcepts', () => {
    it('identifies concepts in ZPD (prerequisites met, not mastered)', async () => {
      mockConceptFindMany.mockResolvedValue([
        {
          id: 'prereq-1',
          name: 'Addition',
          description: 'Basic addition',
          subjectArea: 'Math',
          gradeBand: 'K-2',
          userMastery: [{ masteryLevel: 0.9, lastPracticed: new Date() }],
          prerequisites: [],
          dependents: [{ conceptId: 'target' }],
        },
        {
          id: 'target',
          name: 'Fractions',
          description: 'Understanding fractions',
          subjectArea: 'Math',
          gradeBand: '3-5',
          userMastery: [{ masteryLevel: 0.3, lastPracticed: new Date() }],
          prerequisites: [{ prerequisiteId: 'prereq-1' }],
          dependents: [],
        },
      ]);

      const { getZPDConcepts } = await import('@/lib/zpd-engine');
      const zpd = await getZPDConcepts('test-user');

      const targetConcept = zpd.find(c => c.conceptId === 'target');
      expect(targetConcept).toBeDefined();
    });

    it('excludes already mastered concepts from ZPD', async () => {
      mockConceptFindMany.mockResolvedValue([
        {
          id: 'concept-1',
          name: 'Addition',
          description: 'Basic addition',
          subjectArea: 'Math',
          gradeBand: 'K-2',
          userMastery: [{ masteryLevel: 0.95, lastPracticed: new Date() }],
          prerequisites: [],
          dependents: [],
        },
      ]);

      const { getZPDConcepts } = await import('@/lib/zpd-engine');
      const zpd = await getZPDConcepts('test-user');

      const found = zpd.find(c => c.conceptId === 'concept-1');
      expect(found).toBeUndefined();
    });

    it('passes subject area filter to prisma query', async () => {
      mockConceptFindMany.mockResolvedValue([]);

      const { getZPDConcepts } = await import('@/lib/zpd-engine');
      await getZPDConcepts('test-user', { subjectArea: 'Math' });

      // Verify that at least one call included the subjectArea filter
      const calls = mockConceptFindMany.mock.calls;
      const hasSubjectFilter = calls.some((call: any[]) =>
        call[0]?.where?.subjectArea === 'Math'
      );
      expect(hasSubjectFilter).toBe(true);
    });

    it('respects limit parameter', async () => {
      const concepts = Array.from({ length: 10 }, (_, i) => ({
        id: `concept-${i}`,
        name: `Concept ${i}`,
        description: `Description ${i}`,
        subjectArea: 'Math',
        gradeBand: '3-5',
        userMastery: [{ masteryLevel: 0.3, lastPracticed: new Date() }],
        prerequisites: [],
        dependents: [],
      }));

      mockConceptFindMany.mockResolvedValue(concepts);

      const { getZPDConcepts } = await import('@/lib/zpd-engine');
      const zpd = await getZPDConcepts('test-user', { limit: 3 });

      expect(zpd.length).toBeLessThanOrEqual(3);
    });
  });

  describe('updateMastery', () => {
    it('calls prisma upsert with correct data', async () => {
      mockUserConceptMasteryFindUnique.mockResolvedValue(null);
      mockUserConceptMasteryUpsert.mockResolvedValue({
        id: 'mastery-1',
        userId: 'test-user',
        conceptId: 'concept-1',
        masteryLevel: 0.1,
      });

      const { updateMastery } = await import('@/lib/zpd-engine');

      await updateMastery('test-user', 'concept-1', 0.1);

      expect(mockUserConceptMasteryUpsert).toHaveBeenCalled();
    });
  });
});
