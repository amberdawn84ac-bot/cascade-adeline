import { AdelineGraphState } from './types';
import { z } from 'zod';

function isTimelineCandidate(text: string | undefined): boolean {
  if (!text) return false;
  const yearPattern = /(19|20)\d{2}/;
  return text.toLowerCase().includes('timeline') || yearPattern.test(text);
}

function isHebrewStudyCandidate(text: string | undefined): boolean {
  if (!text) return false;
  const hebrewKeywords = [
    'hebrew', 'biblical', 'bible', 'scripture', 'old testament',
    'strong\'s', 'strongs', 'greek', 'hebrew word', 'biblical word',
    'etymology', 'root meaning', 'original language', 'ancient hebrew'
  ];
  return hebrewKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

function pickComponent(state: AdelineGraphState): { component: string; props: Record<string, unknown> } | null {
  // Priority 1: Hebrew Study detection
  if (isHebrewStudyCandidate(state.prompt)) {
    return {
      component: 'HEBREW_STUDY',
      props: {
        englishWord: "faith", // This would be dynamically extracted
        hebrewWord: "אֱמוּנָה", // This would be dynamically generated
        transliteration: "emunah", // This would be dynamically generated
        strongsNumber: "H530", // This would be dynamically looked up
        rootMeaning: "Steadfastness, firmness, fidelity, trustworthiness", // This would be dynamically generated
        biblicalContext: "Often used to describe a deep, abiding trust in God that manifests as unwavering loyalty and obedience." // This would be dynamically generated
      },
    };
  }

  // Priority 2: Transcript card when we already drafted credits
  if (state.transcriptDraft) {
    return {
      component: 'TranscriptCard',
      props: {
        transcript: state.transcriptDraft,
        intent: state.intent,
      },
    };
  }

  // Priority 2: Investigation view when we ran discernment
  if (state.intent === 'INVESTIGATE' || state.metadata?.discernmentEngine) {
    const sourcesUsed = state.metadata?.discernmentEngine?.sourcesUsed;
    return {
      component: 'InvestigationBoard',
      props: {
        summary: state.responseContent,
        sources: sourcesUsed,
      },
    };
  }

  // Priority 3: Project brainstorming impact card
  if (state.intent === 'BRAINSTORM') {
    return {
      component: 'ProjectImpactCard',
      props: {
        suggestion: state.responseContent,
      },
    };
  }

  // Priority 4: Opportunities
  if (state.intent === 'OPPORTUNITY') {
    return {
      component: 'MissionBriefing',
      props: {
        content: state.responseContent,
      },
    };
  }

  // Priority 5: Timeline detection
  if (isTimelineCandidate(state.responseContent)) {
    return {
      component: 'Timeline',
      props: {
        content: state.responseContent,
      },
    };
  }

  // Priority 6: Concept mapping if gaps detected
  if (state.studentContext?.detectedGaps?.length) {
    return {
      component: 'ConceptMap',
      props: {
        gaps: state.studentContext.detectedGaps,
      },
    };
  }

  return null;
}

export async function genUIPlanner(state: AdelineGraphState): Promise<AdelineGraphState> {
  const selection = pickComponent(state);

  if (!selection) {
    return {
      ...state,
      genUIPayload: undefined,
      metadata: {
        ...state.metadata,
        genUIPlanner: { selected: null },
      },
    };
  }

  return {
    ...state,
    genUIPayload: selection,
    metadata: {
      ...state.metadata,
      genUIPlanner: {
        selected: selection.component,
      },
    },
  };
}
