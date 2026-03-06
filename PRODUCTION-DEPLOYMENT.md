# Production Deployment Guide — Dear Adeline

This guide ensures **everything works correctly** in production. Follow these steps in order.

---

## Prerequisites

You need accounts and credentials for these services:

### 1. **Supabase** (Database + Auth)
- Create project: https://supabase.com
- Go to **Settings → Database**
  - Copy **Connection Pooling** URL (port 6543) → `DATABASE_URL`
  - Copy **Direct Connection** URL (port 5432) → `DIRECT_DATABASE_URL`
- Go to **Settings → API**
  - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. **Upstash Redis** (Caching + Rate Limiting)
- Create database: https://upstash.com
- Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
- Copy **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

### 3. **OpenAI** (LLM + Embeddings)
- Get API key: https://platform.openai.com/api-keys
- Copy key → `OPENAI_API_KEY`

### 4. **Generate Secrets**
Run this command to generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```
- Run twice, use outputs for:
  - `APP_ENCRYPTION_KEY`
  - `SESSION_SECRET`
  - `CRON_SECRET`

### 5. **Stripe** (Optional - for payments)
- Dashboard: https://dashboard.stripe.com
- Get **Secret Key** → `STRIPE_SECRET_KEY`
- Get **Publishable Key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Create webhook endpoint, get **Webhook Secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 1: Local Environment Setup

### 1.1 Create `.env` file
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 1.2 Fill in all required values
Edit `.env` and add the credentials from Prerequisites above.

**Required variables:**
```env
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://YOUR-DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXiv...
CRON_SECRET=<48-char-hex-from-crypto>
APP_ENCRYPTION_KEY=<48-char-hex-from-crypto>
SESSION_SECRET=<48-char-hex-from-crypto>
```

### 1.3 Validate environment
Run the validation script to ensure all services are reachable:
```bash
npx tsx scripts/validate-env.ts
```

**This must pass 100% before proceeding.** Fix any failures.

### 1.4 Run setup script
Initialize the database and seed data:
```bash
npm run setup
```

This will:
- Push Prisma schema to database
- Generate Prisma client
- Seed knowledge graph

---

## Step 2: Local Testing

### 2.1 Run development server
```bash
npm run dev
```

### 2.2 Test critical flows
- Visit http://localhost:3000
- Create an account (tests Supabase auth)
- Send a chat message (tests OpenAI + Redis + DB)
- Check http://localhost:3000/api/health (all checks should be "ok")

### 2.3 Run tests
```bash
npm run test
npm run test:e2e
```

Fix any failures before deploying.

---

## Step 3: Vercel Deployment

### 3.1 Install Vercel CLI (if needed)
```bash
npm i -g vercel
```

### 3.2 Link project
```bash
vercel link
```

### 3.3 Set environment variables in Vercel
Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add **all** variables from your `.env` file for **Production** environment:

**Critical variables (must be set):**
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`
- `APP_ENCRYPTION_KEY`
- `SESSION_SECRET`

**Optional (for full features):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `TAVILY_API_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`

### 3.4 Deploy
```bash
vercel --prod
```

### 3.5 Verify deployment
After deployment completes:

1. **Check health endpoint:**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```
   All checks should return `"status": "ok"`

2. **Test authentication:**
   - Visit your production URL
   - Create an account
   - Verify email works

3. **Test chat:**
   - Send a message
   - Verify AI responds correctly

4. **Check Vercel logs:**
   - Go to Vercel Dashboard → Deployments → Latest → Logs
   - Look for any errors

---

## Step 4: Post-Deployment Configuration

### 4.1 Configure Supabase redirect URLs
In Supabase Dashboard → Authentication → URL Configuration:
- Add your production URL to **Site URL**
- Add to **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

### 4.2 Configure Stripe webhooks (if using payments)
In Stripe Dashboard → Webhooks:
- Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
- Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Copy webhook signing secret → Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 4.3 Set up monitoring
- Monitor `/api/health` endpoint (should return 200)
- Set up Vercel alerts for function errors
- Monitor Supabase database connections

---

## Troubleshooting

### Build fails with "Missing environment variable"
- Ensure all required env vars are set in Vercel
- Check for typos in variable names
- Verify values don't contain placeholder text

### "Redis configuration missing" error
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Test Redis connection: `npx tsx scripts/validate-env.ts`

### "Supabase configuration missing" error
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase project is active (not paused)

### Database connection errors
- Verify `DATABASE_URL` uses port **6543** (pooler)
- Verify `DIRECT_DATABASE_URL` uses port **5432** (direct)
- Check Supabase project hasn't paused (free tier pauses after 7 days inactivity)

### OpenAI API errors
- Verify `OPENAI_API_KEY` is valid
- Check you have credits: https://platform.openai.com/usage
- Ensure key starts with `sk-proj-` or `sk-`

---

## Health Checks

### Local validation
```bash
npx tsx scripts/validate-env.ts
```

### Production health check
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-06T18:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "database": { "status": "ok", "latency": 45 },
    "redis": { "status": "ok", "latency": 23 },
    "openai": { "status": "ok", "latency": 156 },
    "supabase": { "status": "ok", "message": "Configured" }
  }
}
```

---

## Security Checklist

- [ ] All secrets are at least 32 characters
- [ ] `CRON_SECRET` is set (protects cron endpoints)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret (never exposed to client)
- [ ] Stripe webhook secret is configured
- [ ] Supabase RLS policies are enabled
- [ ] Environment variables are set in Vercel (not hardcoded)

---

## Support

If you encounter issues:
1. Check `/api/health` endpoint for service status
2. Review Vercel deployment logs
3. Run `npx tsx scripts/validate-env.ts` locally
4. Verify all environment variables are set correctly
