import { HandwritingAnalysis } from './handwriting-analyzer';
import { SpeechAnalysis } from './speech-analyzer';

export interface MultimodalAssessment {
  overallScore: number;
  confidenceLevel: number;
  dominantLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
  strengths: {
    cognitive: string[];
    creative: string[];
    analytical: string[];
  };
  growthAreas: {
    conceptual: string[];
    procedural: string[];
    metacognitive: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  learningVelocity: {
    current: number;
    potential: number;
    factors: string[];
  };
}

/**
 * Combine multiple modalities of learning assessment into a unified score.
 * This integrates handwriting, speech, and other learning evidence.
 */
export function calculateMultimodalScore(
  handwritingAnalysis?: HandwritingAnalysis,
  speechAnalysis?: SpeechAnalysis,
  additionalScores?: Array<{ type: string; score: number; weight: number }>
): MultimodalAssessment {
  const scores: Array<{ type: string; score: number; weight: number }> = [];

  // Add handwriting analysis
  if (handwritingAnalysis) {
    scores.push({
      type: 'mathematical_reasoning',
      score: handwritingAnalysis.correctness.overallScore,
      weight: 0.3,
    });
  }

  // Add speech analysis
  if (speechAnalysis) {
    const speechScore = (speechAnalysis.fluencyMetrics.accuracyScore + 
                        speechAnalysis.pronunciationAnalysis.overallScore) / 2;
    scores.push({
      type: 'literacy_fluency',
      score: speechScore,
      weight: 0.3,
    });
  }

  // Add any additional scores
  if (additionalScores) {
    scores.push(...additionalScores);
  }

  // Calculate weighted overall score
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const overallScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;

  // Determine learning style based on performance patterns
  const dominantLearningStyle = determineLearningStyle(scores, handwritingAnalysis, speechAnalysis);

  // Extract strengths and growth areas
  const strengths = extractStrengths(handwritingAnalysis, speechAnalysis, scores);
  const growthAreas = extractGrowthAreas(handwritingAnalysis, speechAnalysis, scores);

  // Generate personalized recommendations
  const recommendations = generateRecommendations(overallScore, dominantLearningStyle, strengths, growthAreas);

  // Calculate learning velocity
  const learningVelocity = calculateLearningVelocity(scores, overallScore);

  return {
    overallScore,
    confidenceLevel: calculateConfidenceLevel(scores.length, overallScore),
    dominantLearningStyle,
    strengths,
    growthAreas,
    recommendations,
    learningVelocity,
  };
}

/**
 * Determine the student's dominant learning style based on performance patterns.
 */
function determineLearningStyle(
  scores: Array<{ type: string; score: number; weight: number }>,
  handwriting?: HandwritingAnalysis,
  speech?: SpeechAnalysis
): 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing' {
  const styleScores = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
    reading_writing: 0,
  };

  // Analyze handwriting (visual/kinesthetic)
  if (handwriting) {
    styleScores.visual += handwriting.correctness.overallScore * 0.6;
    styleScores.kinesthetic += handwriting.correctness.overallScore * 0.4;
  }

  // Analyze speech (auditory)
  if (speech) {
    styleScores.auditory += (speech.fluencyMetrics.accuracyScore + 
                           speech.pronunciationAnalysis.overallScore) / 2;
  }

  // Analyze other scores for patterns
  scores.forEach(score => {
    switch (score.type) {
      case 'mathematical_reasoning':
        styleScores.visual += score.score * 0.3;
        styleScores.kinesthetic += score.score * 0.2;
        break;
      case 'literacy_fluency':
        styleScores.reading_writing += score.score * 0.4;
        styleScores.auditory += score.score * 0.3;
        break;
      case 'creative_expression':
        styleScores.kinesthetic += score.score * 0.4;
        styleScores.visual += score.score * 0.3;
        break;
      default:
        styleScores.reading_writing += score.score * 0.25;
    }
  });

  // Find dominant style
  const maxScore = Math.max(...Object.values(styleScores));
  const dominantStyle = Object.entries(styleScores).find(([_, score]) => score === maxScore)?.[0];
  
  return (dominantStyle?.replace('_', '/') as any) || 'reading/writing';
}

/**
 * Extract student strengths from multimodal analysis.
 */
function extractStrengths(
  handwriting?: HandwritingAnalysis,
  speech?: SpeechAnalysis,
  scores?: Array<{ type: string; score: number; weight: number }>
) {
  const strengths = {
    cognitive: [] as string[],
    creative: [] as string[],
    analytical: [] as string[],
  };

  // Analyze handwriting strengths
  if (handwriting && handwriting.correctness.overallScore >= 0.8) {
    strengths.analytical.push('Mathematical problem-solving');
    strengths.cognitive.push('Step-by-step reasoning');
    
    if (handwriting.masteryIndicators.difficulty === 'advanced') {
      strengths.analytical.push('Complex mathematical concepts');
    }
  }

  // Analyze speech strengths
  if (speech && speech.fluencyMetrics.accuracyScore >= 0.8) {
    strengths.creative.push('Oral expression');
    strengths.cognitive.push('Reading comprehension');
    
    if (speech.fluencyMetrics.wordsPerMinute >= 140) {
      strengths.creative.push('Rapid processing');
    }
  }

  // Analyze score patterns
  scores?.forEach(score => {
    if (score.score >= 0.8) {
      switch (score.type) {
        case 'mathematical_reasoning':
          strengths.analytical.push('Logical reasoning');
          break;
        case 'literacy_fluency':
          strengths.cognitive.push('Language processing');
          break;
        case 'creative_expression':
          strengths.creative.push('Creative thinking');
          break;
      }
    }
  });

  return strengths;
}

/**
 * Identify growth areas from multimodal analysis.
 */
function extractGrowthAreas(
  handwriting?: HandwritingAnalysis,
  speech?: SpeechAnalysis,
  scores?: Array<{ type: string; score: number; weight: number }>
) {
  const growthAreas = {
    conceptual: [] as string[],
    procedural: [] as string[],
    metacognitive: [] as string[],
  };

  // Analyze handwriting growth areas
  if (handwriting && handwriting.correctness.overallScore < 0.7) {
    growthAreas.procedural.push('Mathematical procedures');
    handwriting.correctness.errors.forEach(error => {
      if (error.errorType.includes('concept')) {
        growthAreas.conceptual.push(error.errorType);
      } else {
        growthAreas.procedural.push(error.errorType);
      }
    });
  }

  // Analyze speech growth areas
  if (speech && speech.fluencyMetrics.accuracyScore < 0.7) {
    growthAreas.procedural.push('Reading fluency');
    if (speech.pronunciationAnalysis.problematicWords.length > 3) {
      growthAreas.procedural.push('Pronunciation accuracy');
    }
  }

  // Analyze score patterns for growth areas
  scores?.forEach(score => {
    if (score.score < 0.7) {
      switch (score.type) {
        case 'mathematical_reasoning':
          growthAreas.conceptual.push('Mathematical foundations');
          break;
        case 'literacy_fluency':
          growthAreas.procedural.push('Reading mechanics');
          break;
        default:
          growthAreas.metacognitive.push('Learning strategies');
      }
    }
  });

  return growthAreas;
}

/**
 * Generate personalized learning recommendations.
 */
function generateRecommendations(
  overallScore: number,
  learningStyle: string,
  strengths: any,
  growthAreas: any
) {
  const recommendations = {
    immediate: [] as string[],
    shortTerm: [] as string[],
    longTerm: [] as string[],
  };

  // Immediate recommendations (next 1-2 weeks)
  if (overallScore < 0.6) {
    recommendations.immediate.push('Focus on foundational concepts before advancing');
    recommendations.immediate.push('Practice with guided examples and immediate feedback');
  }

  // Style-specific recommendations
  switch (learningStyle) {
    case 'visual':
      recommendations.immediate.push('Use diagrams and visual aids for learning');
      recommendations.shortTerm.push('Create mind maps and concept diagrams');
      break;
    case 'auditory':
      recommendations.immediate.push('Record lessons and replay for reinforcement');
      recommendations.shortTerm.push('Participate in study groups and discussions');
      break;
    case 'kinesthetic':
      recommendations.immediate.push('Use hands-on manipulatives and real-world examples');
      recommendations.shortTerm.push('Build physical models and conduct experiments');
      break;
    case 'reading/writing':
      recommendations.immediate.push('Take detailed notes and create summaries');
      recommendations.shortTerm.push('Write explanations of concepts in own words');
      break;
  }

  // Short-term recommendations (next 1-3 months)
  if (growthAreas.conceptual.length > 0) {
    recommendations.shortTerm.push('Address conceptual gaps through targeted practice');
  }
  if (growthAreas.procedural.length > 0) {
    recommendations.shortTerm.push('Master procedural skills through repetition');
  }

  // Long-term recommendations (next 3-6 months)
  recommendations.longTerm.push('Develop independent learning strategies');
  recommendations.longTerm.push('Apply knowledge to complex, real-world problems');
  
  if (overallScore >= 0.8) {
    recommendations.longTerm.push('Explore advanced topics and interdisciplinary connections');
  }

  return recommendations;
}

/**
 * Calculate confidence level based on data availability and consistency.
 */
function calculateConfidenceLevel(dataPoints: number, overallScore: number): number {
  const dataConfidence = Math.min(1, dataPoints / 3); // More data = higher confidence
  const scoreConsistency = overallScore >= 0.5 ? 0.8 : 0.6; // Consistent scores = higher confidence
  
  return (dataConfidence + scoreConsistency) / 2;
}

/**
 * Calculate learning velocity and potential.
 */
function calculateLearningVelocity(
  scores: Array<{ type: string; score: number; weight: number }>,
  currentScore: number
) {
  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s.score - avgScore, 2), 0) / scores.length;
  
  // Learning velocity based on current performance and consistency
  const current = currentScore;
  const potential = Math.min(1, current + (0.2 * (1 - variance))); // Less variance = higher potential
  
  const factors = [];
  if (variance < 0.1) factors.push('Consistent performance');
  if (current > 0.8) factors.push('Strong foundation');
  if (scores.length > 3) factors.push('Rich data set');
  
  return {
    current,
    potential,
    factors,
  };
}
