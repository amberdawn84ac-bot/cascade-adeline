'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!key) {
    console.warn('[Analytics] PostHog key not set, analytics disabled');
    return;
  }

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
}

// Acquisition events
export function trackSignupStarted() {
  posthog.capture('signup_started');
}

export function trackSignupCompleted(properties?: Record<string, unknown>) {
  posthog.capture('signup_completed', properties);
}

// Activation events
export function trackFirstMessageSent() {
  posthog.capture('first_message_sent');
}

export function trackIntentTriggered(intent: string) {
  posthog.capture('intent_triggered', { intent });
}

export function trackGenUIRendered(component: string) {
  posthog.capture('genui_rendered', { component });
}

export function trackClubJoined(clubId: string, subject: string) {
  posthog.capture('club_joined', { clubId, subject });
}

export function trackClubCreated(clubId: string, subject: string) {
  posthog.capture('club_created', { clubId, subject });
}

// Monetization events
export function trackPaywallShown(trigger: string) {
  posthog.capture('paywall_shown', { trigger });
}

export function trackUpgradeClicked(tier: string) {
  posthog.capture('upgrade_clicked', { tier });
}

export function trackCheckoutStarted(tier: string, billing: string) {
  posthog.capture('checkout_started', { tier, billing });
}

export function trackCheckoutCompleted(tier: string) {
  posthog.capture('checkout_completed', { tier });
}

// Engagement events
export function trackMessageSent() {
  posthog.capture('message_sent');
}

export function trackHighlightSaved() {
  posthog.capture('highlight_saved');
}

export function trackDashboardViewed() {
  posthog.capture('dashboard_viewed');
}

export function trackTranscriptExported() {
  posthog.capture('transcript_exported');
}

// Referral events
export function trackReferralLinkClicked() {
  posthog.capture('referral_link_clicked');
}

export function trackReferralSignup(referralCode: string) {
  posthog.capture('referral_signup', { referralCode });
}

// User identification
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthog.identify(userId, properties);
}

export function resetUser() {
  posthog.reset();
}
