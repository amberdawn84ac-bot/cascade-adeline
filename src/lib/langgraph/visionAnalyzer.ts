import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';

/**
 * Vision Analyzer — "Snap to Log"
 *
 * Analyzes a student's uploaded photo of their work using GPT-4o vision.
 * Extracts: what was made, skills demonstrated, quality observations,
 * and suggested follow-up questions based on visual details.
 *
 * The output feeds directly into the lifeCreditLogger for auto-crediting.
 */

interface VisionAnalysis {
  activityDescription: string;
  skillsObserved: string[];
  qualityNotes: string;
  suggestedQuestion: string;
  confidence: number;
}

async function analyzeImage(
  imageUrl: string,
  userCaption: string,
  modelId: string,
  gradeLevel?: string
): Promise<VisionAnalysis> {
  const gradeContext = gradeLevel
    ? `The student is in grade band ${gradeLevel}.`
    : '';

  const { text } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 400,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are Adeline's Vision Analyzer. A student has shared a photo of something they made or did.
${gradeContext}

Student's caption: "${userCaption || '(no caption provided)'}"

Analyze the image and return ONLY strict JSON:
{
  "activityDescription": "Brief description of what the student made/did based on the image",
  "skillsObserved": ["Skill 1", "Skill 2"],
  "qualityNotes": "Specific observations about the quality, technique, or effort visible in the image",
  "suggestedQuestion": "A specific follow-up question based on something you notice in the image (e.g. texture, color, structure)",
  "confidence": 0.9
}

Be specific about what you SEE. Reference colors, textures, shapes, and details visible in the photo.`,
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ],
      },
    ],
  });

  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleanText);
  } catch {
    return {
      activityDescription: userCaption || 'Shared a photo of their work',
      skillsObserved: [],
      qualityNotes: 'Unable to analyze image details',
      suggestedQuestion: 'Tell me more about what you made!',
      confidence: 0.3,
    };
  }
}

/**
 * Main LangGraph node for vision analysis.
 *
 * Expects state.metadata.imageUrl to contain the image URL/data URI.
 * Produces a rich description that the lifeCreditLogger can use.
 */
export async function visionAnalyzer(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default; // gpt-4o supports vision

  const imageUrl = state.metadata?.imageUrl as string | undefined;

  if (!imageUrl) {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        visionAnalyzer: { error: 'No image provided' },
      },
    };
  }

  const analysis = await analyzeImage(
    imageUrl,
    state.prompt,
    modelId,
    state.gradeLevel
  );

  // Enrich the prompt with vision analysis so downstream agents (lifeCreditLogger) can use it
  const enrichedPrompt = `${state.prompt || 'I made this'}

[Vision Analysis: ${analysis.activityDescription}. Skills observed: ${analysis.skillsObserved.join(', ')}. ${analysis.qualityNotes}]`;

  // Build a user-facing response with the vision insights
  const skillsList = analysis.skillsObserved.length > 0
    ? `\n**Skills spotted:** ${analysis.skillsObserved.join(', ')}`
    : '';

  const responseContent = `📸 I can see what you've been working on! ${analysis.activityDescription}.
${skillsList}

**What I notice:** ${analysis.qualityNotes}

🔍 ${analysis.suggestedQuestion}`;

  return {
    ...state,
    prompt: enrichedPrompt,
    responseContent,
    metadata: {
      ...state.metadata,
      visionAnalyzer: {
        analysis,
        originalPrompt: state.prompt,
      },
    },
  };
}
