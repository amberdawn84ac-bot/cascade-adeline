import { AdelineGraphState } from './types';

function isTimelineCandidate(text: string | undefined): boolean {
  if (!text) return false;
  const yearPattern = /(19|20)\d{2}/;
  return text.toLowerCase().includes('timeline') || yearPattern.test(text);
}

function pickComponent(state: AdelineGraphState): { component: string; props: Record<string, unknown> } | null {
  // Priority 1: Transcript card when we already drafted credits
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
    const sourcesUsed = (state.metadata as any)?.discernmentEngine?.sourcesUsed;
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
