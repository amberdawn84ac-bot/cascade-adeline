import { AdelineGraphState } from './types';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Zod schema for Hebrew Study data validation
const HebrewStudySchema = z.object({
  englishWord: z.string().describe("The English word being studied"),
  hebrewWord: z.string().describe("The Hebrew word in Hebrew script"),
  transliteration: z.string().describe("The Hebrew word transliterated into English letters"),
  strongsNumber: z.string().describe("The Strong's Concordance number (e.g., H530)"),
  rootMeaning: z.string().describe("Deep theological and historical meaning of the Hebrew root"),
  biblicalContext: z.string().describe("How this word is used in biblical context and its significance")
});

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

async function generateHebrewStudyContent(prompt: string): Promise<z.infer<typeof HebrewStudySchema> | null> {
  try {
    const model = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a biblical scholar and Hebrew language expert. Your task is to analyze the user's request for a Hebrew word study and provide accurate, theologically sound information.

Extract the key biblical word from the user's request and provide:
1. The English word being studied
2. The Hebrew word in proper Hebrew script
3. Accurate transliteration into English letters
4. The Strong's Concordance number
5. Deep theological and historical meaning of the Hebrew root
6. Biblical context and significance

Requirements:
- Be theologically accurate and historically informed
- Use proper Hebrew script with niqqud (vowel points) when appropriate
- Provide authentic Strong's numbers
- Explain the cultural and historical context
- Focus on the deeper spiritual meaning and application
- If the user asks about Greek words, politely redirect to Hebrew studies

Respond with a JSON object matching the schema.`;

    const userPrompt = `The user is asking about: "${prompt}"

Please provide a comprehensive Hebrew word study based on their request.`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);

    const content = response.content as string;
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response for Hebrew study');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return HebrewStudySchema.parse(parsed);
  } catch (error) {
    console.error('Error generating Hebrew study content:', error);
    return null;
  }
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
  if (isTimelineCandidate(state.responseContent) || isTimelineCandidate(state.prompt)) {
    return {
      component: 'Timeline',
      props: {
        content: state.responseContent || state.prompt,
        title: "Civil War Timeline"
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

  // If Hebrew Study is detected, generate dynamic content
  if (selection && selection.component === 'HEBREW_STUDY') {
    const hebrewContent = await generateHebrewStudyContent(state.prompt);
    if (hebrewContent) {
      selection.props = hebrewContent;
    }
  }

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

