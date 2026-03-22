# CLAUDE.md — Dear Adeline

AI assistant guide for the **Dear Adeline** codebase. Read this before making any changes.

---

## Project Overview

**Dear Adeline** is an interest-led AI learning companion for Christian homeschool families (ages 5–18). Adeline is a wise, discerning mentor who:

- Logs real-world activities ("I baked bread") and auto-credits them as academic subjects
- Suggests projects in the student's Zone of Proximal Development (ZPD)
- Teaches financial/corporate discernment via "follow the money" investigations
- Prompts metacognitive reflection using spaced repetition (SM-2 algorithm)
- Generates UI components (transcript cards, investigation boards) inline in chat

**Audience:** Homeschool parents and children (K–12). Content must always be age-appropriate with a biblical worldview foundation.

**Tagline:** "Wise, discerning mentor who turns everyday life into meaningful education."

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict mode) | ^5 |
| UI | React | 18.3.1 |
| Styling | Tailwind CSS + PostCSS | ^4 |
| Components | Shadcn/ui (new-york style) + Radix UI | latest |
| AI SDK | Vercel AI SDK | ^6.0.79 |
| Orchestration | LangGraph | ^1.1.4 |
| LLM (default) | GPT-4o (OpenAI) | — |
| LLM (investigation) | Claude 3.5 Sonnet (Anthropic) | — |
| Embeddings | text-embedding-3-small | — |
| Database | Supabase PostgreSQL + pgvector | — |
| ORM | Prisma | ^7.4.2 |
| Cache | Upstash Redis | ^1.36.2 |
| Auth | Supabase Auth (`@supabase/ssr`) | ^0.8.0 |
| Payments | Stripe | subscriptions + webhooks |
| Email | Resend | — |
| Analytics | PostHog | ^1.347.2 |
| Jobs | BullMQ | ^5.70.1 |
| PDF Export | @react-pdf/renderer | — |
| Icons | Lucide React | — |
| Animations | Framer Motion | ^12 |
| Validation | Zod | ^3.25.76 |
| Unit Tests | Vitest | ^4.0.18 |
| E2E Tests | Playwright | ^1.58.2 |
| Deployment | Vercel | iad1 region |

---

## Directory Structure

```
cascade-adeline/
├── adeline.config.toml      # CRITICAL: Adeline's entire persona + pedagogy + model routing + UI
├── prisma/
│   ├── schema.prisma        # Full database schema (50+ models)
│   ├── seed-competitions.ts
│   ├── seed-granular-standards.ts
│   ├── seed-knowledge-graph.ts
│   └── seed-standards.ts
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Landing/marketing page
│   │   ├── (marketing)/     # Public marketing routes
│   │   ├── (routes)/        # Protected app routes (requires auth)
│   │   ├── api/             # 50+ API route handlers
│   │   │   ├── chat/        # Main AI chat endpoint (streaming)
│   │   │   ├── stripe/      # Payment webhooks + checkout
│   │   │   ├── cron/        # Scheduled jobs
│   │   │   └── ...
│   │   ├── auth/            # Auth callback routes
│   │   ├── login/
│   │   └── onboarding/
│   ├── components/          # React components (~21 subdirectories)
│   │   ├── chat/            # Chat UI, message rendering, streaming
│   │   ├── gen-ui/          # Generative UI components (TranscriptCard, etc.)
│   │   ├── sketchnote/      # Sketchnotes aesthetic components
│   │   ├── dashboard/       # Parent/student dashboards
│   │   ├── journal/         # Daily journal feature
│   │   ├── lessons/         # Lesson display and planning
│   │   ├── college-prep/    # Curriculum planning tools
│   │   ├── subscription/    # Pricing, checkout, upgrade flows
│   │   └── ...              # nav, auth, onboarding, settings, ui (shadcn), etc.
│   ├── lib/                 # Core business logic
│   │   ├── langgraph/       # AI pipeline (LangGraph graph + nodes + tools)
│   │   ├── learning/        # ZPD, spaced repetition, adaptive content
│   │   ├── safety/          # PII masking, content moderation
│   │   ├── life-credits/    # Life-to-credit mapping
│   │   ├── ai-models.ts     # Model provider abstraction (OpenAI, Anthropic, Google)
│   │   ├── config.ts        # Loads adeline.config.toml at runtime
│   │   ├── stripe.ts        # Stripe client, STRIPE_PRICES, TIER_LIMITS
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── email/           # Resend email templates
│   │   ├── collaborative/   # Collaborative session features
│   │   ├── memex/           # Knowledge graph / memex system
│   │   ├── observability/   # Logging and tracing
│   │   ├── semantic-cache.ts # Semantic response caching
│   │   ├── lti/             # LTI integration
│   │   └── ...
│   ├── hooks/               # React hooks
│   └── types/               # Shared TypeScript types
├── __tests__/               # Vitest unit tests
├── e2e/                     # Playwright E2E tests
│   └── specs/
├── .github/workflows/       # CI pipelines (test, lint, lighthouse, prisma)
├── scripts/
│   ├── setup.ts             # Project initialization
│   └── validate-env.ts      # Env var validation
└── docs/plans/              # Architecture and implementation planning docs
```

---

## Critical Configuration: `adeline.config.toml`

This file governs Adeline's behavior. **Always read it before modifying the AI pipeline.**

### Persona Rules (enforced in all responses)
- **No busywork**: Every project must help someone, solve a problem, or beautify the world
- **No formulaic responses**: No rigid templates or academic boilerplate
- **No theatrics**: No asterisk actions, no endearments ("sweetie", "dear")
- **Follow the money**: Always trace funding, incentives, regulatory capture
- **Primary sources only**: NEVER cite textbooks; use original documents, diaries, transcripts
- **No hypotheticals**: Treat everything as real and ongoing on the homestead

### Model Routing (`[models]`)
```toml
default = "gpt-4o"
investigation = "claude-3-5-sonnet-20240620"  # for "follow the money" queries
embeddings = "text-embedding-3-small"
```

Investigation keywords that trigger Claude 3.5: `"who profits"`, `"follow the money"`, `"what really happened"`, `"investigate"`, `"regulatory capture"`, `"who funded"`

### Life-to-Credit Mapping (`[life_to_credit_rules]`)
Activities are automatically mapped to academic subjects. Examples:
- `baking` → Chemistry (Thermodynamics & Fermentation), Math (Ratios)
- `coding` → Computer Science (Programming), Math (Logic)
- `gardening` → Biology (Botany), Chemistry (Soil Science)

### UI Theme (`[ui]`)
Sketchnotes aesthetic with a farmhouse palette. **Use these colors consistently:**
- `#BD6809` Papaya — key terms, vocabulary highlights
- `#9A3F4A` Paradise — scripture references, biblical connections
- `#2F4731` Palm Frond — nature/science/farm connections
- `#3D1419` Fuschia — "Follow the Money" investigation callouts
- `#121B13` Vervain — primary body text (never pure black)
- `#FFFEF7` Cream — card/note backgrounds

**Fonts:** Emily's Candy (header), Kranky (fun), Swanky and Moo Moo (body), Kalam (handwritten), Permanent Marker (emphasis), Georgia (scripture)

### Grade Credit Requirements (`[grade_expectations]`)
- K–2: 1.0 credits/year
- 3–5: 1.5 credits/year
- 6–8: 2.0 credits/year
- 9–12: 3.0 credits/year

---

## Key Modules

### AI Pipeline (`src/lib/langgraph/`)
LangGraph orchestrates the chat pipeline. The graph is defined in `index.ts` and compiled as `adelineBrain`.

**Nodes** (the actual LangGraph graph nodes in `nodes/`):
| Node | Intent(s) handled | Purpose |
|------|-------------------|---------|
| `router` | all | Classifies incoming message into an intent |
| `registrar` | `LOG_CREDIT` | Parses activity descriptions, maps to transcript credits |
| `investigator` | `INVESTIGATE` | "Follow the money" corporate investigations |
| `mentor` | `CHAT`, `REFLECT`, `GEN_UI` | General conversation, reflection, inline UI generation |
| `opportunityScout` | `OPPORTUNITY` | Finds interest-based competitions/scholarships |
| `projectBrainstormer` | `BRAINSTORM` | Generates real-world project ideas |
| `visionAnalyzer` | `IMAGE_LOG`, `VISION` | Analyzes uploaded photos, logs credits from images |

**Supporting tools/utilities** (called by nodes, not nodes themselves):
- `lifeCreditLogger.ts` — credit calculation logic used by `registrar`
- `discernmentEngine.ts` — investigation logic used by `investigator`
- `genUIPlanner.ts` — component selection logic used by `mentor`
- `opportunityScout.ts` — search logic used by `opportunityScout` node
- `projectBrainstormer.ts` — ideation logic used by `projectBrainstormer` node
- `gapDetector.ts` — learning gap analysis (utility)
- `reflectionCoach.ts` — metacognitive prompting (utility)
- `voiceLogger.ts` — audio transcription helper
- `generateAnalogy.ts` — cognitive load override utility

**Intent types** (`src/lib/langgraph/state.ts`):
```typescript
type Intent = 'CHAT' | 'INVESTIGATE' | 'LOG_CREDIT' | 'REFLECT' | 'GEN_UI'
            | 'OPPORTUNITY' | 'BRAINSTORM' | 'IMAGE_LOG' | 'VISION'
```

**Router heuristic-first classification** (`src/lib/langgraph/nodes/router.ts`):
1. Metadata overrides first: `imageUrl` in state → `IMAGE_LOG`; `audioBase64` → `LOG_CREDIT`
2. Keyword heuristics (fast, no LLM call):
   - Life-log phrases (`"i baked"`, `"i built"`, `"i made"`, `"i helped"`, `"i cooked"`, `"i read"`, `"i wrote"`, `"i finished"`, `"i completed"`, `"i sewed"`, `"i planted"`, `"i gardened"`, `"i volunteered"`, `"i served"`) → `LOG_CREDIT`
   - `"brainstorm"`, `"idea"`, `"i want to build"` → `BRAINSTORM`
   - `"who profits"`, `"follow the money"`, `"investigate"`, `"regulatory capture"`, `"what really happened"`, `"who funded"` → `INVESTIGATE`
   - `"opportunit"`, `"scholarship"`, `"competition"` → `OPPORTUNITY`
   - Reflection phrases (`"i learned"`, `"i realized"`, `"i struggled with"`, etc.) → `REFLECT`
3. LLM fallback (GPT-4o with structured output) only for ambiguous messages

Model selection is read from `adeline.config.toml` via `loadConfig()` — investigation intents route to Claude 3.5 Sonnet, everything else to GPT-4o.

### Learning Engine (`src/lib/learning/`)
- **`zpd-engine.ts`** — Zone of Proximal Development calculations
- **`spaced-repetition.ts`** — SM-2 algorithm implementation
- **`adaptive-content.ts`** — content difficulty scaling based on student performance
- **`cognitive-load.ts`** — tracks cognitive load to avoid overwhelm
- **`life-credits.ts`** — real-world activity → academic credit conversion

### Safety (`src/lib/safety/`)
- **PII Masking** — 8 PII types redacted before any LLM call (names, locations, contacts, etc.)
- **Content Moderation** — Regex patterns + OpenAI Moderation API
- **COPPA Compliance** — parent-gated data controls for students under 13
- **Age Filtering** — content filtered to `min_age=5`, `max_age=18`

---

## Development Workflow

### Initial Setup
```bash
git clone <repo>
cd cascade-adeline
npm install
npm run setup    # Creates .env, pushes DB schema, seeds knowledge graph
npm run dev
```

### Common Commands
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # prisma generate + next build
npm run lint             # ESLint (zero warnings allowed)
npm run validate         # Validate all env vars
npm run test             # Vitest unit tests
npm run test:watch       # Vitest watch mode
npm run test -- --coverage  # Unit tests with coverage report
npm run test:e2e         # Playwright headless (CI mode)
npm run test:e2e:ui      # Playwright interactive UI
npm run test:e2e:headed  # Playwright with visible browser
npm run test:all         # Unit + E2E
npm run bundlewatch      # Check bundle size limits
```

---

## Testing

### Unit Tests (Vitest)
- **Location:** `__tests__/` and co-located `*.test.ts(x)` files
- **Coverage thresholds:** 85% lines, 80% functions, 75% branches
- **Pattern:** `vi.mock()` for dependencies, `beforeEach` cleanup, `async/await`

Key test files:
- `__tests__/learning/zpd-engine.test.ts`
- `__tests__/learning/spaced-repetition.test.ts`
- `__tests__/learning/lifeCreditLogger.test.ts`
- `__tests__/safety/pii-masker.test.ts`
- `__tests__/ai/router-heuristic.test.ts`

### E2E Tests (Playwright)
- **Location:** `e2e/specs/`
- **Browsers:** Chromium, Firefox, WebKit (all three in CI)
- **Retries:** 2 in CI, 0 locally

Key E2E specs:
- `e2e/specs/onboarding.spec.ts`
- `e2e/specs/voice-logging.spec.ts`
- `e2e/specs/genui.spec.ts`
- `e2e/specs/performance.spec.ts`

### CI Gates (all must pass on PR)
- Unit tests with coverage
- E2E tests (3 browsers)
- TypeScript type check (`tsc --noEmit`)
- ESLint (0 warnings)
- Lighthouse: Performance >90, Accessibility >95, Best Practices >90, SEO >90
- Bundle size limits: index <200KB, _app <500KB, chat <300KB

---

## Environment Variables

### Required for Any Functionality
```env
OPENAI_API_KEY=               # LLM + embeddings + vision
DATABASE_URL=                 # Supabase PostgreSQL (port 6543 pooler — for runtime)
DIRECT_DATABASE_URL=          # Supabase PostgreSQL (port 5432 direct — for migrations only)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
APP_ENCRYPTION_KEY=           # 48-char hex
SESSION_SECRET=               # 48-char hex
CRON_SECRET=                  # 48-char hex
NEXT_PUBLIC_APP_URL=          # e.g. http://localhost:3000
```

> **Important:** `DATABASE_URL` uses port **6543** (pgBouncer pooler). `DIRECT_DATABASE_URL` uses port **5432** (direct connection). Never mix these up — migrations require the direct URL.

### Optional Features
```env
ANTHROPIC_API_KEY=            # Claude 3.5 for investigation queries
GOOGLE_API_KEY=               # Gemini as alternative provider
TAVILY_API_KEY=               # Web search for discernment engine
NEXT_PUBLIC_POSTHOG_KEY=      # PostHog analytics
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STUDENT_MONTHLY=
STRIPE_PRICE_STUDENT_YEARLY=
STRIPE_PRICE_PARENT_MONTHLY=
STRIPE_PRICE_PARENT_YEARLY=
STRIPE_PRICE_TEACHER_MONTHLY=
STRIPE_PRICE_TEACHER_YEARLY=
STRIPE_PRICE_EXTRA_STUDENT=
RESEND_API_KEY=               # Transactional email
EMAIL_FROM=                   # Sender address for Resend emails
USER_PROVISION_SECRET=        # Supabase user signup webhook secret
```

See `.env.example` for the full list with documentation.

---

## Code Conventions

### TypeScript
- **Strict mode** is enforced (`tsconfig.json` — never disable it)
- Use Zod for all schema validation, especially at API boundaries and LLM outputs
- Import alias: `@/*` maps to `src/*`

### React / Next.js
- Prefer **React Server Components** (RSC) by default; add `"use client"` only when needed
- Follow Next.js App Router patterns — no `pages/` directory
- Use Shadcn/ui components (style: `new-york`, base color: `stone`)
- Icons: Lucide React exclusively

### API Routes
- Located in `src/app/api/`
- Parse request body with `req.json()`
- Return typed responses with explicit status codes
- Streaming responses use `ReadableStream` for chat

### Styling
- Tailwind utility classes only — no custom CSS unless absolutely necessary
- Use CSS variables for theme colors (defined in globals)
- Tailwind 4 syntax (no `tailwind.config.js` — configured via PostCSS)

### Linting
- ESLint with `eslint-config-next` (core-web-vitals + TypeScript)
- **Zero warnings policy** — any warning is a build failure
- Run `npm run lint` before committing

### Error Handling
- Validate at system boundaries (user input, external APIs)
- Do not add error handling for impossible scenarios
- Trust Prisma and Next.js framework guarantees internally

---

## Database

### Schema (`prisma/schema.prisma`)
- 50+ Prisma models including: `User`, `Student`, `TranscriptEntry`, `LearningActivity`, `Club`, `Subscription`, `ReferralCode`
- Uses `pgvector` extension for embedding similarity search
- JSON fields for flexible metadata
- Cascade deletes on parent-child relationships

### Working with Prisma
```bash
npx prisma generate          # Regenerate client after schema changes
npx prisma db push           # Push schema to DB (dev, uses DIRECT_DATABASE_URL)
npx prisma migrate dev       # Create and apply a migration
npx prisma studio            # Visual DB browser
```

**Seeding:**
```bash
npx prisma db seed           # Runs seed files in prisma/
```

The knowledge graph seed (`seed-knowledge-graph.ts`) loads 19 concepts with prerequisite links used by the ZPD engine.

---

## Deployment

### Vercel Configuration (`vercel.json`)
- Region: `iad1` (Virginia)
- Function timeouts: `api/chat` = 60s, `api/chat/async` = 60s, Stripe webhooks = 30s
- Cron job: `GET /api/cron/purge-data` runs daily at 3 AM UTC

### Stripe Setup (Required for Subscriptions)
Three active paid tiers plus Free:
- **Free** — unlimited messages; limited features (`hasLearningPath: false`, `hasTranscripts: false`)
- **Student** — $2.99/mo or $32.29/yr, 1 student, learning path + journal
- **Parent** — $9.99/mo or $107.89/yr, 5 students, parent dashboard + transcripts
- **Teacher** — $29.99/mo or $323.89/yr, 40 students, full feature set
- **Extra Student** add-on — $2.99/mo (additional students beyond tier limit)

> **Note:** A `FAMILY` tier exists in the `SubscriptionTier` Prisma enum but is **not currently active** in the billing or webhook code. Do not implement features gated on `FAMILY` without first activating it in `src/lib/stripe.ts` and the webhook handler.

The tier limits are defined in `TIER_LIMITS` in `src/lib/stripe.ts`. The webhook handler (`src/app/api/stripe/webhook/route.ts`) uses `getTierFromPriceId()` to map Stripe price IDs to `STUDENT | PARENT | TEACHER` on both checkout and subscription updates.

Webhook events to configure: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### Post-Deploy Checklist
1. Set all env vars in Vercel project settings
2. Run `npx prisma db push` against production DB
3. Create Stripe products and add price IDs to env vars
4. Add Stripe webhook pointing to `https://your-domain/api/stripe/webhook`
5. Set `NEXT_PUBLIC_APP_URL` to production URL
6. Verify PostHog key if analytics needed

---

## Adeline's Pedagogical Constraints

When working on AI response generation, these rules from `adeline.config.toml` are non-negotiable:

1. **No passive endings** — never end with "How can I help you?" — Adeline initiates and demands action
2. **Single thread, immediate action** — pick ONE interest thread and drive to ONE physical action today
3. **No invented projects** — the homestead IS the classroom; ask what's actually happening, then build the lesson
4. **Always connect to credits** — remind the student how this activity earns transcript credits
5. **Science experiments use household items only** — water, vinegar, baking soda, etc. Never suggest purchasing equipment
6. **Investigation responses use Claude 3.5 Sonnet** — route via model routing rules in LangGraph

---

## Additional Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `QUICK-START.md` | 30-minute setup guide |
| `ADELINE-CONTEXT.md` | Full tech stack + chat pipeline handoff doc |
| `ROADMAP.md` | Full architecture and implementation roadmap |
| `TESTING_GUIDE.md` | Detailed testing patterns and instructions |
| `DATABASE-SETUP.md` | Database initialization guide |
| `PRODUCTION-DEPLOYMENT.md` | Production setup (Stripe, monitoring, etc.) |
| `SYSTEMIC_JUSTICE_INTEGRATION.md` | Teaching "follow the money" curriculum guide |
| `docs/plans/` | Monthly implementation planning documents |
