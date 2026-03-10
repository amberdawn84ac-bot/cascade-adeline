import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';

let cachedConfig: AdelineConfig | null = null;

export interface AdelineConfig {
  persona: {
    name: string;
    role: string;
    voice: string;
    foundation: string;
    core_belief: string;
    rules: Record<string, string>;
  };
  pedagogy: {
    method: string;
    reject_busywork: boolean;
    require_service_component: boolean;
    require_purpose: boolean;
    artifact_types: string[];
    prompt_on_brainstorm: string;
    redirect_busywork: string;
    discernment: {
      source_priority: string[];
      always_ask: string;
      teach_method: string;
    };
    hebrew_greek: { enabled: boolean; description: string };
    investigation: { enabled: boolean; description: string; focus: string };
  };
  homesteading_integration: {
    core_focus: string;
    active_projects: string[];
  };
  pedagogical_drive: {
    anti_passive_rule: string;
    graduation_focus: string;
  };
  life_to_credit_rules: Record<string, string>;
  safety: Record<string, unknown>;
  models: {
    default: string;
    investigation: string;
    deep_analysis: string;
    embeddings: string;
    routing_rules: Record<string, unknown>;
  };
  science_experiments?: {
    household_items_rule: string;
    fun_factor: string;
    connect_to_learning: string;
    homestead_first: string;
    structure: string;
    safety: string;
  };
  grade_expectations?: Record<string, string[]>;
  ui: Record<string, string>;
}

export function loadConfig(): AdelineConfig {
  if (cachedConfig) return cachedConfig;
  const configPath = path.join(process.cwd(), 'adeline.config.toml');
  console.log('[Config] Loading config from:', configPath);
  const raw = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = parse(raw) as unknown as AdelineConfig;
  console.log('[Config] Loaded default model:', cachedConfig.models.default);
  return cachedConfig;
}

export function buildSystemPrompt(config: AdelineConfig, studentContext?: string): string {
  const c = config;
  return `
You are ${c.persona.name}. ${c.persona.role}.

VOICE: ${c.persona.voice}
FOUNDATION: ${c.persona.foundation}
CORE BELIEF: ${c.persona.core_belief}

RULES YOU MUST FOLLOW:
${Object.entries(c.persona.rules).map(([k, v]) => `- ${k.toUpperCase()}: ${v}`).join('\n')}

PEDAGOGY:
- Method: ${c.pedagogy.method}
- When brainstorming: ${c.pedagogy.prompt_on_brainstorm}
- If student proposes busywork: ${c.pedagogy.redirect_busywork}
- Discernment: ${c.pedagogy.discernment.teach_method}. Always ask: "${c.pedagogy.discernment.always_ask}"
- Source priority: ${c.pedagogy.discernment.source_priority.join(' > ')}

${c.science_experiments ? `SCIENCE EXPERIMENTS — RULES YOU MUST FOLLOW EVERY TIME:
- MATERIALS: ${c.science_experiments.household_items_rule}
- FUN FACTOR: ${c.science_experiments.fun_factor}
- CONNECT TO LEARNING: ${c.science_experiments.connect_to_learning}
- HOMESTEAD FIRST: ${c.science_experiments.homestead_first}
- STRUCTURE: ${c.science_experiments.structure}
- SAFETY: ${c.science_experiments.safety}` : ''}

HOMESTEADING INTEGRATION:
${c.homesteading_integration.core_focus}

ACTIVE HOMESTEADING PROJECTS (Default to these topics in all examples, analogies, and math problems):
${c.homesteading_integration.active_projects.map(p => `- ${p}`).join('\n')}

PEDAGOGICAL DRIVE:
- ${c.pedagogical_drive.anti_passive_rule}
- ${c.pedagogical_drive.graduation_focus}

CRITICAL DIRECTIVE: You must drive the conversation. Always end your response with a specific, probing question about their progress on a real-world farm project, or a clear call-to-action to log a credit.

LIFE-TO-CREDIT RULES:
${Object.entries(c.life_to_credit_rules).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

${studentContext ? `STUDENT CONTEXT:\n${studentContext}` : ''}
`.trim();
}
