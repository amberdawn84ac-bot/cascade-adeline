# Dear Adeline

An interest-led AI learning companion for Christian homeschool families. Adeline follows your child's curiosities, maps real-life activities to academic credits, and scaffolds learning with cognitive science — all wrapped in a warm, sketchnote-style interface.

## What is Dear Adeline?

Dear Adeline is an AI-powered tutor that turns everyday life into education. A student bakes bread and earns chemistry credits. They start a crochet business and learn entrepreneurship. Adeline tracks it all, detects learning gaps, and gently nudges toward growth — never busywork.

**Core capabilities:**
- **Life Credit Logging** — Describe any activity and Adeline maps it to academic subjects and credits
- **Discernment Engine** — "Who funds the sugar industry?" gets a multi-source investigation with bias analysis
- **Snap-to-Log** — Upload a photo of your work; GPT-4o vision analyzes it and logs credits automatically
- **Metacognitive Reflection** — Socratic follow-up questions after every activity to deepen learning
- **Spaced Repetition** — SM-2 algorithm schedules concept reviews to combat the forgetting curve
- **ZPD Scaffolding** — Suggests tasks in the student's Zone of Proximal Development
- **Knowledge Graph** — 19 concepts with prerequisite links, mastery tracking, and decay modeling
- **Safety First** — PII masking, content moderation, COPPA consent tracking

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your API keys (see .env.example for details)

# 3. Push database schema & seed knowledge graph
npx prisma db push
npx tsx prisma/seed-knowledge-graph.ts

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click "Join the Academy" to start chatting with Adeline.

## Architecture

```
User message → Content Moderation → PII Masking → Semantic Cache
            → Router (intent classification)
            → Agent workflow (traced + timed):
                LIFE_LOG    → lifeCreditLogger → spaced repetition → reflectionCoach
                IMAGE_LOG   → visionAnalyzer → lifeCreditLogger → reflectionCoach
                BRAINSTORM  → projectBrainstormer (with ZPD context)
                INVESTIGATE → discernmentEngine (multi-source + bias)
                REFLECT     → reflectionCoach (Schön dimensions)
                OPPORTUNITY → opportunityScout
                CHAT        → streamText (general conversation)
            → genUIPlanner → gapDetector
            → Cache response → Flush traces → Stream to client
```

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
| **Investigation** | Claude 3 Sonnet (Anthropic) |
| **Embeddings** | text-embedding-3-small (1536 dim) |
| **Auth** | Supabase Auth |
| **Deployment** | Vercel (serverless) |
| **UI** | React 19, Tailwind CSS, Radix UI |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat — streaming UI message protocol |
| `/api/chat/async` | POST | Async chat — returns 202 + jobId |
| `/api/jobs/[id]` | GET | Poll async job status (supports long-poll) |
| `/api/reviews` | GET/POST | Spaced repetition — due reviews + record results |
| `/api/analytics` | GET | Usage dashboard — tokens, cost, latency by agent/model |
| `/api/health` | GET | System health — DB + Redis connectivity |
| `/api/test-chat` | GET | Debug — run a prompt through the pipeline, get raw JSON |

## Project Structure

```
src/
├── app/
│   ├── api/chat/          # Main chat route + async variant
│   ├── api/health/        # Health check
│   ├── api/analytics/     # Usage analytics
│   └── (routes)/chat/     # Chat UI page
├── lib/
│   ├── langgraph/         # Agent nodes (router, lifeCreditLogger, discernmentEngine, etc.)
│   ├── safety/            # PII masker + content moderator
│   ├── observability/     # LLM call tracer
│   ├── jobs/              # Async job queue + processor
│   ├── ai-models.ts       # Centralized model selection
│   ├── semantic-cache.ts  # Embedding-based response cache
│   ├── zpd-engine.ts      # Zone of Proximal Development algorithm
│   └── spaced-repetition.ts # SM-2 algorithm
├── components/
│   └── sketchnote/        # GenUI renderer (TranscriptCard, InvestigationBoard, etc.)
└── generated/prisma/      # Generated Prisma client
```

See [ROADMAP.md](./ROADMAP.md) for detailed implementation documentation of every feature.
