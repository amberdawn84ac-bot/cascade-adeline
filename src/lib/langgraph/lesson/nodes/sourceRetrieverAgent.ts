import { findPrimarySources, findSourcePair } from '@/lib/hippocampus/retrieve';
import { ingestPrimarySource } from '@/lib/hippocampus/ingest';
import prisma from '@/lib/db';
import type { LessonBlock, LessonStateType, RetrievedSourceSummary } from '../lessonState';

const HISTORY_SUBJECTS = ['history', 'social studies', 'civics', 'government', 'economics', 'american history', 'world history', 'oklahoma history', 'world history'];

/** Trusted primary-source archives — results from these domains are authoritative. */
const TRUSTED_DOMAINS = [
  'loc.gov',
  'archives.gov',
  'avalon.law.yale.edu',
  'teachingamericanhistory.org',
  'gutenberg.org',
  'historymatters.gmu.edu',
  'yale.edu',
  'fordham.edu',
  'digitalhistory.uh.edu',
  'pbs.org',
  'smithsonianmag.com',
  'nps.gov',
  'ourdocuments.gov',
  'constitution.org',
];

function isHistorySubject(subject: string): boolean {
  const s = subject.toLowerCase();
  return HISTORY_SUBJECTS.some(h => s.includes(h));
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Strip HTML tags and collapse whitespace from fetched document content. */
function cleanHtml(raw: string): string {
  return raw
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 8000); // cap at 8 000 chars — enough for a lesson excerpt
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;         // snippet / summary
  raw_content?: string;    // full page text (when requested)
  score: number;
}

interface TavilySearchResponse {
  results: TavilyResult[];
}

/**
 * Search Tavily for a real primary source document.
 * Restricts results to trusted archival domains.
 * Returns the best result or null.
 */
async function searchTavilyForSource(
  topic: string,
  role: 'official' | 'counter'
): Promise<{ title: string; content: string; url: string; citation: string } | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[sourceRetriever] TAVILY_API_KEY not set — skipping web search');
    return null;
  }

  const domainFilter = TRUSTED_DOMAINS.join(' OR site:');
  const roleHint = role === 'official'
    ? 'government document legislation official policy'
    : 'eyewitness account testimony letter diary court record';

  const query = `"${topic}" primary source full text ${roleHint} site:${domainFilter}`;

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_raw_content: true,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      console.warn(`[sourceRetriever] Tavily search failed: ${res.status}`);
      return null;
    }

    const data: TavilySearchResponse = await res.json();
    const results = data.results ?? [];

    // Prefer results from explicitly trusted domains
    const trusted = results.filter(r =>
      TRUSTED_DOMAINS.some(d => r.url.includes(d))
    );
    const candidate = trusted[0] ?? results[0];
    if (!candidate) return null;

    // Use raw_content if available and substantive, otherwise fall back to snippet
    const rawText = candidate.raw_content ? cleanHtml(candidate.raw_content) : '';
    const content = rawText.length > 300 ? rawText : candidate.content;

    // Reject if the content is too short to be a real document
    if (content.length < 150) return null;

    return {
      title: candidate.title,
      content,
      url: candidate.url,
      citation: `${candidate.title}. Retrieved from ${candidate.url}`,
    };
  } catch (err) {
    console.warn('[sourceRetriever] Tavily request error:', err);
    return null;
  }
}

/** Build a primary_source LessonBlock from a retrieved/ingested document. */
function buildSourceBlock(
  source: { id: string; content: string; metadata: Record<string, any> },
  gradeLevel: string,
  subject: string,
  narrativeRole: string
): LessonBlock {
  return {
    type: 'primary_source',
    content: source.content,
    interactive: {
      narrativeRole: narrativeRole as any,
      sourceType: 'document',
      citation: source.metadata.citation,
      creator: source.metadata.creator,
      date: source.metadata.date,
      collection: source.metadata.collection,
      url: source.metadata.url,
      investigationPrompts: source.metadata.investigationPrompts,
    },
    metadata: {
      skills: [subject, 'source-analysis'],
      zpd_level: gradeLevel,
      faith_tie: false,
      agent: 'sourceRetrieverAgent',
      hippocampusId: source.id,
      sourceSlug: source.metadata.sourceSlug,
    },
  };
}

/** Emit a source_gap block when no real source is available, and log a SourceGapRequest for the parent. */
async function emitSourceGapBlock(
  topic: string,
  subject: string,
  missingRole: string,
  gradeLevel: string,
  userId: string
): Promise<LessonBlock> {
  // Persist for parent notification (non-fatal if DB write fails)
  try {
    await prisma.sourceGapRequest.create({
      data: { userId, topic, subject, missingRole },
    });
    console.log(`[sourceRetriever] SourceGapRequest created — topic: "${topic}", missing: ${missingRole}`);
  } catch (err) {
    console.warn('[sourceRetriever] Could not write SourceGapRequest:', err);
  }

  return {
    type: 'source_gap',
    content: [
      `**This lesson on "${topic}" is incomplete.**`,
      ``,
      `Adeline searched the Hippocampus library and the web for a verified primary source `,
      `(${missingRole === 'official' ? 'official document / government record' : 'eyewitness account / counter-document'}) `,
      `but could not find one that meets the standard for real historical evidence.`,
      ``,
      `**Your parent has been notified.** Once they add a source to the Hippocampus, `,
      `this lesson will be able to show you the real document. Until then, Adeline won't guess.`,
    ].join(''),
    metadata: {
      skills: [subject],
      zpd_level: gradeLevel,
      faith_tie: false,
      agent: 'sourceRetrieverAgent',
    },
  };
}

export async function sourceRetrieverAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  if (!isHistorySubject(state.subject)) {
    console.log(`[sourceRetriever] Skipping — not a history/civics subject: ${state.subject}`);
    return {};
  }

  const searchQuery = `${state.topic} ${state.subject}`;
  let officialSource: any = null;
  let counterSource: any = null;

  // ── Step 1: Hippocampus semantic search ────────────────────────────────────
  try {
    const pair = await findSourcePair(searchQuery, {});
    officialSource = pair.officialClaim ?? null;
    counterSource = pair.counterSource ?? null;
    console.log(`[sourceRetriever] Hippocampus — official: ${!!officialSource}, counter: ${!!counterSource}`);
  } catch (err) {
    console.warn('[sourceRetriever] Hippocampus lookup error:', err);
  }

  // ── Step 2: For any missing role, search Tavily for a REAL document ────────
  if (!officialSource) {
    console.log(`[sourceRetriever] Official source missing — searching Tavily for "${state.topic}"`);
    const found = await searchTavilyForSource(state.topic, 'official');
    if (found) {
      try {
        const slug = `web-${slugify(state.topic)}-official-${Date.now()}`;
        const id = await ingestPrimarySource({
          title: found.title,
          content: found.content,
          metadata: {
            sourceSlug: slug,
            creator: 'Unknown',
            date: 'Unknown',
            rights: 'public_domain',
            topics: [state.topic, state.subject],
            era: 'various',
            subjectTracks: [state.subject],
            investigationTypes: ['propaganda-analysis' as const],
            narrativeRole: 'official_claim' as const,
            scriptureConnections: [],
            contentWarnings: [],
            investigationPrompts: [
              'Who wrote this document and why?',
              'What does this document claim? What does it not say?',
              'Who benefits from this being the official record?',
            ],
            citation: found.citation,
            url: found.url,
          },
        });
        officialSource = {
          id,
          content: found.content,
          metadata: {
            sourceSlug: slug,
            citation: found.citation,
            url: found.url,
            investigationPrompts: [
              'Who wrote this document and why?',
              'What does this document claim? What does it not say?',
              'Who benefits from this being the official record?',
            ],
          },
        };
        console.log(`[sourceRetriever] Tavily official source ingested: ${found.url}`);
      } catch (err) {
        console.warn('[sourceRetriever] Failed to ingest Tavily official source:', err);
      }
    }
  }

  if (!counterSource) {
    console.log(`[sourceRetriever] Counter source missing — searching Tavily for "${state.topic}"`);
    const found = await searchTavilyForSource(state.topic, 'counter');
    if (found) {
      try {
        const slug = `web-${slugify(state.topic)}-counter-${Date.now()}`;
        const id = await ingestPrimarySource({
          title: found.title,
          content: found.content,
          metadata: {
            sourceSlug: slug,
            creator: 'Unknown',
            date: 'Unknown',
            rights: 'public_domain',
            topics: [state.topic, state.subject],
            era: 'various',
            subjectTracks: [state.subject],
            investigationTypes: ['compare-sources' as const],
            narrativeRole: 'eyewitness' as const,
            scriptureConnections: [],
            contentWarnings: [],
            investigationPrompts: [
              'Who wrote this, and what did they witness firsthand?',
              'How does this account differ from the official story?',
              'What would be lost from history if this document had not survived?',
            ],
            citation: found.citation,
            url: found.url,
          },
        });
        counterSource = {
          id,
          content: found.content,
          metadata: {
            sourceSlug: slug,
            narrativeRole: 'eyewitness',
            citation: found.citation,
            url: found.url,
            investigationPrompts: [
              'Who wrote this, and what did they witness firsthand?',
              'How does this account differ from the official story?',
              'What would be lost from history if this document had not survived?',
            ],
          },
        };
        console.log(`[sourceRetriever] Tavily counter source ingested: ${found.url}`);
      } catch (err) {
        console.warn('[sourceRetriever] Failed to ingest Tavily counter source:', err);
      }
    }
  }

  // ── Step 3: Build lesson blocks — only real sources, no invented content ───
  const blocks: LessonBlock[] = [];

  if (officialSource) {
    blocks.push(buildSourceBlock(officialSource, state.gradeLevel, state.subject, 'official_claim'));
  } else {
    blocks.push(await emitSourceGapBlock(state.topic, state.subject, 'official', state.gradeLevel, state.userId));
  }

  // Investigation block — always present when at least one real source exists
  if (officialSource || counterSource) {
    const allSources = await findPrimarySources(searchQuery, { limit: 3 });
    const invSuggestion = allSources.find(s => s.metadata.investigationTypes?.length > 0);
    const primaryInvType = invSuggestion?.metadata.investigationTypes?.[0] ?? 'propaganda-analysis';

    blocks.push({
      type: 'investigation',
      content: officialSource && counterSource
        ? `Examine both documents above. The first represents the official narrative. The second offers a different perspective.`
        : `Examine the document above carefully.`,
      interactive: {
        investigationType: primaryInvType,
        guidingQuestions: [
          'Who authored this document, and what was their position of power?',
          'What does this source claim? What does it leave out?',
          'Who benefited from this version of events becoming the accepted history?',
          'If this were the only document you had, what would you believe?',
        ],
        whoBenefits: 'Consider who had the most to gain from this story being widely accepted.',
      },
      metadata: {
        skills: [state.subject, 'critical-thinking', 'source-analysis'],
        zpd_level: state.gradeLevel,
        faith_tie: false,
        agent: 'sourceRetrieverAgent',
      },
    });
  }

  if (counterSource) {
    blocks.push(buildSourceBlock(counterSource, state.gradeLevel, state.subject, counterSource.metadata.narrativeRole ?? 'eyewitness'));
  } else {
    blocks.push(await emitSourceGapBlock(state.topic, state.subject, 'counter', state.gradeLevel, state.userId));
  }

  // Build lightweight source summaries for contentAgent to reference in narrative
  const retrievedSources: RetrievedSourceSummary[] = [];
  if (officialSource) {
    retrievedSources.push({
      title: officialSource.metadata?.title ?? state.topic,
      citation: officialSource.metadata?.citation ?? '',
      narrativeRole: 'official_claim',
      creator: officialSource.metadata?.creator,
      date: officialSource.metadata?.date,
      url: officialSource.metadata?.url,
    });
  }
  if (counterSource) {
    retrievedSources.push({
      title: counterSource.metadata?.title ?? state.topic,
      citation: counterSource.metadata?.citation ?? '',
      narrativeRole: counterSource.metadata?.narrativeRole ?? 'eyewitness',
      creator: counterSource.metadata?.creator,
      date: counterSource.metadata?.date,
      url: counterSource.metadata?.url,
    });
  }

  console.log(`[sourceRetriever] ${blocks.length} blocks for "${state.topic}" (official: ${!!officialSource}, counter: ${!!counterSource})`);
  return { blocks, retrievedSources };
}
