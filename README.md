# Dear Adeline

**Interest-led AI learning companion for Christian homeschool families.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Famberdawn84ac-bot%2Fcascade-adeline&env=OPENAI_API_KEY,DATABASE_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET&envDescription=API%20keys%20needed%20for%20Dear%20Adeline&envLink=https%3A%2F%2Fgithub.com%2Famberdawn84ac-bot%2Fcascade-adeline%23environment-variables&project-name=dear-adeline)

Adeline is a wise, discerning mentor who turns everyday life into meaningful education. She logs real-world activities for credits, suggests projects in the student's Zone of Proximal Development, prompts metacognitive reflection, and gently teaches discernment ("follow the money") — all with a beautiful sketchnote aesthetic and no busywork.

Built with love for homeschool moms and kids who learn by doing.

## Features

### Learning Engine
- **LifeCreditLogger**: "I baked bread" → auto-credits + reflection prompt
- **ZPD Engine**: Suggests projects exactly where the child is ready to grow
- **Discernment Engine**: Biblical "follow the money" investigations
- **Snap-to-Log**: Photo upload → vision analysis → credits
- **Spaced Repetition + Reflection**: Built-in SM-2 and metacognition
- **Generative UI**: Transcript cards, investigation boards, etc.

### Revenue & Growth (GTM)
- **4-Tier Pricing**: Free → $2.99 Student → $19 Parent → $29 Family
- **Stripe Subscriptions**: Checkout, webhooks, customer portal
- **Message Limits**: 10/mo free, unlimited paid
- **Clubs**: Subject-based learning communities (paid tier gated)
- **Referral System**: $10/$10 give/get with cookie-based attribution
- **SEO Landing Page**: Hero, testimonials, FAQ, conversion-optimized
- **PostHog Analytics**: 20+ tracked events across the funnel

### Safety & Compliance
- **PII Masking**: 8 PII types redacted before LLM calls
- **Content Moderation**: Regex + OpenAI Moderation API
- **COPPA Consent**: Parent-gated data controls

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 16 (App Router)             |
| AI             | Vercel AI SDK v6 + LangGraph        |
| Models         | GPT-4o (default), Claude 3, Gemini  |
| DB             | Supabase Postgres + pgvector        |
| Cache          | Upstash Redis                       |
| Payments       | Stripe (subscriptions + webhooks)   |
| Analytics      | PostHog                             |
| ORM            | Prisma 7                            |
| Deploy         | Vercel                              |

See [ROADMAP.md](ROADMAP.md) for full architecture and implementation details.

## Testing

### Unit Tests

```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test -- --coverage # With coverage
```

### E2E Tests

```bash
npm run test:e2e          # Headless (CI mode)
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # See browser
```

### All Tests

```bash
npm run test:all          # Unit + E2E
```

### Performance Benchmarks

```bash
npm run test:e2e -- e2e/specs/performance.spec.ts
npm run bundlewatch       # Check bundle sizes
```

## CI/CD

All tests run automatically on pull requests:

- ✅ Unit tests with coverage
- ✅ E2E tests (3 browsers: Chrome, Firefox, Safari)
- ✅ TypeScript type checking
- ✅ ESLint
- ✅ Lighthouse audits (Performance >90, A11y >95)
- ✅ Prisma schema validation
- ✅ Bundle size monitoring

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

## Environment Variables

See [`.env.example`](.env.example) for the full list with comments. Summary:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key (LLM + embeddings + vision) |
| `DATABASE_URL` | ✅ | Supabase PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app URL (e.g. `https://dear-adeline.vercel.app`) |
| `ANTHROPIC_API_KEY` | — | Claude 3 for investigations |
| `GOOGLE_API_KEY` | — | Gemini alternative provider |
| `TAVILY_API_KEY` | — | Web search for discernment |
| `NEXT_PUBLIC_POSTHOG_KEY` | — | PostHog analytics |
| `STRIPE_PRICE_*` | — | Stripe price IDs (6 total) |

## Deploy to Vercel

### One-Click Deploy

Click the button at the top of this README, or:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Famberdawn84ac-bot%2Fcascade-adeline&env=OPENAI_API_KEY,DATABASE_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET&envDescription=API%20keys%20needed%20for%20Dear%20Adeline&envLink=https%3A%2F%2Fgithub.com%2Famberdawn84ac-bot%2Fcascade-adeline%23environment-variables&project-name=dear-adeline)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Post-Deploy Checklist

1. **Set all env vars** in Vercel → Project → Settings → Environment Variables
2. **Run DB migration**: `npx prisma db push` (or use Vercel's build command)
3. **Create Stripe products** in the Dashboard:
   - Student: $2.99/mo, $28.80/yr
   - Parent: $19/mo, $182.40/yr
   - Family: $29/mo, $278.40/yr
4. **Add Stripe webhook** pointing to `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. **Set `NEXT_PUBLIC_APP_URL`** to your production URL
6. **Configure PostHog** (optional) — add project key to env vars
