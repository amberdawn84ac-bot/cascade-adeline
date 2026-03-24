# Deployment Guide - Dear Adeline

This guide covers deploying Dear Adeline to production environments.

---

## 📋 Prerequisites

### Required Services
- **Vercel** or **Netlify** account (for hosting)
- **Supabase** project (for authentication and database)
- **Upstash Redis** instance (for caching and rate limiting)
- **OpenAI** API key (for AI features)
- **Stripe** account (for payments)
- **Resend** account (for transactional emails)

### Required Tools
- Node.js 20.x or higher
- npm or yarn
- Git

---

## 🔐 Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Redis
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@dearadeline.app"

# App
NEXT_PUBLIC_APP_URL="https://dearadeline.app"
SESSION_SECRET="generate-a-secure-random-string-here"
CRON_SECRET="generate-another-secure-random-string"

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### Generating Secrets

```bash
# Generate secure random strings for SESSION_SECRET and CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Link Project

```bash
vercel link
```

### 3. Set Environment Variables

```bash
# Set all environment variables
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... repeat for all variables
```

Or use the Vercel dashboard to add environment variables.

### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if GitHub integration is set up)
git push origin main
```

### 5. Set Up Domains

1. Go to Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

---

## 🗄️ Database Setup

### 1. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### 2. Seed Initial Data (Optional)

```bash
npx tsx scripts/seed.ts
```

### 3. Set Up Database Indexes

The following indexes are automatically created by Prisma:
- `TranscriptEntry.dateCompleted`
- `TranscriptEntry.userId_dateCompleted`
- `User.email`
- `ConversationMemory.userId_sessionId`

Verify indexes are created:
```sql
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

---

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. **On Pull Request**:
   - Runs linting
   - Runs unit tests
   - Builds the application
   - Runs E2E tests
   - Performs security audit

2. **On Push to `develop`**:
   - Deploys to staging environment

3. **On Push to `main`**:
   - Deploys to production environment

### Setting Up GitHub Secrets

Add these secrets to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

Required secrets:
- `VERCEL_TOKEN` - Vercel deployment token
- `NEXT_PUBLIC_SUPABASE_URL` - For build process
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For build process
- `DATABASE_URL` - For build process

---

## 📊 Monitoring & Logging

### Health Check Endpoint

Monitor application health:
```bash
curl https://dearadeline.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-24T12:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "openai": "healthy",
    "supabase": "healthy"
  }
}
```

### Log Aggregation

Logs are automatically sent to Vercel's logging system. Access them via:
```bash
vercel logs --follow
```

For production monitoring, consider integrating:
- **Sentry** for error tracking
- **DataDog** for APM and logs
- **PostHog** for analytics (already integrated)

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] All environment variables are set in production
- [ ] `SESSION_SECRET` and `CRON_SECRET` are unique and secure
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Stripe webhook secret is configured
- [ ] Rate limiting is enabled (Redis required)
- [ ] Debug endpoints are disabled in production
- [ ] CORS is properly configured
- [ ] Content Security Policy headers are set
- [ ] All API keys are stored as secrets (not in code)

---

## 🔄 Rollback Strategy

### Quick Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 📈 Performance Optimization

### Enable Caching

1. **Redis Caching**: Already configured for student context (30min TTL)
2. **CDN**: Vercel automatically serves static assets via CDN
3. **Image Optimization**: Configured in `next.config.ts` (AVIF/WebP)

### Monitor Performance

```bash
# Run Lighthouse CI
npm run lighthouse

# Check bundle size
npm run bundlewatch
```

---

## 🆘 Troubleshooting

### Build Failures

**Issue**: Build fails with "Cannot find module"
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

**Issue**: Prisma client not generated
```bash
npx prisma generate
```

### Runtime Errors

**Issue**: "Unauthorized" errors
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify `SESSION_SECRET` is configured

**Issue**: Rate limiting not working
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check Redis connection in health endpoint

**Issue**: Database connection errors
- Verify `DATABASE_URL` includes `?pgbouncer=true&connection_limit=1`
- Check database is accessible from Vercel's IP range

---

## 📞 Support

For deployment issues:
1. Check health endpoint: `/api/health`
2. Review Vercel logs: `vercel logs`
3. Check GitHub Actions workflow runs
4. Review error tracking in Sentry (if configured)

---

## 🔄 Update Process

### Deploying Updates

1. Create feature branch
2. Make changes and commit
3. Push and create pull request
4. CI/CD runs tests automatically
5. Merge to `develop` for staging deployment
6. Merge to `main` for production deployment

### Database Schema Changes

```bash
# Create migration
npx prisma migrate dev --name description-of-change

# Deploy to production
npx prisma migrate deploy
```

---

## 📝 Post-Deployment Checklist

After deploying to production:

- [ ] Verify health endpoint returns healthy status
- [ ] Test authentication flow (login/signup)
- [ ] Verify lesson generation works
- [ ] Check transcript entries are being created
- [ ] Test payment flow (if applicable)
- [ ] Verify email sending works
- [ ] Check error tracking is capturing errors
- [ ] Monitor performance metrics
- [ ] Review logs for any errors
- [ ] Test on multiple devices/browsers

---

**Last Updated**: March 24, 2026  
**Version**: 1.0.0
