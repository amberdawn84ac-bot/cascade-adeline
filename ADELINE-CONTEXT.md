# ADELINE — Context Handoff for Claude CLI

## What This Is

Dear Adeline is an AI-powered educational discovery engine for K-12 Christian homeschool families. It was built over Phases 1-7 using Windsurf Cascade, with architecture review by Claude (me) at every checkpoint.

The app is built and running locally. The immediate problem is: **Adeline returns an error when you try to chat with her.** That needs to be debugged first.

---

## Tech Stack

- **Framework:** Next.js 15, App Router, TypeScript, Tailwind CSS, src/ directory
- **Database:** Supabase (PostgreSQL + pgvector extension)
- **Cache:** Upstash Redis
- **ORM:** Prisma
- **AI Orchestration:** LangGraph (custom workflow, NOT LangChain agents)
- **AI Models:** Gemini Flash (default), Claude/Anthropic (investigation), GPT-4o (deep analysis)
- **Embeddings:** Google text-embedding-004 (768 dimensions)
- **Streaming:** Vercel AI SDK (useChat + streamText + StreamData)
- **PDF Export:** @react-pdf/renderer
- **Auth:** Supabase Auth via @supabase/ssr

---

## Project Structure

```
dear-adeline/
├── adeline.config.toml          # Adeline's soul — persona, pedagogy, model routing, UI config
├── prisma/
│   ├── schema.prisma             # Full schema with indexes
│   └── migrations/
│       └── add_pgvector_index.sql
├── src/
│   ├── middleware.ts              # Auth redirect for protected routes
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── login/page.tsx         # Placeholder login
│   │   └── (routes)/
│   │       ├── chat/page.tsx      # Student chat (useChat + SketchnoteRenderer)
│   │       ├── parent/page.tsx    # Parent dashboard
│   │       └── library/page.tsx   # Hippocampus upload + browse
│   │   └── api/
│   │       ├── chat/route.ts      # MAIN: streaming chat with LangGraph pipeline
│   │       ├── hippocampus/
│   │       │   ├── upload/route.ts  # PDF → chunk → embed → pgvector store
│   │       │   ├── search/route.ts  # Vector similarity search
│   │       │   └── list/route.ts    # List all docs
│   │       ├── transcript/
│   │       │   ├── route.ts         # Filtered transcript JSON
│   │       │   └── export/route.ts  # State-compliance PDF
│   │       └── clubs/
│   │           ├── route.ts         # Club CRUD
│   │           └── [id]/join/route.ts
│   ├── lib/
│   │   ├── config.ts              # Loads adeline.config.toml, builds system prompt
│   │   ├── db.ts                  # Prisma client
│   │   ├── redis.ts               # Upstash client
│   │   ├── auth.ts                # getSessionUser() helper
│   │   └── langgraph/
│   │       ├── types.ts           # Shared state: AdelineGraphState, intents, types
│   │       ├── router.ts          # LLM intent classification + model selection
│   │       ├── lifeCreditLogger.ts # "I baked bread" → Chemistry credit (LLM matching)
│   │       ├── discernmentEngine.ts # pgvector RAG + Claude for investigations
│   │       ├── projectBrainstormer.ts # Project planning + gentle service suggestions
│   │       ├── genUIPlanner.ts    # Picks which UI component to render
│   │       ├── opportunityScout.ts # Queries opportunities by student interests
│   │       └── gapDetector.ts     # Analyzes transcript gaps
│   ├── components/
│   │   ├── illustrations/         # 30+ clean SVG line art components
│   │   ├── sketchnote/
│   │   │   ├── SketchnoteRenderer.tsx  # Life-of-Fred varied typography renderer
│   │   │   ├── CalloutBox.tsx
│   │   │   ├── HighlightSpan.tsx
│   │   │   └── ScriptureNote.tsx
│   │   ├── gen-ui/
│   │   │   ├── TranscriptCard.tsx
│   │   │   ├── InvestigationBoard.tsx
│   │   │   ├── ProjectImpactCard.tsx
│   │   │   └── MissionBriefing.tsx
│   │   └── library/
│   │       └── LibraryClient.tsx
│   └── types/
│       └── modules.d.ts           # Type declarations for untyped packages
├── package.json
└── .env                           # API keys (Supabase, Upstash, Gemini, OpenAI, Anthropic)
```

---

## How the Chat Pipeline Works

When a user sends a message to `/api/chat`:

1. **Rate limit check** (Redis, 30/min per user)
2. **Load config** from adeline.config.toml
3. **Load conversation memory** (last 10 messages from Redis, fallback Postgres)
4. **Build system prompt** from config + student context
5. **Run LangGraph pipeline:**
   - **Router** → LLM classifies intent (CHAT, LIFE_LOG, BRAINSTORM, INVESTIGATE, GEN_UI, OPPORTUNITY) + selects model (Gemini/Claude/GPT-4o)
   - **Intent-specific node** runs (e.g., LifeCreditLogger for LIFE_LOG, DiscernmentEngine for INVESTIGATE)
   - **GenUIPlanner** → decides if a UI component should render (TranscriptCard, InvestigationBoard, etc.)
   - **GapDetector** → checks for learning gaps to nudge
6. **Stream response** via Vercel AI SDK's streamText + StreamData (carries genUIPayload)
7. **Save conversation** to Redis cache + ConversationMemory table

All LangGraph nodes are wrapped in try/catch (safeNode pattern) — if one fails, the pipeline continues gracefully.

---

## The Chat Error

The app runs, landing page works, chat page loads, but **when you send a message to Adeline, an error occurs.** The specific error has not been captured yet.

### Debugging Steps

1. **Check the terminal** running `npm run dev` for the server-side error
2. **Check browser console** (F12 → Console) for client-side errors
3. Common failure points:
   - **API keys not set** in .env (GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
   - **Prisma client not generated** (run `npx prisma generate`)
   - **Database tables don't exist** (run `npx prisma db push`)
   - **pgvector extension not enabled** in Supabase
   - **Router node fails** because Gemini model ID in config doesn't match AI SDK expected format
   - **Config loader fails** because adeline.config.toml has a parsing error
   - **Import path errors** (@/ alias not resolving, or relative vs absolute path mismatch)
   - **StreamData / toDataStreamResponse typing issues** — there are ts-ignore comments in the chat route

### Key Environment Variables Needed

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
GOOGLE_GENERATIVE_AI_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Debugging Progress (Claude Code Session — Feb 2026)

### Issues Found & Fixed ✅

1. **Missing lightningcss native binary**
   - **Symptom:** Tailwind CSS compilation failing
   - **Fix:** Installed `lightningcss@^1.31.1` in package.json
   - **Status:** ✅ Confirmed in package.json

2. **Incorrect Prisma client import path**
   - **Symptom:** `Cannot find module '@prisma/client'` errors
   - **Fix:** Changed import in `src/lib/db.ts` from `@prisma/client` to `../generated/prisma`
   - **Status:** ✅ Confirmed in db.ts line 1
   - **Location:** Generated client at `/src/generated/prisma/`

3. **Missing gradeLevel field on User model**
   - **Symptom:** Type errors when accessing user.gradeLevel
   - **Fix:** Added `gradeLevel String? @map("grade_level")` to both User and Student models in schema.prisma
   - **Status:** ✅ Confirmed in schema.prisma lines 83, 189

4. **Missing @supabase/ssr package**
   - **Symptom:** `Cannot find module '@supabase/ssr'` in auth helpers
   - **Fix:** Installed `@supabase/ssr@^0.8.0`
   - **Status:** ✅ Confirmed in package.json

5. **AI SDK v6 StreamData API changes**
   - **Symptom:** `createDataStreamResponse` is not a function (API changed in v6)
   - **Fix:** Updated chat route to use `streamText().toUIMessageStreamResponse()` instead
   - **Status:** ✅ Confirmed in chat route line 215

### Current State

- **Server:** Should start without import/dependency errors
- **Database:** Schema includes gradeLevel field, Prisma client generated
- **Streaming:** Uses AI SDK v6 compatible API

### ⚠️ Critical Issue Remaining: genUIPayload Not Streaming

**Problem:** The `genUIPayload` computed by genUIPlanner (line 136 in chat route) is NOT being sent to the client. It's only saved to the database (line 203) but never streamed via StreamData.

**Impact:** Generative UI components (TranscriptCard, InvestigationBoard, ProjectImpactCard, MissionBriefing) will never render because the frontend never receives the genUIPayload data.

**Location:** `/src/app/api/chat/route.ts:215`

**Current code:**
```typescript
return result.toUIMessageStreamResponse();
```

**What's missing:** The genUIPayload needs to be attached to the stream response. In AI SDK v6, this typically requires using `experimental_streamData` or wrapping the response with data annotations.

### Next Steps

1. **Clear Turbopack cache:** `rm -rf .next && npm run dev` (stubborn cache from previous errors)
2. **Fix genUIPayload streaming:** Update chat route to send genUIPayload to client
3. **Test basic chat:** Verify Adeline responds to simple messages
4. **Test genUI triggers:**
   - "I baked bread today" → should trigger TranscriptCard
   - "Who profits from Common Core" → should trigger InvestigationBoard with Claude
5. **UI fixes:** Landing page headline size, features grid centering

### Environment Checklist

Before testing, verify these environment variables are set in `.env`:

- ✅ `DATABASE_URL` (Supabase PostgreSQL connection string)
- ✅ `DIRECT_URL` (Direct Supabase connection for migrations)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `UPSTASH_REDIS_REST_URL`
- ✅ `UPSTASH_REDIS_REST_TOKEN`
- ✅ `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini Flash - default model)
- ✅ `OPENAI_API_KEY` (GPT-4o - deep analysis)
- ✅ `ANTHROPIC_API_KEY` (Claude - investigation mode)

### Known Working State

- Dependencies installed correctly
- Prisma client generated at custom path
- Schema includes all required fields
- Chat route uses AI SDK v6 compatible methods
- LangGraph pipeline intact (router → nodes → genUIPlanner → gapDetector)

---

## What NOT to Do

- Do NOT rebuild or restructure the project
- Do NOT switch from Prisma to Drizzle
- Do NOT switch from pgvector to Pinecone
- Do NOT add Neo4j
- Do NOT change the color palette or fonts
- Do NOT change Adeline's persona/voice
- Do NOT use Rough.js for any illustrations
- Do NOT remove the service-learning suggestions (but they are invitations, NOT gates — kids can build things for fun)

---

## Visual System

- **Sketchnote aesthetic:** Adeline's educational responses render with varied fonts, sizes, and colors within a single response (Life of Fred style)
- **Fonts:** Emily's Candy (headers), Kranky (playful), Kalam (handwriting body), Permanent Marker (emphasis), Swanky and Moo Moo (body alt)
- **Colors with meaning:** Papaya #BD6809 (vocab/key terms), Paradise #9A3F4A (scripture), Palm Frond #2F4731 (nature/science), Fuschia #3D1419 (investigation), Vervain #121B13 (body text), Cream #FFFEF7 (backgrounds)
- **SVG illustrations:** Clean single-stroke line art, botanical/farm/learning motifs, no Rough.js wobble

---

## Immediate Priority

1. **Debug the chat error** — get Adeline responding
2. **Fix landing page** — hero headline too small (needs text-7xl mobile, text-9xl desktop)
3. **Fix features grid** — cards need centered content
4. After chat works: test "I baked bread today" (should trigger TranscriptCard) and "who profits from Common Core" (should trigger Claude investigation mode)
