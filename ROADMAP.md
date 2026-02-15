# Adeline: Roadmap to State-of-the-Art EdTech Scale

This document outlines the strategic roadmap to evolve Adeline into a production-grade, scalable (100k+ users), and pedagogically advanced educational platform.

---

## Phase 1: Architecture & Scalability ✅

**Objective:** Asynchronous, resilient architecture for 100k+ users.

### 1.1 Asynchronous AI Processing ✅
- **Implementation:** Postgres-backed job queue (`AIJob` model) with background processor
- **Adapted for Upstash Redis** (HTTP-based) — BullMQ/IORedis not compatible with serverless
- **Endpoints:**
  - `POST /api/chat/async` → returns `202 Accepted` + `jobId` immediately
  - `GET /api/jobs/[id]?wait=5` → long-poll for results (up to 30s)
- **Files:** `src/lib/jobs/queue.ts`, `src/lib/jobs/processor.ts`, `src/app/api/chat/async/route.ts`, `src/app/api/jobs/[id]/route.ts`

### 1.2 Database Connection Pooling ✅
- **Implementation:** Supabase Supavisor configuration (port 6543 for transaction pooler)
- **File:** `src/lib/db-config.ts` — documents pool settings, timeouts, and URL selection

### 1.3 Semantic Cache ("Hippocampus Cache") ✅
- **Implementation:** Embed queries with `text-embedding-3-small`, store in Redis buckets by locality hash
- **Cosine similarity threshold:** 0.92 — returns cached responses for very similar queries
- **Wired into main chat route** — checks cache before workflow, stores responses after
- **TTL:** 1 hour, max 500 entries per bucket. Skips cache for image uploads.
- **File:** `src/lib/semantic-cache.ts`

---

## Phase 2: Learning Science Integration ✅

**Objective:** Scaffold learning using cognitive science principles.

### 2.1 Zone of Proximal Development (ZPD) Engine ✅
- **Implementation:** `UserConceptMastery` model tracks per-student mastery (0.0–1.0) with exponential time decay (30-day half-life)
- **Algorithm:** Identifies concepts where prerequisites are mastered (≥70%) but concept itself isn't yet
- **Priority scoring:** Prerequisite readiness (60%) + learning gap (30%) + downstream leverage (10%)
- **Integrated into `ProjectBrainstormer`** — injects ZPD context into prompts
- **File:** `src/lib/zpd-engine.ts`

### 2.2 Knowledge Graph ✅
- **19 concepts** (Math, Science, Culinary) + **19 prerequisite links** seeded via raw SQL
- **Vector dimension:** 1536 (OpenAI `text-embedding-3-small`)
- **File:** `prisma/seed-knowledge-graph.ts`

### 2.3 Metacognitive Reflection Agent ✅
- **Implementation:** `reflectionCoach` LangGraph node with two modes:
  - **Post-activity:** Generates Socratic questions targeting 5 dimensions (Process, Challenge, Connection, Transfer, Growth) based on Schön's reflective practice
  - **Scoring:** Rates student reflection depth (0–1) and generates warm follow-ups
- **Schema:** `ReflectionEntry` model with `ReflectionType` enum
- **Router:** `REFLECT` intent (heuristic + LLM classification)
- **Auto-triggers after every `LIFE_LOG`** event
- **File:** `src/lib/langgraph/reflectionCoach.ts`

### 2.4 Spaced Repetition System (SM-2) ✅
- **Implementation:** SuperMemo-2 algorithm with `ReviewSchedule` model
- **Quality scale:** 0–5, ease factor with 1.3 floor, interval progression 1→6→EF*n
- **API:** `GET /api/reviews` (due reviews), `POST /api/reviews` (record result)
- **Auto-schedules concepts** after life credit logging by matching mapped subjects to knowledge graph
- **Bridges to ZPD:** `qualityToMasteryDelta()` syncs SM-2 quality scores to mastery levels
- **File:** `src/lib/spaced-repetition.ts`, `src/app/api/reviews/route.ts`

---

## Phase 3: Multimodal AI ✅ (Partial)

**Objective:** Leverage vision and other modalities for richer interaction.

### 3.1 Snap-to-Log (Visual Artifact Verification) ✅
- **Implementation:** `visionAnalyzer` LangGraph node using GPT-4o vision
- **Extracts:** Activity description, skills observed, quality notes, follow-up questions
- **Router:** `IMAGE_LOG` intent (auto-detected when image is present)
- **Chain:** visionAnalyzer → lifeCreditLogger → reflectionCoach
- **UI:** 📷 button in chat with preview, base64 encoding, 10MB limit
- **Files:** `src/lib/langgraph/visionAnalyzer.ts`, updated `src/app/(routes)/chat/page.tsx`

### 3.2 Voice Interaction (Whisper) — Future
### 3.3 Dynamic Generative UI 2.0 — Future

---

## Phase 4: Production Readiness ✅

**Objective:** Security, compliance, and observability for serving minors.

### 4.1 PII Masking Middleware ✅
- **8 PII types detected and redacted:** Email, phone, SSN, credit card, IP address, street address, name disclosures, date of birth
- **Applied before any LLM call** — original messages stored in DB, masked versions sent to AI
- **File:** `src/lib/safety/pii-masker.ts`

### 4.2 Content Moderation Guardrails ✅
- **Layer 1 (local, zero-latency):** Regex patterns for personal contact solicitation, explicit content, violence/threats, self-harm, substance abuse
- **Layer 2 (OpenAI Moderation API):** Nuanced async check for anything passing local filters
- **Self-harm triggers:** Compassionate response with crisis resources (988 Lifeline, Crisis Text Line, Childhelp)
- **File:** `src/lib/safety/content-moderator.ts`

### 4.3 COPPA Consent Tracking ✅
- **User model fields:** `coppaConsentAt`, `coppaConsentBy` (parent userId), `dataRetentionDays` (default 365)

### 4.4 LLM Observability & Tracing ✅
- **`LLMTrace` model:** Persists every LLM call with traceId, agent node, model, tokens, latency, estimated cost (USD), success/failure
- **Batched writes:** Flushes to DB every 5s or 20 entries to minimize overhead
- **Cost estimation:** Built-in rates for GPT-4o, Claude 3 Sonnet, Gemini models
- **All `safeNode` calls traced** in the chat route
- **File:** `src/lib/observability/tracer.ts`

### 4.5 Analytics API ✅
- **`GET /api/analytics?period=24h|7d|30d`** — total calls, tokens, cost, avg latency, error rate
- **Per-agent breakdown** — which agents cost the most
- **Per-model breakdown** — which models are used most
- **File:** `src/app/api/analytics/route.ts`

---

## Data Flow (End-to-End)

```
User message → Content Moderation (block if unsafe)
            → PII Masking (redact personal info)
            → Semantic Cache check (return cached if similar)
            → Router (classify intent)
            → Agent workflow (traced + timed):
                LIFE_LOG  → lifeCreditLogger → schedule reviews → reflectionCoach
                IMAGE_LOG → visionAnalyzer → lifeCreditLogger → reflectionCoach
                BRAINSTORM → projectBrainstormer (with ZPD context)
                INVESTIGATE → discernmentEngine
                REFLECT → reflectionCoach (score + follow-up)
                OPPORTUNITY → opportunityScout
                CHAT → streamText (general conversation)
            → genUIPlanner → gapDetector
            → Cache response → Flush traces → Return
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Supabase) + pgvector |
| **ORM** | Prisma 7 |
| **Cache** | Upstash Redis (HTTP) |
| **AI SDK** | Vercel AI SDK v6 |
| **Default LLM** | GPT-4o (OpenAI) |
| **Investigation LLM** | Claude 3 Sonnet (Anthropic) |
| **Embeddings** | text-embedding-3-small (OpenAI, 1536 dim) |
| **Auth** | Supabase Auth |
| **Deployment** | Vercel (serverless) |
| **UI** | React 19, Tailwind CSS, Radix UI |
