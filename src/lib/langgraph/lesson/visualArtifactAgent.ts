import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import {
  RenderMode,
  InfographicPosterData,
  AnimalInfographicData,
  IllustratedRecipeData,
  VisualArtifactData,
} from '@/types/lesson';
import { LessonStateType } from './lessonOrchestrator';

// ─── Zod schemas for structured output ───────────────────────────────────────

const InfographicSectionSchema = z.object({
  header: z.string(),
  content: z.array(z.string()),
  icon: z.string().optional(),
  visual: z.string().optional(),
});

const InfographicPosterSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  sections: z.array(InfographicSectionSchema).min(2).max(8),
  colorPalette: z.array(z.string()).optional(),
  layout: z.enum(['vertical', 'grid']),
  callToAction: z.string().optional(),
});

const AnimalInfographicSchema = z.object({
  animal: z.string(),
  heroFact: z.string(),
  stats: z.record(z.string()),
  sections: z.array(InfographicSectionSchema).min(2).max(6),
  funFacts: z.array(z.string()).optional(),
  illustrationStyle: z.string().optional(),
});

const RecipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  icon: z.string().optional(),
});

const RecipeStepSchema = z.object({
  step: z.number(),
  title: z.string(),
  instruction: z.string(),
  visual: z.string().optional(),
  tip: z.string().optional(),
});

const IllustratedRecipeSchema = z.object({
  title: z.string(),
  steps: z.array(RecipeStepSchema).min(3).max(12),
  ingredients: z.array(RecipeIngredientSchema).min(1).max(20),
  layout: z.string().optional(),
  style: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(mode: RenderMode): string {
  const base = `You are a visual learning designer for Dear Adeline, an AI learning companion for Christian homeschool families.
Your job is NOT to write a lesson — you are DESIGNING A VISUAL ARTIFACT.
Use concise, scannable language. Think like a poster designer, not a curriculum writer.
Every section must be visually distinct. Short bullets only — no paragraphs.
Content must be age-appropriate, biblically grounded, and use real-world examples from homestead life.`;

  const modeInstructions: Record<RenderMode, string> = {
    standard_lesson: '',
    infographic_poster: `
Render Mode: INFOGRAPHIC POSTER
- Design a one-page poster with 3–6 clearly labeled sections
- Each section: bold header + 2–4 short bullets (max 8 words each)
- Suggest an icon for each section (emoji or lucide-react icon name)
- Suggest a simple diagram/illustration for each section
- Choose vertical or grid layout based on content structure
- End with a single, action-oriented call-to-action`,

    animal_infographic: `
Render Mode: ANIMAL INFOGRAPHIC
- Feature a single animal with a bold hero fact (≤12 words)
- Stats: 4–6 quick facts (speed, diet, lifespan, habitat, size, etc.)
- Sections: Habitat, Diet, Adaptations, Biblical Connection (2–4 bullets each)
- 2–4 surprising fun facts at the bottom
- Illustration style: clean, labeled, educational`,

    illustrated_recipe: `
Render Mode: ILLUSTRATED RECIPE
- Title the dish clearly
- Ingredients: name, amount, and optional emoji icon
- Steps: numbered panels, each with title + 1-sentence instruction
- Add a visual/diagram hint per step where helpful
- Add a tip for the trickiest step
- Style: hand-drawn farmhouse, warm and practical`,
  };

  return `${base}\n${modeInstructions[mode]}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function buildUserPrompt(state: LessonStateType, mode: RenderMode): string {
  return `Topic: "${state.studentQuery}"
Grade level: ${state.studentProfile?.gradeLevel || '5–8'}
Subject: ${state.routingDecision?.subject_track || 'general'}

Design a ${mode.replace(/_/g, ' ')} visual artifact for this topic.
Return ONLY valid JSON matching the required schema — no markdown, no explanation.`;
}

// ─────────────────────────────────────────────────────────────────────────────

async function runDesignBrainPass(
  model: ChatOpenAI,
  rawJson: string,
  mode: RenderMode
): Promise<string> {
  const response = await model.invoke([
    new SystemMessage(`You are a visual design reviewer.
Review the following ${mode.replace(/_/g, ' ')} JSON artifact and:
1. Shorten any bullet that exceeds 10 words
2. Ensure section headers are concise (≤4 words)
3. Verify the call-to-action (if present) is action-oriented
4. Return the improved JSON only — no commentary, no markdown.`),
    new HumanMessage(`Original artifact JSON:\n${rawJson}`),
  ]);
  return response.content as string;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function visualArtifactAgent(
  state: LessonStateType
): Promise<Partial<LessonStateType>> {
  const mode: RenderMode = (state as any).renderMode ?? 'infographic_poster';

  if (mode === 'standard_lesson') {
    return {};
  }

  const config = loadConfig();
  const model = new ChatOpenAI({
    model: config.models.default || 'gpt-4o',
    temperature: 0.4,
  });

  try {
    // Step 1: Generate structured visual artifact
    const schemaMap = {
      infographic_poster: InfographicPosterSchema,
      animal_infographic: AnimalInfographicSchema,
      illustrated_recipe: IllustratedRecipeSchema,
    } as const;

    const schema = schemaMap[mode as keyof typeof schemaMap];
    const structuredModel = model.withStructuredOutput(schema);

    const rawArtifact = await structuredModel.invoke([
      new SystemMessage(buildSystemPrompt(mode)),
      new HumanMessage(buildUserPrompt(state, mode)),
    ]);

    // Step 2: Design brain refinement pass
    const rawJson = JSON.stringify(rawArtifact);
    const refinedModel = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.2 });
    const refinedRaw = await runDesignBrainPass(refinedModel, rawJson, mode);

    let refined: typeof rawArtifact;
    try {
      const jsonMatch = refinedRaw.match(/\{[\s\S]*\}/);
      refined = jsonMatch ? JSON.parse(jsonMatch[0]) : rawArtifact;
    } catch {
      refined = rawArtifact;
    }

    const visualBlock = {
      block_id: `visual-artifact-${Date.now()}`,
      block_type: 'visual_artifact',
      type: 'visual_artifact',
      order: 0,
      renderMode: mode,
      content: refined,
    };

    return {
      lessonBlocks: [visualBlock, ...(state.lessonBlocks || [])],
      lessonMetadata: {
        ...(state.lessonMetadata || {}),
        renderMode: mode,
      },
    };
  } catch (error) {
    console.error('[VisualArtifactAgent] Error:', error);
    return {};
  }
}
