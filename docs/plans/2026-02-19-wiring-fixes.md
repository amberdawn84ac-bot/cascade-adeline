# Wiring Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix six broken/unwired items discovered during post-auth audit: dead Sign Out button, missing Suspense wrapper on login page, missing /settings page, missing /reset-password page, missing /welcome page, and no parent nav link in the sidebar.

**Architecture:** All changes are isolated to existing files or new page files. No new API routes needed — all required endpoints already exist (`PATCH /api/users/onboarding` for settings, `PATCH /api/account` for deletion, Supabase `updateUser` for password reset).

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`createBrowserClient`), Prisma (custom path `src/generated/prisma`), Tailwind CSS (project colors: `#2F4731` palm-green, `#BD6809` papaya-orange, `#FFFEF7` cream), `lucide-react`, `framer-motion`

---

## Audit Findings — What Is Broken

| # | Issue | File | Symptom |
|---|-------|------|---------|
| 1 | Sign Out button is dead | `AppSidebar.tsx:175` | Button has no onClick — clicking does nothing |
| 2 | `useSearchParams` without Suspense | `src/app/login/page.tsx` | Next.js 15 throws on builds; degrades gracefully in dev |
| 3 | `/settings` page missing | — | Sidebar links to `/settings`, returns 404 |
| 4 | `/reset-password` page missing | — | Auth callback redirects there after password reset email |
| 5 | `/welcome` page missing | — | Stripe success_url points to `/welcome?session_id=…` |
| 6 | No Parent link in sidebar | `AppSidebar.tsx:26-41` | Parent users can't navigate to `/parent` |

**Not bugs (correctly working):**
- Chat page `body: {}` — API uses cookie-based `getSessionUser()`, per-submit body adds imageUrl/audioBase64 correctly
- Landing page CTAs → `/chat` — middleware bounces unauthenticated users to `/login?redirectTo=/chat`, then redirects back after login. Acceptable flow.
- Orphaned APIs (highlights, insights, reviews, placement, clubs) — future features, not broken

---

## Task 1: Fix Sign Out Button + Add Parent Nav Link

**Files:**
- Modify: `src/components/nav/AppSidebar.tsx`

**Context:** `AppSidebar` is a `"use client"` component. It already imports `usePathname`. It needs `useRouter` and a Supabase browser client to sign out. The Sign Out button is at line 175. The `NAV_ITEMS` array at line 26 needs a parent entry.

**Step 1: Read the current file**

Read `src/components/nav/AppSidebar.tsx` to confirm current state.

**Step 2: Add missing imports**

Add `useRouter` from `next/navigation` and the require-based `createBrowserClient` workaround (same pattern used in `ConversationalLogin.tsx`):

```typescript
import { usePathname, useRouter } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createBrowserClient = (require('@supabase/ssr') as { createBrowserClient: typeof createServerClient }).createBrowserClient;
```

**Step 3: Add Parent to NAV_ITEMS**

Add before the closing `]` of NAV_ITEMS (after the Library entry):

```typescript
{ label: 'Family Portal', href: '/parent', icon: Users },
```

Also add `Users` to the lucide-react import line.

**Step 4: Wire Sign Out button**

Inside the `AppSidebar` function body, add:

```typescript
const router = useRouter();
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const handleSignOut = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
```

Then update the button at line ~175 to call `handleSignOut`:

```tsx
<button
  onClick={handleSignOut}
  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#6B1D2A]/80 hover:text-[#6B1D2A] transition-colors"
>
  <LogOut size={16} />
  Sign Out
</button>
```

**Step 5: Commit**

```bash
git add src/components/nav/AppSidebar.tsx
git commit -m "fix: wire sign out button and add Family Portal nav link"
```

---

## Task 2: Wrap ConversationalLogin in Suspense

**Files:**
- Modify: `src/app/login/page.tsx`

**Context:** `ConversationalLogin` uses `useSearchParams()`. In Next.js 15, any component that reads `useSearchParams` must be wrapped in `<Suspense>` or it will error during static generation. The login page is a server component and just renders `<ConversationalLogin />` directly.

**Step 1: Read the current file**

Read `src/app/login/page.tsx` to confirm current structure (it's ~30 lines).

**Step 2: Add Suspense wrapper**

```typescript
import { Suspense } from 'react';
import { ConversationalLogin } from '@/components/auth/ConversationalLogin';
import { WheatStalk } from '@/components/illustrations';

export default function LoginPage() {
  return (
    <div style={{ /* same styles as before */ }}>
      <div className="absolute top-8 left-8 opacity-20 rotate-[-15deg]">
        <WheatStalk size={120} color="#BD6809" />
      </div>
      <div className="absolute bottom-8 right-8 opacity-20 rotate-[165deg]">
        <WheatStalk size={120} color="#2F4731" />
      </div>

      <Suspense fallback={<div className="w-full max-w-md mx-auto p-6 text-center text-[#2F4731]/60">Loading...</div>}>
        <ConversationalLogin />
      </Suspense>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "fix: wrap ConversationalLogin in Suspense for Next.js 15 compatibility"
```

---

## Task 3: Create /settings Page

**Files:**
- Create: `src/app/(routes)/settings/page.tsx`
- Create: `src/components/settings/SettingsForm.tsx`

**Context:** The sidebar links to `/settings`. This sits inside the `(routes)` route group (gets the `AppSidebar` layout). The page shows the current user's profile and lets them update `gradeLevel` and `interests` via the existing `PATCH /api/users/onboarding` endpoint. Use `getSessionUser()` server-side to get initial data. Pass to a client component for interactivity.

**`getSessionUser()` returns:** `{ userId, email, name?, role?, gradeLevel?, interests? }`

**`PATCH /api/users/onboarding` accepts:** `{ gradeLevel: string, interests: string[] }`

**Step 1: Create the page (server component)**

Create `src/app/(routes)/settings/page.tsx`:

```typescript
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Settings
        </h1>
        <p className="text-[#2F4731]/60 mt-2">Manage your profile and preferences.</p>
      </header>
      <SettingsForm user={user} />
    </div>
  );
}
```

**Step 2: Create the form (client component)**

Create `src/components/settings/SettingsForm.tsx`:

```typescript
"use client";

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const INTEREST_OPTIONS = ['Science', 'Math', 'Reading', 'Writing', 'History', 'Art', 'Music', 'Coding', 'Nature', 'Business', 'Sports', 'Cooking'];

interface Props {
  user: { name?: string; email?: string; role?: string; gradeLevel?: string; interests?: string[] };
}

export function SettingsForm({ user }: Props) {
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || '');
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeLevel, interests }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage('Settings saved!');
    } catch {
      setMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5]";

  return (
    <div className="space-y-8">
      {/* Read-only info */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F4731]">Account Info</h2>
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Name</label>
            <div className={inputClass + " text-[#2F4731]/70 cursor-not-allowed"}>{user.name || '—'}</div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Email</label>
            <div className={inputClass + " text-[#2F4731]/70 cursor-not-allowed"}>{user.email || '—'}</div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-1 block">Role</label>
            <div className={inputClass + " text-[#2F4731]/70 cursor-not-allowed capitalize"}>{user.role?.toLowerCase() || '—'}</div>
          </div>
        </div>
      </div>

      {/* Editable preferences */}
      <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 space-y-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F4731]">Learning Preferences</h2>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-3 block">Grade Level</label>
          <div className="flex flex-wrap gap-2">
            {GRADE_LEVELS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeLevel(g)}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  gradeLevel === g
                    ? 'bg-[#BD6809] border-[#BD6809] text-white'
                    : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#BD6809]'
                }`}
              >
                {g === 'K' ? 'Kindergarten' : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#2F4731]/50 mb-3 block">Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                  interests.includes(interest)
                    ? 'bg-[#2F4731] border-[#2F4731] text-white'
                    : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#2F4731]'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className={`text-sm font-bold text-center p-2 rounded-lg ${message.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#2F4731] text-white rounded-xl font-bold hover:bg-[#1E2E20] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/(routes)/settings/page.tsx src/components/settings/SettingsForm.tsx
git commit -m "feat: add /settings page with grade level and interests editor"
```

---

## Task 4: Create /reset-password Page

**Files:**
- Create: `src/app/reset-password/page.tsx`

**Context:** When a user clicks "Forgot password?" in the login form, Supabase sends a reset email. The email link redirects to `/auth/callback?next=/reset-password` which exchanges the code for a session and then redirects to `/reset-password`. At this point the user has a valid Supabase session and can call `supabase.auth.updateUser({ password })`.

This is a **standalone page** (no AppSidebar — not inside `(routes)`). It must be a client component (uses Supabase browser client and `useRouter`).

**Step 1: Create the page**

Create `src/app/reset-password/page.tsx`:

```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createBrowserClient = (require('@supabase/ssr') as { createBrowserClient: typeof createServerClient }).createBrowserClient;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setIsError(true);
      setMessage('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setIsError(false);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setMessage('Password updated! Redirecting to dashboard…');
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setLoading(false);
  };

  const inputClass = "w-full p-4 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5] text-lg";

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFEF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#FFF3E7] rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-[#BD6809]" />
          </div>
          <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Choose a New Password
          </h1>
          <p className="text-[#2F4731]/60 mt-2">At least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#E7DAC3] space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password"
            className={inputClass}
            required
            minLength={8}
            autoFocus
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className={inputClass}
            required
            minLength={8}
          />

          {message && (
            <p className={`text-sm font-bold text-center p-2 rounded-lg ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BD6809] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#A05808] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/reset-password/page.tsx
git commit -m "feat: add /reset-password page for Supabase password reset flow"
```

---

## Task 5: Create /welcome Page

**Files:**
- Create: `src/app/welcome/page.tsx`

**Context:** After a successful Stripe checkout, the user is redirected to `/welcome?session_id={CHECKOUT_SESSION_ID}`. This is a **standalone page** (no AppSidebar). It should confirm the subscription and link to the dashboard. It does NOT need to verify the session_id — the Stripe webhook handles actual provisioning. This page is just a confirmation UI.

**Step 1: Create the page**

Create `src/app/welcome/page.tsx`:

```typescript
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFEF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <div className="w-full max-w-xl text-center space-y-8">
        <div className="text-8xl">🎉</div>

        <div className="space-y-4">
          <h1
            className="text-5xl font-bold text-[#2F4731]"
            style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
          >
            Welcome to the Academy!
          </h1>
          <p className="text-xl text-[#2F4731]/70 leading-relaxed">
            Your subscription is active. Adeline is ready to help your student learn, grow, and thrive.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-lg space-y-4">
          <p className="text-[#BD6809] font-bold text-sm uppercase tracking-widest">What&apos;s next?</p>
          <ul className="text-left space-y-3 text-[#2F4731]">
            <li className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <span>Chat with Adeline — tell her what your student loves to explore.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🏠</span>
              <span>Visit the Dashboard to see your learning rooms and track progress.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">⚙️</span>
              <span>Set up your grade level and interests in Settings.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-10 py-4 rounded-full bg-[#2F4731] text-white font-black uppercase tracking-widest text-sm hover:bg-[#1E2E20] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/chat"
            className="px-10 py-4 rounded-full border-2 border-[#BD6809] text-[#BD6809] font-black uppercase tracking-widest text-sm hover:bg-[#BD6809] hover:text-white transition-colors"
          >
            Chat with Adeline
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/welcome/page.tsx
git commit -m "feat: add /welcome page for post-Stripe-checkout confirmation"
```

---

## Testing Checklist

After all tasks:

1. **Sign Out:** Click Sign Out in sidebar → session ends → redirected to `/login`
2. **Login page build:** Run `npm run build` — should complete without Suspense error
3. **Family Portal:** "Family Portal" appears in sidebar nav; clicking goes to `/parent`
4. **Settings:** Navigate to `/settings` → page loads with current user data; update grade level → save → confirm toast appears
5. **Reset Password:** Click "Forgot password?" on login page, enter email → check email → click link → lands on `/reset-password` → update password → redirected to dashboard
6. **Welcome:** Simulate Stripe redirect to `/welcome?session_id=test` → page renders with celebration UI and CTA links

---

## What's NOT In This Plan (YAGNI)

The following orphaned APIs exist but have no user-visible breakage — they are future features:
- `/api/highlights`, `/api/insights`, `/api/reviews` — no UI yet
- `/api/placement/*` — adaptive placement test, no UI
- `/api/clubs/*`, `/api/referrals` — community features, no UI
- `/api/messages` — direct messaging, no UI
- `/api/transcript`, `/api/transcript/export` — graduation tracker, no UI

These will be built when the corresponding features are designed. Touching them now would be premature.
