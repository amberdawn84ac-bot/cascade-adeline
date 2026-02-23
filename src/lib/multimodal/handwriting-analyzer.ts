import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

export interface HandwritingAnalysis {
  problemType: 'math' | 'chemistry' | 'physics' | 'geometry' | 'algebra';
  equations: string[];
  variables: string[];
  steps: Array<{
    stepNumber: number;
    description: string;
    mathematicalExpression: string;
    confidence: number;
  }>;
  correctness: {
    overallScore: number;
    stepScores: number[];
    errors: Array<{
      step: number;
      errorType: string;
      correction: string;
    }>;
  };
  masteryIndicators: {
    concepts: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    gradeLevel: string;
  };
}

/**
 * Analyze handwritten math problems using computer vision and AI.
 * This processes uploaded images of student work to extract mathematical reasoning.
 */
export async function analyzeHandwriting(imageBuffer: Buffer): Promise<HandwritingAnalysis> {
  const config = loadConfig();
  const modelId = config.models.default;

  // Convert image to base64 for analysis
  const base64Image = imageBuffer.toString('base64');
  
  const { text } = await generateText({
    model: getModel(modelId),
    temperature: 0.1, // Low temperature for consistent analysis
    maxOutputTokens: 2000,
    prompt: `You are an expert mathematics educator analyzing handwritten student work. 

Analyze this mathematical problem solution image (provided as base64 data) and provide a detailed assessment.

Image data: data:image/jpeg;base64,${base64Image}

Return ONLY a JSON object with this exact structure:
{
  "problemType": "math|chemistry|physics|geometry|algebra",
  "equations": ["extracted equation 1", "extracted equation 2"],
  "variables": ["x", "y", "t"],
  "steps": [
    {
      "stepNumber": 1,
      "description": "Student distributed the 2x term",
      "mathematicalExpression": "2x(x + 3) = 2x² + 6x",
      "confidence": 0.95
    }
  ],
  "correctness": {
    "overallScore": 0.85,
    "stepScores": [0.9, 0.8, 0.85],
    "errors": [
      {
        "step": 2,
        "errorType": "sign_error",
        "correction": "Should be -6x instead of +6x"
      }
    ]
  },
  "masteryIndicators": {
    "concepts": ["distributive_property", "polynomial_multiplication"],
    "difficulty": "intermediate",
    "gradeLevel": "9th"
  }
}

Focus on:
1. Accurate equation and variable extraction
2. Step-by-step reasoning analysis
3. Error identification and correction
4. Concept mastery assessment
5. Grade level appropriateness`,
  });

  try {
    const analysis = JSON.parse(text.trim());
    return validateHandwritingAnalysis(analysis);
  } catch (error) {
    console.error('Failed to parse handwriting analysis:', error);
    throw new Error('Invalid analysis format from AI model');
  }
}

/**
 * Validate and sanitize the handwriting analysis results.
 */
function validateHandwritingAnalysis(analysis: any): HandwritingAnalysis {
  // Ensure required fields exist and have correct types
  const validated: HandwritingAnalysis = {
    problemType: analysis.problemType || 'math',
    equations: Array.isArray(analysis.equations) ? analysis.equations : [],
    variables: Array.isArray(analysis.variables) ? analysis.variables : [],
    steps: Array.isArray(analysis.steps) ? analysis.steps.map((step: any, index: number) => ({
      stepNumber: step.stepNumber || index + 1,
      description: step.description || '',
      mathematicalExpression: step.mathematicalExpression || '',
      confidence: typeof step.confidence === 'number' ? Math.max(0, Math.min(1, step.confidence)) : 0.5,
    })) : [],
    correctness: {
      overallScore: typeof analysis.correctness?.overallScore === 'number' 
        ? Math.max(0, Math.min(1, analysis.correctness.overallScore)) 
        : 0.5,
      stepScores: Array.isArray(analysis.correctness?.stepScores) 
        ? analysis.correctness.stepScores.map((score: any) => typeof score === 'number' ? Math.max(0, Math.min(1, score)) : 0.5)
        : [],
      errors: Array.isArray(analysis.correctness?.errors) 
        ? analysis.correctness.errors.map((error: any) => ({
            step: error.step || 0,
            errorType: error.errorType || 'unknown',
            correction: error.correction || '',
          }))
        : [],
    },
    masteryIndicators: {
      concepts: Array.isArray(analysis.masteryIndicators?.concepts) ? analysis.masteryIndicators.concepts : [],
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(analysis.masteryIndicators?.difficulty) 
        ? analysis.masteryIndicators.difficulty 
        : 'intermediate',
      gradeLevel: analysis.masteryIndicators?.gradeLevel || 'unknown',
    },
  };

  return validated;
}

/**
 * Convert handwriting analysis to mastery update evidence.
 */
export function handwritingToMasteryEvidence(analysis: HandwritingAnalysis): Record<string, unknown> & { correct?: boolean } {
  const overallCorrect = analysis.correctness.overallScore >= 0.7;
  
  return {
    correct: overallCorrect,
    problemType: analysis.problemType,
    conceptsDemonstrated: analysis.masteryIndicators.concepts,
    stepCount: analysis.steps.length,
    errorCount: analysis.correctness.errors.length,
    confidence: analysis.correctness.overallScore,
    difficulty: analysis.masteryIndicators.difficulty,
    gradeLevel: analysis.masteryIndicators.gradeLevel,
    specificErrors: analysis.correctness.errors.map(e => e.errorType),
    analysisTimestamp: new Date().toISOString(),
  };
}
