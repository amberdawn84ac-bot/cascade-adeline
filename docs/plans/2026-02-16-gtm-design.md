# Go-To-Market Strategy Design

**Date:** 2026-02-16
**Status:** Approved
**Timeline:** 1-2 weeks

## Goal

Launch revenue-generating features to acquire first 100-1000 paying customers through freemium model, viral club features, and optimized conversion funnels.

## Strategy Summary

**Pricing:** 4-tier freemium (Free → $2.99 Student → $19 Parent → $29 Family)
**Growth Engine:** Subject-based clubs with user-generated content (#DearAdeline)
**Lead Capture:** 7-day demo accounts (no credit card)
**Monetization:** Stripe subscriptions with annual discounts
**Viral Loop:** $10/$10 referral credits
**Conversion:** SEO-optimized landing page + analytics tracking

---

## 1. Pricing Tiers

### Free - "Try It" Tier
- 10 messages per month (resets monthly)
- 1 student profile
- All intents (LIFE_LOG, INVESTIGATE, BRAINSTORM, REFLECT)
- All GenUI components
- Chat history (7 days)
- Can join clubs
- Playground unlimited (no login)

### $2.99/mo - "Student" Tier
- **Unlimited messages**
- 1 student profile
- Full conversation history (90 days)
- Basic highlights
- **Can create clubs** ⭐
- Perfect for: Solo learners

### $19/mo - "Parent" Tier
- Everything in Student, plus:
- **Parent dashboard** with insights
- **Portfolio builder** with artifacts
- 1 student
- Unlimited conversation history
- Learning timeline
- Weekly progress emails
- Perfect for: Single-child families

### $29/mo - "Family" Tier 🏆 Most Popular
- Everything in Parent, plus:
- **Up to 6 students**
- **PDF transcript exports** (state-compliant)
- **Advanced highlights** (auto-generated)
- Spaced repetition reviews
- Multi-student insights
- Priority support
- Perfect for: Multi-child families

### Annual Discount
- Student: $28.80/yr (save 20%)
- Parent: $182.40/yr (save 20%)
- Family: $278.40/yr (save 20%)

---

## 2. Clubs as Viral Growth Engine

### Free to Join, Paid to Create

**Free users can:**
- Browse public clubs
- Join unlimited clubs
- Participate in projects
- View shared content
- **Upgrade prompt:** "Start your own club for $2.99/mo"

**Paid users ($2.99+) can:**
- Create clubs
- Invite friends (any tier)
- Set goals and milestones
- Export club projects
- "Club Leader" badge

### Club Types

- 📜 **History Clubhouse** - Collaborative timelines, research
- 🔬 **Science Clubhouse** - Experiment journals, hypothesis testing
- 🎨 **Art Clubhouse** - Portfolios, critique circles
- 💻 **Coding Clubhouse** - Group projects, code sharing
- 📚 **Literature Clubhouse** - Book clubs, creative writing
- 🌍 **Geography Clubhouse** - Map projects
- 🛠️ **Maker Clubhouse** - Building, woodworking, crafts
- 🎵 **Music Clubhouse** - Compositions, practice groups

### Viral Features

**Public Showcase Gallery** (`/showcase`)
- Featured projects from all clubs
- Filter by subject
- Social share buttons
- Embed codes for blogs
- Monthly featured projects on landing page

**Social Sharing**
- One-click share to Twitter, Facebook, Instagram
- Auto-generates beautiful preview cards
- Hashtag: #DearAdeline
- "Built with Dear Adeline" watermark (removable in settings)

**Growth Loop:**
1. Student creates project in club (timeline, experiment video)
2. Shares with #DearAdeline hashtag
3. Friends see → Sign up free
4. Join club, experience value
5. Some upgrade to create own clubs
6. Cycle repeats

---

## 3. Stripe Integration

### Products & Prices

```typescript
Stripe Products:
- Student Monthly: price_student_monthly ($2.99)
- Student Annual: price_student_yearly ($28.80)
- Parent Monthly: price_parent_monthly ($19.00)
- Parent Annual: price_parent_yearly ($182.40)
- Family Monthly: price_family_monthly ($29.00)
- Family Annual: price_family_yearly ($278.40)
```

### Checkout Flow

1. User hits upgrade trigger (paywall, feature gate)
2. Pricing modal appears with tier comparison
3. Click "Upgrade" → Stripe Checkout (hosted)
4. Payment success → Webhook fires
5. Provision access, send welcome email
6. Redirect to `/welcome` with celebration

### Webhooks

Handle these Stripe events:
- `checkout.session.completed` - Provision subscription
- `customer.subscription.updated` - Handle upgrades/downgrades
- `customer.subscription.deleted` - Revert to free tier
- `invoice.payment_succeeded` - Confirm renewal
- `invoice.payment_failed` - Dunning emails (3 attempts)

### Database Schema

```prisma
model Subscription {
  id                   String             @id @default(uuid()) @db.Uuid
  userId               String             @unique @db.Uuid
  user                 User               @relation(fields: [userId], references: [id])
  stripeCustomerId     String             @unique
  stripeSubscriptionId String             @unique
  stripePriceId        String
  tier                 SubscriptionTier
  status               SubscriptionStatus
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}

enum SubscriptionTier {
  FREE
  STUDENT
  PARENT
  FAMILY
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}
```

### Customer Portal

Stripe Customer Portal for:
- View invoices
- Update payment method
- Upgrade/downgrade tiers
- Cancel subscription (with exit survey)

Link from `/settings` → "Manage Billing" button

---

## 4. SEO-Optimized Landing Page

### Target Keywords

**Primary (High Intent):**
- "Christian homeschool AI" (500/mo)
- "homeschool transcript generator" (1.2k/mo)
- "AI homeschool curriculum" (800/mo)
- "interest-led homeschool planning" (300/mo)

**Secondary:**
- "homeschool learning log"
- "biblical worldview education"
- "homeschool portfolio builder"
- "state compliant homeschool transcript"

### Page Structure

**Hero Section:**
```
H1: Turn Everyday Life Into State-Compliant Transcripts with AI
Subhead: Christian homeschool families trust Adeline to track learning,
build portfolios, and create transcripts—automatically.

[Try Free - No Credit Card] [Watch Demo (2 min)]

✓ 1,000+ families  ✓ Biblical worldview  ✓ State-compliant
```

**Social Proof:**
- 6 testimonial cards with photos
- Video testimonial (60s)
- "Featured in Homeschool Mom Podcast"

**Problem/Solution:**
```
H2: The Homeschool Record-Keeping Problem
Body: Manual tracking takes hours. Converting real-life learning into
transcripts is tedious. State compliance is stressful.

H2: How Adeline Solves It
1. Log Naturally - "I baked bread" = Chemistry credit
2. Track Automatically - Transcripts generate themselves
3. Stay Compliant - Meet state requirements
```

**Features Grid:**
- State-Compliant Transcript Builder
- Biblical Discernment Engine
- Interest-Led Learning Plans
- Portfolio & Artifact Library
- Parent Dashboard & Insights
- Subject-Based Learning Clubs

**Public Showcase:**
```
H2: See What Families Are Building with #DearAdeline
Gallery: 6 featured projects
[Explore All Projects]
```

**Pricing Table:**
- 4 tiers, annual toggle
- Feature comparison
- "Most Popular" badge
- [Start Free] CTAs

**FAQ Section:**
- Is Adeline approved by my state?
- How does Biblical worldview work?
- Can I export for college apps?
- Data privacy and COPPA compliance?
- How is this different from planners?

**Technical SEO:**
- Schema markup (Organization, FAQ, Product)
- OpenGraph + Twitter cards
- <2s FCP (already meeting)
- Mobile-first responsive
- Alt text on images
- Internal linking

**Meta Tags:**
```html
<title>AI Homeschool Transcript Builder | Christian Worldview | Dear Adeline</title>
<meta name="description" content="Turn everyday activities into state-compliant
homeschool transcripts. Track learning, build portfolios, and stay organized—all
with a Biblical worldview. Try free.">
```

---

## 5. Email Capture & Demo Accounts

### Strategy: Product-Led Growth

Instead of traditional lead magnets (PDFs), we give demo accounts:

**Demo Account Flow:**
1. Landing page: "Try Adeline Free - No Credit Card"
2. Signup form: Email + Name + Child's Grade
3. Create account with FREE tier (10 msgs/mo)
4. Welcome email with tips to get started
5. **7 days later:** "You've tried Adeline - Ready to upgrade?"

**Email Drip Sequence (7 emails over 14 days):**

**Day 0 - Welcome**
```
Subject: Welcome to Adeline! Here's how to get started 🌾
- Quick video: "Log your first activity"
- Suggested prompts to try
- Link to playground for kids
```

**Day 2 - Feature Highlight**
```
Subject: Did you know? Adeline tracks credits automatically
- Show how LIFE_LOG works
- Example: "I baked bread" → Chemistry credit
- CTA: Log an activity today
```

**Day 4 - Social Proof**
```
Subject: How Sarah (mom of 4) saved 10 hours/week
- Customer testimonial
- Before/after transcript example
- Link to showcase gallery
```

**Day 7 - Upgrade Nudge**
```
Subject: You've used 7 of 10 free messages - Upgrade for $2.99?
- Show usage: "7/10 messages used"
- Upgrade benefits
- Limited-time: "20% off first month"
```

**Day 10 - Clubs Invitation**
```
Subject: Join the Science Clubhouse! (It's free)
- Highlight club feature
- Showcase cool projects
- "Paid users can create clubs too"
```

**Day 12 - Objection Handling**
```
Subject: Common questions about Adeline
- FAQ content
- State compliance info
- Data privacy assurances
```

**Day 14 - Final Push**
```
Subject: Last chance: 20% off any plan
- Urgency: Discount expires tomorrow
- Comparison table
- "Join 1,000+ families"
```

**Email Tool:** ConvertKit or Mailchimp
**Segments:** By tier, by engagement, by upgrade status

---

## 6. Referral Program

### $10 Give, $10 Get

**How It Works:**

1. Paid user gets unique referral link: `adeline.app/r/amber123`
2. Share link with friends (email, social, copy)
3. When friend signs up AND upgrades to paid:
   - Referrer gets $10 account credit
   - Friend gets $10 off first month
4. Credits applied automatically to next invoice

**Referral Dashboard** (`/referrals`)
- Your unique link
- Copy button + social share buttons
- Referral stats: "3 signups, 1 paid, $10 earned"
- Pending credits
- Credit history

**Promotional Materials:**
- Pre-written social posts
- Email template for friends
- "I love Adeline" graphics to share

**Tracking:**
- Cookie-based attribution (30 days)
- Fallback: Email match on signup
- Store referrer in `User.referredBy` field

**Database Schema:**
```prisma
model User {
  referralCode String?  @unique  // e.g., "amber123"
  referredBy   String?  @db.Uuid // Referrer's userId
  credits      Decimal  @default(0) @db.Decimal(10, 2)
}

model Referral {
  id          String   @id @default(uuid()) @db.Uuid
  referrerId  String   @db.Uuid
  referrer    User     @relation("Referrer", fields: [referrerId], references: [id])
  refereeId   String   @db.Uuid
  referee     User     @relation("Referee", fields: [refereeId], references: [id])
  status      ReferralStatus // PENDING, PAID, CREDITED
  creditAmount Decimal @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  paidAt      DateTime?
  creditedAt  DateTime?
}

enum ReferralStatus {
  PENDING
  PAID
  CREDITED
}
```

**Viral Coefficient Target:** 1.5x (every paying customer brings 1.5 signups)

---

## 7. Analytics & Conversion Tracking

### Tool: PostHog (Recommended)

**Why PostHog:**
- Open source, privacy-friendly
- Session replay for debugging UX
- Feature flags for A/B testing
- Funnels, retention, cohorts
- Self-hosted option (COPPA-friendly)

**Alternative:** Mixpanel or Amplitude

### Key Metrics Dashboard

**Acquisition:**
- Landing page visitors
- Signup conversion rate (visitor → signup)
- Source attribution (organic, referral, social)

**Activation:**
- % who send first message
- % who hit 10 message limit (paywall)
- Time to first message

**Conversion Funnel:**
```
Landing Page View → Signup → First Message → 10 Messages → Upgrade
Target: 5% → 30% → 80% → 40% → 15% = 0.72% end-to-end
```

**Feature Engagement:**
- Intent usage: LIFE_LOG, INVESTIGATE, BRAINSTORM, REFLECT
- GenUI renders: TranscriptCard, InvestigationBoard
- Club joins/creates
- Highlight saves
- Dashboard views

**Revenue Metrics:**
- MRR (Monthly Recurring Revenue)
- Churn rate (target: <5%/mo)
- LTV (Lifetime Value, target: $500)
- CAC (Customer Acquisition Cost, target: <$50)
- LTV:CAC ratio (target: >10:1)

**Retention:**
- Day 1, 7, 30 retention rates
- Cohort analysis by signup month
- Resurrection rate (churned → return)

**Referral Metrics:**
- Referral signups
- Referral conversions to paid
- K-factor (viral coefficient)
- Credits issued

### Event Tracking

**Track These Events:**

**Acquisition:**
- `page_view` (landing, pricing, showcase)
- `signup_started`
- `signup_completed`

**Activation:**
- `first_message_sent`
- `intent_triggered` (properties: intent type)
- `genui_rendered` (properties: component type)
- `club_joined`
- `club_created`

**Monetization:**
- `paywall_shown` (properties: trigger)
- `upgrade_clicked` (properties: tier)
- `checkout_started`
- `checkout_completed`
- `subscription_renewed`
- `subscription_canceled`

**Engagement:**
- `message_sent` (daily active user)
- `highlight_saved`
- `dashboard_viewed`
- `transcript_exported`

**Referral:**
- `referral_link_clicked`
- `referral_signup`
- `referral_converted`

### A/B Tests to Run

**Week 1-2:**
- Landing page headline variations
- Pricing table display (monthly vs annual default)
- CTA button text ("Try Free" vs "Start Learning")

**Week 3-4:**
- Paywall modal copy
- Email subject lines (drip sequence)
- Referral incentive amounts ($10 vs $15 vs free month)

**Week 5-6:**
- Onboarding checklist vs no checklist
- Social proof placement
- Pricing tier order (cheapest first vs most popular first)

---

## 8. Success Metrics

### 30-Day Goals

- [ ] 500+ signups
- [ ] 50+ paid conversions (10% conversion rate)
- [ ] $1,500+ MRR
- [ ] <5% churn
- [ ] 20+ clubs created
- [ ] 100+ #DearAdeline social posts

### 90-Day Goals

- [ ] 2,000+ signups
- [ ] 300+ paid subscribers
- [ ] $7,000+ MRR
- [ ] K-factor >1.2 (viral growth)
- [ ] Featured in 3+ homeschool publications
- [ ] 50+ five-star reviews

---

## 9. Launch Sequence

**Week 1: Foundation**
- Implement Stripe integration
- Build pricing page
- Setup webhooks and subscription management

**Week 2: Growth Features**
- Build club creation/join flows
- Add public showcase gallery
- Implement referral system

**Week 3: Marketing**
- Optimize landing page for SEO
- Setup email drip campaigns
- Create social media templates

**Week 4: Launch**
- Soft launch to beta users (email list)
- Monitor metrics, fix bugs
- Prepare for public launch

**Week 5: Scale**
- Public launch announcement
- Outreach to homeschool communities
- Content marketing (blog, YouTube)

---

## 10. Risk Mitigation

**Risk:** Free users never convert
**Mitigation:** 10 message limit creates natural urgency, $2.99 impulse price point

**Risk:** Payment failures
**Mitigation:** Stripe dunning emails (3 attempts), backup payment method prompts

**Risk:** Low viral coefficient
**Mitigation:** #DearAdeline showcase prominently featured, share incentives

**Risk:** Churn after first month
**Mitigation:** Engagement emails, feature discovery, onboarding checklist

**Risk:** CAC too high
**Mitigation:** Focus on organic (SEO, word-of-mouth, clubs) over paid ads initially

---

**END OF DESIGN**
