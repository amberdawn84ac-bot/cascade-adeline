import crypto from 'crypto';
import prisma from '../db';
import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

export interface VoiceToTextLog {
  id: string;
  userId: string;
  audioTranscript: string;
  activityDescription: string;
  subjectArea: string;
  creditsEarned: number;
  duration: number; // in seconds
  confidence: number;
  concepts: string[];
  createdAt: Date;
}

export interface CreditMapping {
  activityType: string;
  subjectArea: string;
  baseCredits: number;
  multiplier: number;
  concepts: string[];
  totalCredits: number;
}

/**
 * Process voice recording and convert to life credit entry.
 */
export async function processVoiceToTextLog(
  userId: string,
  audioBase64: string,
  duration: number
): Promise<VoiceToTextLog> {
  try {
    // Step 1: Transcribe audio to text
    const transcript = await transcribeAudio(audioBase64);
    
    // Step 2: Extract activity details using AI
    const activityDetails = await extractActivityDetails(transcript);
    
    // Step 3: Map to credits and concepts
    const creditMapping = await mapActivityToCredits(activityDetails);
    
    // Step 4: Create transcript entry
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId,
        activityName: activityDetails.activityName,
        mappedSubject: creditMapping.subjectArea,
        creditsEarned: creditMapping.totalCredits,
        dateCompleted: new Date(),
        metadata: {
          audioTranscript: transcript,
          duration,
          confidence: activityDetails.confidence,
          voiceLog: true,
        },
      },
    });

    // Step 5: Update concept mastery
    if (creditMapping.concepts.length > 0) {
      await updateConceptMastery(userId, creditMapping.concepts, 0.1);
    }

    return {
      id: transcriptEntry.id,
      userId,
      audioTranscript: transcript,
      activityDescription: activityDetails.description,
      subjectArea: creditMapping.subjectArea,
      creditsEarned: creditMapping.totalCredits,
      duration,
      confidence: activityDetails.confidence,
      concepts: creditMapping.concepts,
      createdAt: transcriptEntry.createdAt,
    };

  } catch (error) {
    console.error('[VoiceToTextLogger] Processing failed:', error);
    throw new Error('Failed to process voice log');
  }
}

/**
 * Transcribe audio using AI service.
 */
async function transcribeAudio(audioBase64: string): Promise<string> {
  const config = loadConfig();
  const modelId = config.models.default;

  const { text } = await generateText({
    model: getModel(modelId),
    prompt: `Transcribe this audio recording into text. The audio contains a student describing an activity they completed.

Audio data: [base64 audio data would be processed here]

Return ONLY the transcribed text, without any additional commentary or formatting.
Focus on accurately capturing the student's description of their activity.`,
    temperature: 0.1,
  });

  return text.trim();
}

/**
 * Extract activity details from transcript using AI.
 */
async function extractActivityDetails(transcript: string): Promise<{
  activityName: string;
  description: string;
  confidence: number;
  duration: number;
}> {
  const config = loadConfig();
  const modelId = config.models.default;

  const { text } = await generateText({
    model: getModel(modelId),
    prompt: `Analyze this student's activity description and extract key details:

Student transcript: "${transcript}"

Return a JSON object with:
{
  "activityName": "Brief name for the activity",
  "description": "Detailed description of what the student did",
  "confidence": 0.95,
  "duration": 30
}

Focus on:
1. Identifying the main activity
2. Describing what was accomplished
3. Estimating confidence in the extraction (0.0-1.0)
4. Estimating activity duration in minutes

Return ONLY valid JSON.`,
    temperature: 0.2,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return {
      activityName: parsed.activityName || 'Unknown Activity',
      description: parsed.description || transcript,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      duration: typeof parsed.duration === 'number' ? parsed.duration : 30,
    };
  } catch (error) {
    console.error('[VoiceToTextLogger] Failed to parse activity details:', error);
    return {
      activityName: 'Voice Activity',
      description: transcript,
      confidence: 0.7,
      duration: 30,
    };
  }
}

/**
 * Map activity to educational credits and concepts.
 */
async function mapActivityToCredits(activityDetails: {
  activityName: string;
  description: string;
}): Promise<CreditMapping> {
  const config = loadConfig();
  const modelId = config.models.default;

  const { text } = await generateText({
    model: getModel(modelId),
    prompt: `Map this student activity to educational credits and concepts:

Activity: ${activityDetails.activityName}
Description: ${activityDetails.description}

Return a JSON object with:
{
  "activityType": "community_service|creative_arts|stem|language_arts|physical_education|leadership",
  "subjectArea": "Mathematics|Science|English|History|Art|Music|PE|Technology|Social Studies",
  "baseCredits": 0.25,
  "multiplier": 1.0,
  "concepts": ["concept1", "concept2"]
}

Guidelines:
- Base credits: 0.125 to 0.5 based on educational value
- Multiplier: 0.8 to 1.5 based on complexity and effort
- Concepts: 1-3 relevant educational concepts
- Consider real-world learning value

Return ONLY valid JSON.`,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return {
      activityType: parsed.activityType || 'creative_arts',
      subjectArea: parsed.subjectArea || 'Art',
      baseCredits: typeof parsed.baseCredits === 'number' ? parsed.baseCredits : 0.25,
      multiplier: typeof parsed.multiplier === 'number' ? parsed.multiplier : 1.0,
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
      totalCredits: calculateTotalCredits({
        activityType: parsed.activityType || 'creative_arts',
        subjectArea: parsed.subjectArea || 'Art',
        baseCredits: typeof parsed.baseCredits === 'number' ? parsed.baseCredits : 0.25,
        multiplier: typeof parsed.multiplier === 'number' ? parsed.multiplier : 1.0,
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
        totalCredits: 0, // Will be calculated
      }),
    };
  } catch (error) {
    console.error('[VoiceToTextLogger] Failed to parse credit mapping:', error);
    return {
      activityType: 'creative_arts',
      subjectArea: 'Art',
      baseCredits: 0.25,
      multiplier: 1.0,
      concepts: [],
      totalCredits: 0.25,
    };
  }
}

/**
 * Calculate total credits from mapping.
 */
function calculateTotalCredits(mapping: CreditMapping): number {
  return Number((mapping.baseCredits * mapping.multiplier).toFixed(4));
}

/**
 * Update concept mastery for identified concepts.
 */
async function updateConceptMastery(
  userId: string,
  concepts: string[],
  delta: number
): Promise<void> {
  for (const conceptName of concepts) {
    // Find or create concept
    let concept = await prisma.concept.findFirst({
      where: { name: conceptName },
    });

    if (!concept) {
      concept = await prisma.$queryRaw`
        INSERT INTO "Concept" (id, name, "subjectArea", description, "gradeBand", "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${conceptName}, 'Interdisciplinary', ${`Concept identified through voice logging: ${conceptName}`}, '6-8', NOW(), NOW())
        RETURNING *
      `;
      concept = Array.isArray(concept) ? concept[0] : concept;
    }

    // Update mastery
    if (concept) {
      await prisma.userConceptMastery.upsert({
        where: { userId_conceptId: { userId, conceptId: concept.id } },
        create: {
          userId,
          conceptId: concept.id,
          masteryLevel: delta,
          lastPracticed: new Date(),
          history: { entries: [] },
        },
        update: {
          masteryLevel: { increment: delta },
          lastPracticed: new Date(),
        },
      });
    }
  }
}

/**
 * Get voice logging statistics for a user.
 */
export async function getVoiceLoggingStats(userId: string): Promise<{
  totalLogs: number;
  totalCredits: number;
  averageConfidence: number;
  totalDuration: number;
  subjectBreakdown: Record<string, number>;
}> {
  const logs = await prisma.transcriptEntry.findMany({
    where: {
      userId,
    },
    select: {
      creditsEarned: true,
      metadata: true,
      mappedSubject: true,
    },
  });

  // Filter for voice logs after fetching
  const voiceLogs = logs.filter(log => {
    const metadata = log.metadata as any;
    return metadata?.voiceLog === true;
  });

  const totalLogs = voiceLogs.length;
  const totalCredits = voiceLogs.reduce((sum, log) => sum + Number(log.creditsEarned || 0), 0);
  
  let totalConfidence = 0;
  let totalDuration = 0;
  const subjectBreakdown: Record<string, number> = {};

  voiceLogs.forEach(log => {
    const metadata = log.metadata as any;
    if (metadata?.confidence) {
      totalConfidence += metadata.confidence;
    }
    if (metadata?.duration) {
      totalDuration += metadata.duration;
    }
    
    const subject = log.mappedSubject || 'Unknown';
    subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + Number(log.creditsEarned || 0);
  });

  return {
    totalLogs,
    totalCredits,
    averageConfidence: totalLogs > 0 ? totalConfidence / totalLogs : 0,
    totalDuration,
    subjectBreakdown,
  };
}
