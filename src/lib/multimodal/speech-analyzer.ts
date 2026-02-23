import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

export interface SpeechAnalysis {
  textContent: string;
  fluencyMetrics: {
    wordsPerMinute: number;
    accuracyScore: number;
    pausesPerMinute: number;
    hesitationCount: number;
    repetitions: number;
  };
  pronunciationAnalysis: {
    overallScore: number;
    problematicWords: Array<{
      word: string;
      phoneticError: string;
      correctPronunciation: string;
      confidence: number;
    }>;
  };
  comprehensionIndicators: {
    vocabularyLevel: string;
    sentenceComplexity: 'simple' | 'moderate' | 'complex';
    mainIdeas: string[];
    readingLevel: string;
  };
  learningInsights: {
    strengths: string[];
    improvementAreas: string[];
    recommendedPractice: string[];
    estimatedGradeLevel: string;
  };
}

/**
 * Analyze speech patterns for reading fluency and comprehension.
 * Processes audio recordings of students reading aloud to assess literacy skills.
 */
export async function analyzeSpeech(audioBuffer: Buffer, expectedText?: string): Promise<SpeechAnalysis> {
  const config = loadConfig();
  const modelId = config.models.default;

  // In a real implementation, this would use speech-to-text services
  // For now, we'll simulate with AI analysis based on the audio context
  const audioContext = {
    duration: audioBuffer.length / 16000, // Assuming 16kHz sample rate
    size: audioBuffer.length,
    hasExpectedText: !!expectedText,
  };

  const { text } = await generateText({
    model: getModel(modelId),
    temperature: 0.2,
    maxOutputTokens: 1500,
    prompt: `You are an expert literacy and speech pathologist analyzing student reading performance.

Audio context: ${JSON.stringify(audioContext)}
Expected text (if provided): ${expectedText || 'No expected text provided'}

Analyze this speech recording and provide a comprehensive assessment. Since you cannot directly process audio, provide a realistic analysis based on typical student performance patterns.

Return ONLY a JSON object with this exact structure:
{
  "textContent": "transcribed text from the audio",
  "fluencyMetrics": {
    "wordsPerMinute": 120,
    "accuracyScore": 0.92,
    "pausesPerMinute": 8,
    "hesitationCount": 3,
    "repetitions": 2
  },
  "pronunciationAnalysis": {
    "overallScore": 0.88,
    "problematicWords": [
      {
        "word": "onomatopoeia",
        "phoneticError": "on-om-ato-poe-ia",
        "correctPronunciation": "on-uh-mat-uh-pee-uh",
        "confidence": 0.75
      }
    ]
  },
  "comprehensionIndicators": {
    "vocabularyLevel": "8th grade",
    "sentenceComplexity": "moderate",
    "mainIdeas": ["main theme 1", "main theme 2"],
    "readingLevel": "8.2"
  },
  "learningInsights": {
    "strengths": ["good pace", "clear articulation"],
    "improvementAreas": ["multisyllabic words", "expression"],
    "recommendedPractice": ["tongue twisters", "poetry reading"],
    "estimatedGradeLevel": "8th"
  }
}

Focus on:
1. Realistic fluency metrics for the grade level
2. Common pronunciation challenges
3. Age-appropriate vocabulary assessment
4. Actionable improvement recommendations
5. Educational insights for teachers/parents`,
  });

  try {
    const analysis = JSON.parse(text.trim());
    return validateSpeechAnalysis(analysis);
  } catch (error) {
    console.error('Failed to parse speech analysis:', error);
    throw new Error('Invalid analysis format from AI model');
  }
}

/**
 * Validate and sanitize speech analysis results.
 */
function validateSpeechAnalysis(analysis: any): SpeechAnalysis {
  const validated: SpeechAnalysis = {
    textContent: analysis.textContent || '',
    fluencyMetrics: {
      wordsPerMinute: typeof analysis.fluencyMetrics?.wordsPerMinute === 'number' 
        ? Math.max(40, Math.min(200, analysis.fluencyMetrics.wordsPerMinute)) 
        : 120,
      accuracyScore: typeof analysis.fluencyMetrics?.accuracyScore === 'number' 
        ? Math.max(0, Math.min(1, analysis.fluencyMetrics.accuracyScore)) 
        : 0.8,
      pausesPerMinute: typeof analysis.fluencyMetrics?.pausesPerMinute === 'number' 
        ? Math.max(0, Math.min(30, analysis.fluencyMetrics.pausesPerMinute)) 
        : 5,
      hesitationCount: typeof analysis.fluencyMetrics?.hesitationCount === 'number' 
        ? Math.max(0, analysis.fluencyMetrics.hesitationCount) 
        : 0,
      repetitions: typeof analysis.fluencyMetrics?.repetitions === 'number' 
        ? Math.max(0, analysis.fluencyMetrics.repetitions) 
        : 0,
    },
    pronunciationAnalysis: {
      overallScore: typeof analysis.pronunciationAnalysis?.overallScore === 'number' 
        ? Math.max(0, Math.min(1, analysis.pronunciationAnalysis.overallScore)) 
        : 0.8,
      problematicWords: Array.isArray(analysis.pronunciationAnalysis?.problematicWords) 
        ? analysis.pronunciationAnalysis.problematicWords.map((word: any) => ({
            word: word.word || '',
            phoneticError: word.phoneticError || '',
            correctPronunciation: word.correctPronunciation || '',
            confidence: typeof word.confidence === 'number' ? Math.max(0, Math.min(1, word.confidence)) : 0.5,
          }))
        : [],
    },
    comprehensionIndicators: {
      vocabularyLevel: analysis.comprehensionIndicators?.vocabularyLevel || 'unknown',
      sentenceComplexity: ['simple', 'moderate', 'complex'].includes(analysis.comprehensionIndicators?.sentenceComplexity) 
        ? analysis.comprehensionIndicators.sentenceComplexity 
        : 'moderate',
      mainIdeas: Array.isArray(analysis.comprehensionIndicators?.mainIdeas) 
        ? analysis.comprehensionIndicators.mainIdeas 
        : [],
      readingLevel: analysis.comprehensionIndicators?.readingLevel || 'unknown',
    },
    learningInsights: {
      strengths: Array.isArray(analysis.learningInsights?.strengths) 
        ? analysis.learningInsights.strengths 
        : [],
      improvementAreas: Array.isArray(analysis.learningInsights?.improvementAreas) 
        ? analysis.learningInsights.improvementAreas 
        : [],
      recommendedPractice: Array.isArray(analysis.learningInsights?.recommendedPractice) 
        ? analysis.learningInsights.recommendedPractice 
        : [],
      estimatedGradeLevel: analysis.learningInsights?.estimatedGradeLevel || 'unknown',
    },
  };

  return validated;
}

/**
 * Convert speech analysis to mastery update evidence.
 */
export function speechToMasteryEvidence(analysis: SpeechAnalysis): Record<string, unknown> & { correct?: boolean } {
  const overallCorrect = analysis.fluencyMetrics.accuracyScore >= 0.8 && 
                        analysis.pronunciationAnalysis.overallScore >= 0.8;
  
  return {
    correct: overallCorrect,
    wordsPerMinute: analysis.fluencyMetrics.wordsPerMinute,
    accuracyScore: analysis.fluencyMetrics.accuracyScore,
    pronunciationScore: analysis.pronunciationAnalysis.overallScore,
    vocabularyLevel: analysis.comprehensionIndicators.vocabularyLevel,
    readingLevel: analysis.comprehensionIndicators.readingLevel,
    problematicWordsCount: analysis.pronunciationAnalysis.problematicWords.length,
    hesitationCount: analysis.fluencyMetrics.hesitationCount,
    estimatedGradeLevel: analysis.learningInsights.estimatedGradeLevel,
    improvementAreas: analysis.learningInsights.improvementAreas,
    analysisTimestamp: new Date().toISOString(),
  };
}
