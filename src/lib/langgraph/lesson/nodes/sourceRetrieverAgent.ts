import { findPrimarySources, findSourcePair } from '@/lib/hippocampus/retrieve';
import { ingestPrimarySource } from '@/lib/hippocampus/ingest';
import prisma from '@/lib/db';
import type { LessonBlock, LessonStateType, RetrievedSourceSummary } from '../lessonState';

const HISTORY_SUBJECTS = [
  'history', 
  'social studies', 
  'civics', 
  'government', 
  'economics', 
  'american history', 
  'world history', 
  'oklahoma history',
  'u.s. history',
  'us history',
  'truth-based history',
  'historical',
  'social',
];
const SCIENCE_SUBJECTS = ['science', 'biology', 'chemistry', 'physics', 'earth science', 'environmental science', 'botany', 'zoology', 'ecology', 'astronomy', 'geology'];

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

function isScienceSubject(subject: string): boolean {
  const s = subject.toLowerCase();
  return SCIENCE_SUBJECTS.some(h => s.includes(h));
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
    await (prisma as any).sourceGapRequest.create({
      data: { userId, topic, subject, missingRole },
    });
    console.log(`[sourceRetriever] SourceGapRequest created — topic: "${topic}", missing: ${missingRole}`);
  } catch (err) {
    console.warn('[sourceRetriever] Could not write SourceGapRequest:', err);
  }

  // DEFINITION OF DONE - Different messages for History vs Science
  const isHistory = isHistorySubject(subject);
  const isScience = isScienceSubject(subject);
  
  let content: string;
  
  if (isHistory) {
    content = [
      `**The archives are silent on this point.**`,
      ``,
      `Adeline searched the Hippocampus library and trusted archives for a verified primary source `,
      `about "${topic}" but could not find one that meets our 85% similarity standard.`,
      ``,
      `**I will not guess at history.** Let's go to the National Archives digital collection and find the witness together.`,
    ].join('');
  } else if (isScience) {
    content = [
      `**We cannot see this happening right now.**`,
      ``,
      `Adeline searched for reproducible observations or experiments about "${topic}" using our Homestead Tools, `,
      `but this phenomenon is not directly observable with what we have available.`,
      ``,
      `**Let's design a way to measure it ourselves** rather than reading a description from someone else.`,
    ].join('');
  } else {
    // Fallback for other subjects
    content = [
      `**This lesson on "${topic}" needs a real source.**`,
      ``,
      `Adeline searched the Hippocampus library but could not find a verified source `,
      `that meets our quality standards.`,
      ``,
      `**Your parent has been notified.** Until we find a real source, we won't proceed.`,
    ].join('');
  }

  return {
    type: 'source_gap',
    content,
    metadata: {
      skills: [subject],
      zpd_level: gradeLevel,
      faith_tie: false,
      agent: 'sourceRetrieverAgent',
    },
  };
}

export async function sourceRetrieverAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const isHistory = isHistorySubject(state.subject);
  const isScience = isScienceSubject(state.subject);
  
  console.log(`[sourceRetriever] Processing: "${state.topic}" (subject: ${state.subject}, type: ${isHistory ? 'HISTORY' : isScience ? 'SCIENCE' : 'OTHER'})`);

  // DEFINITION OF DONE - Only process History and Science subjects
  if (!isHistory && !isScience) {
    console.log(`[sourceRetriever] Skipping — not History or Science: ${state.subject}`);
    return {};
  }

  const searchQuery = `${state.topic} ${state.subject}`;
  let officialSource: any = null;
  let counterSource: any = null;

  // ── Step 1: Hippocampus strict semantic search (0.85+ threshold) ──────────────────
  try {
    const pair = await findSourcePair(searchQuery, { subjectTrack: state.subject });
    officialSource = pair.officialClaim ?? null;
    counterSource = pair.counterSource ?? null;
    console.log(`[sourceRetriever] STRICT SEARCH — official: ${!!officialSource}, counter: ${!!counterSource}`);
  } catch (err) {
    console.warn('[sourceRetriever] Hippocampus lookup error:', err);
  }

  // ── Step 2: NO HALLUCINATION GUARDRAIL - Only search for REAL documents ────────
  if (isHistory) {
    // For History: Search Tavily for REAL primary sources if missing
    if (!officialSource) {
      console.log(`[sourceRetriever] HISTORY: Official source missing — searching archives for "${state.topic}"`);
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
          console.log(`[sourceRetriever] HISTORY: Real source ingested: ${found.url}`);
        } catch (err) {
          console.warn('[sourceRetriever] Failed to ingest Tavily official source:', err);
        }
      }
    }

    if (!counterSource) {
      console.log(`[sourceRetriever] HISTORY: Counter source missing — searching archives for "${state.topic}"`);
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
          console.log(`[sourceRetriever] HISTORY: Real counter source ingested: ${found.url}`);
        } catch (err) {
          console.warn('[sourceRetriever] Failed to ingest Tavily counter source:', err);
        }
      }
    }
  } else if (isScience) {
    // For Science: NO WEB SEARCHS - pivot to LAB_DESIGN if not observable
    console.log(`[sourceRetriever] SCIENCE: Checking observability of "${state.topic}"`);
    // Science subjects don't use web sources - they rely on lab observations
    // If no sources found, will emit source_gap with LAB_DESIGN message
  }

  // ── Step 3: Build lesson blocks — ONLY REAL SOURCES, NO HALLUCINATIONS ───
  const blocks: LessonBlock[] = [];

  if (isHistory) {
    // History: Use real primary sources or stop
    if (officialSource) {
      blocks.push(buildSourceBlock(officialSource, state.gradeLevel, state.subject, 'official_claim'));
    } else {
      blocks.push(await emitSourceGapBlock(state.topic, state.subject, 'official', state.gradeLevel, state.userId));
    }

    // Investigation block — only if we have at least one real source
    if (officialSource || counterSource) {
      const allSources = await findPrimarySources(searchQuery, { subjectTrack: state.subject, limit: 3 });
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

  } else if (isScience) {
    // Science: If no observable phenomena, emit LAB_DESIGN gap
    if (!officialSource && !counterSource) {
      blocks.push(await emitSourceGapBlock(state.topic, state.subject, 'observation', state.gradeLevel, state.userId));
    }
  }

  // Build source summaries — ONLY from real sources
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
      narrativeRole: counterSource.metadata.narrativeRole ?? 'eyewitness',
      creator: counterSource.metadata.creator,
      date: counterSource.metadata.date,
      url: counterSource.metadata.url,
    });
  }

  // DEFINITION OF DONE: Success determined by presence of real sources
  const success = isHistory ? !!officialSource : false; // History needs official source, Science handled differently
  
  console.log(`[sourceRetriever] DEFINITION OF DONE — success: ${success}, blocks: ${blocks.length}`);
  return { blocks, retrievedSources };
}
