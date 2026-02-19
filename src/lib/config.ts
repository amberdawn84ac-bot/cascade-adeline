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
  life_to_credit_rules: Record<string, string>;
  safety: Record<string, unknown>;
  models: {
    default: string;
    investigation: string;
    deep_analysis: string;
    embeddings: string;
    routing_rules: Record<string, unknown>;
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

LIFE-TO-CREDIT RULES:
${Object.entries(c.life_to_credit_rules).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

${studentContext ? `STUDENT CONTEXT:\n${studentContext}` : ''}
`.trim();
}
