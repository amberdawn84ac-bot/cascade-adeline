# Login Redirect Issue - Troubleshooting Guide

## Problem
Login kicks you back to the login page instead of redirecting to dashboard.

## Most Common Causes

### 1. Supabase Redirect URLs Not Configured
**Fix in Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project: `ddzpmkcvyxllafhtinte`
3. Go to **Authentication → URL Configuration**
4. Set **Site URL** to: `https://dearadeline.co`
5. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3001/auth/callback`
   - `https://dearadeline.co/auth/callback`
   - `https://www.dearadeline.co/auth/callback`

### 2. Session Cookie Issues
**Check in Browser DevTools:**
1. Open DevTools → Application → Cookies
2. Look for cookies from `localhost` or your domain
3. Should see Supabase auth cookies like:
   - `sb-<project-ref>-auth-token`
   - `sb-<project-ref>-auth-token-code-verifier`

If cookies are missing, the session isn't being saved.

### 3. Auth Callback Route Missing or Broken
**Verify the callback route exists:**
- File should exist: `src/app/auth/callback/route.ts`
- Should handle the OAuth callback and redirect to dashboard

### 4. Environment Variables
**Verify these are set correctly:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ddzpmkcvyxllafhtinte.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Quick Test Steps

1. **Clear all cookies** for localhost
2. **Restart dev server**: `npm run dev`
3. **Try logging in again**
4. **Check browser console** for errors
5. **Check Network tab** for failed requests

## Expected Flow

1. User enters email/password on `/login`
2. Supabase sends magic link or validates credentials
3. User clicks link → redirected to `/auth/callback?code=...`
4. Callback route exchanges code for session
5. Session cookie is set
6. User redirected to `/dashboard`

## If Still Broken

Check server logs for errors:
- Look for "Supabase configuration missing" errors
- Look for auth callback errors
- Check if middleware is blocking the request

## Emergency Fix

If nothing works, try this temporary workaround:
1. Comment out the middleware redirect temporarily
2. Log in manually by setting session in browser
3. Debug the actual auth flow
