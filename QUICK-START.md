# Quick Start — Dear Adeline

Get Dear Adeline running in production in **under 30 minutes**.

---

## What You'll Need

Before starting, sign up for these free services:

1. **Supabase** (database + auth): https://supabase.com
2. **Upstash** (Redis cache): https://upstash.com  
3. **OpenAI** (AI): https://platform.openai.com
4. **Vercel** (hosting): https://vercel.com

---

## Step 1: Get Your Credentials (15 min)

### Supabase Setup
1. Create new project at https://supabase.com
2. Wait for database to initialize (~2 min)
3. Go to **Settings → Database**:
   - Copy **Connection Pooling** string (port 6543) → save as `DATABASE_URL`
   - Change port from `6543` to `5432` in the URL → save as `DIRECT_DATABASE_URL`
4. Go to **Settings → API**:
   - Copy **URL** → save as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → save as `SUPABASE_SERVICE_ROLE_KEY`

### Upstash Setup
1. Create database at https://console.upstash.com/redis
2. Copy **REST URL** → save as `UPSTASH_REDIS_REST_URL`
3. Copy **REST Token** → save as `UPSTASH_REDIS_REST_TOKEN`

### OpenAI Setup
1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Copy key → save as `OPENAI_API_KEY`
4. Add $5+ credits at https://platform.openai.com/settings/organization/billing

### Generate Secrets
Run this command **3 times** to generate random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```
Save the three outputs as:
- `CRON_SECRET`
- `APP_ENCRYPTION_KEY`
- `SESSION_SECRET`

---

## Step 2: Local Setup (5 min)

### Install dependencies
```bash
npm install
```

### Create `.env` file
```bash
cp .env.example .env
```

### Edit `.env` and paste your credentials
Open `.env` in your editor and fill in these **required** values:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase Database
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://YOUR-DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXiv...

# Secrets (from crypto command above)
CRON_SECRET=<48-char-hex>
APP_ENCRYPTION_KEY=<48-char-hex>
SESSION_SECRET=<48-char-hex>

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Validate everything works
```bash
npm run validate
```

**This must show all ✅ checks passing.** If any fail, double-check your credentials.

### Initialize database
```bash
npm run setup
```

This pushes the database schema and seeds initial data.

---

## Step 3: Test Locally (3 min)

### Start dev server
```bash
npm run dev
```

### Test in browser
1. Open http://localhost:3000
2. Click **Sign Up** and create an account
3. Verify you receive a confirmation email
4. Confirm your email and log in
5. Send a chat message to Adeline
6. Verify you get an AI response

### Check health
Open http://localhost:3000/api/health

You should see:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "openai": { "status": "ok" },
    "supabase": { "status": "ok" }
  }
}
```

---

## Step 4: Deploy to Vercel (7 min)

### Install Vercel CLI
```bash
npm i -g vercel
```

### Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → dear-adeline (or your choice)
- **Directory?** → `./` (press Enter)
- **Override settings?** → No

### Add environment variables to Vercel

Go to your Vercel dashboard → Project → **Settings → Environment Variables**

Add **all** the variables from your `.env` file (copy-paste each one).

**Important:** Set them for **Production**, **Preview**, and **Development** environments.

### Update Supabase redirect URL

1. Copy your Vercel deployment URL (e.g., `https://dear-adeline.vercel.app`)
2. Go to Supabase → **Authentication → URL Configuration**
3. Set **Site URL** to your Vercel URL
4. Add to **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

### Redeploy with environment variables
```bash
vercel --prod
```

### Verify production deployment

1. Visit your Vercel URL
2. Check health: `https://your-domain.vercel.app/api/health`
3. Create an account and test chat

---

## ✅ You're Done!

Your production-ready AI tutor is now live.

### Next Steps

- **Add Stripe payments** (optional): See `PRODUCTION-DEPLOYMENT.md`
- **Monitor health**: Bookmark `/api/health` endpoint
- **Review logs**: Check Vercel dashboard for errors
- **Set up analytics**: Add PostHog key (optional)

### Common Issues

**"Redis configuration missing"**
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel

**"Supabase configuration missing"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel
- Check Supabase project is active (not paused)

**"OpenAI API error"**
- Verify you have credits: https://platform.openai.com/usage
- Check API key is valid

**Database connection errors**
- Verify `DATABASE_URL` uses port **6543** (pooler)
- Verify `DIRECT_DATABASE_URL` uses port **5432** (direct)

### Get Help

Run validation locally:
```bash
npm run validate
```

Check production health:
```bash
curl https://your-domain.vercel.app/api/health
```

For detailed troubleshooting, see `PRODUCTION-DEPLOYMENT.md`.
