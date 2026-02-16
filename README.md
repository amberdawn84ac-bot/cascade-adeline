# Dear Adeline

**Interest-led AI learning companion for Christian homeschool families.**

Adeline is a wise, discerning mentor who turns everyday life into meaningful education. She logs real-world activities for credits, suggests projects in the student's Zone of Proximal Development, prompts metacognitive reflection, and gently teaches discernment ("follow the money") — all with a beautiful sketchnote aesthetic and no busywork.

Built with love for homeschool moms and kids who learn by doing.

![Adeline in action](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Adeline+Chat+Screenshot)  
*(Replace with real screenshots once deployed)*

## Features

- **LifeCreditLogger**: "I baked bread" → auto-credits + reflection prompt
- **ZPD Engine**: Suggests projects exactly where the child is ready to grow
- **Discernment Engine**: Biblical "follow the money" investigations
- **Snap-to-Log**: Photo upload → vision analysis → credits
- **Spaced Repetition + Reflection**: Built-in SM-2 and metacognition
- **Generative UI**: Transcript cards, investigation boards, etc.
- **Safety first**: PII masking, moderation, COPPA consent

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 16 (App Router)             |
| AI             | Vercel AI SDK v6 + LangGraph        |
| Models         | GPT-4o (default), Claude 3, Gemini  |
| DB             | Supabase Postgres + pgvector        |
| Cache          | Upstash Redis                       |
| ORM            | Prisma 7                            |

See [ROADMAP.md](ROADMAP.md) for full architecture and implementation details.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/amberdawn84ac-bot/cascade-adeline.git
cd cascade-adeline

# 2. Setup
npm install
cp .env.example .env
# Edit .env (at minimum: OPENAI_API_KEY, SUPABASE_URL, etc.)

# 3. Database + seed
npm run setup

# 4. Run
npm run dev
```
