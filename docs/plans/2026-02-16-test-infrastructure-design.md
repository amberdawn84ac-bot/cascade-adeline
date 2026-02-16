# Test Infrastructure Design

**Date:** 2026-02-16
**Status:** Approved
**Timeline:** 3-4 days

## Goal

Build comprehensive test infrastructure with E2E tests, 200+ unit tests, CI/CD pipeline, and performance benchmarks.

## Current State

- ✅ 3 unit test files (51 tests) using Vitest
- ✅ Good test patterns (PII, router, spaced repetition)
- ❌ Rollup dependency blocking test runs
- ❌ No E2E tests
- ❌ No CI/CD pipeline
- ❌ No performance monitoring

## Target State

- ✅ Tests run successfully (rollup fixed)
- ✅ 20+ E2E tests with Playwright
- ✅ 200+ unit tests (60% → 85% coverage)
- ✅ CI/CD pipeline on GitHub Actions
- ✅ Performance benchmarks enforced

---

## Architecture

### 1. Test Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/generated/', '__tests__/'],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2. E2E Test Structure

```
e2e/
├── fixtures/
│   ├── test-database.ts       # Prisma test DB helpers
│   ├── demo-user.ts           # Pre-seeded accounts
│   └── test-helpers.ts        # Reusable actions
├── pages/
│   ├── PlaygroundPage.ts      # Page object models
│   ├── ChatPage.ts
│   ├── OnboardingPage.ts
│   └── DashboardPage.ts
├── specs/
│   ├── playground.spec.ts     # 3 tests
│   ├── onboarding.spec.ts     # 4 tests
│   ├── genui.spec.ts          # 5 tests
│   ├── parent-dashboard.spec.ts # 4 tests
│   └── error-handling.spec.ts # 4 tests
└── global-setup.ts            # Seed test DB
```

### 3. Unit Test Expansion

**Target: 200+ tests across 5 categories:**

1. **LangGraph Nodes (60 tests)** - router, lifeCreditLogger, discernmentEngine, etc.
2. **Learning Science (40 tests)** - ZPD engine, knowledge graph, mastery tracking
3. **Safety & Compliance (30 tests)** - PII masking, content moderation, COPPA
4. **API Routes (40 tests)** - chat, highlights, insights, messages
5. **Components (30 tests)** - GenUIRenderer, ChecklistWidget, AdelineTyping, etc.

### 4. CI/CD Pipeline

**4 GitHub Actions workflows:**

1. **test.yml** - Run all tests on PRs
2. **lint.yml** - Type check + ESLint with auto-fix
3. **lighthouse.yml** - Performance audit on preview deploys
4. **prisma.yml** - Schema validation

### 5. Performance Benchmarks

**Metrics tracked:**
- API latencies (p50, p95, p99)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Bundle sizes

**Enforcement:**
- Chat API p95 < 2s
- TTI < 3s on 4G throttle
- Main bundle < 500KB

---

## Implementation Strategy

**Phase 1: Foundation (Day 1)**
- Fix rollup dependency
- Setup vitest.config.ts
- Install Playwright
- Create test fixtures and helpers

**Phase 2: E2E Tests (Day 1-2)**
- Write 20 E2E tests
- Setup page object models
- Add visual regression tests

**Phase 3: Unit Tests (Day 2-3)**
- Expand to 200+ tests
- Setup MSW for API mocking
- Add React Testing Library tests

**Phase 4: CI/CD (Day 3)**
- Create GitHub Actions workflows
- Setup Vercel preview deploys
- Configure Lighthouse CI

**Phase 5: Performance (Day 3-4)**
- Add performance benchmarks
- Setup bundlewatch
- Create performance dashboard

---

## Success Criteria

- [ ] All tests run without rollup errors
- [ ] 20+ E2E tests passing (4 browsers)
- [ ] 200+ unit tests passing
- [ ] 85%+ code coverage
- [ ] CI/CD pipeline green on PRs
- [ ] Performance thresholds enforced
- [ ] Test run time < 5 minutes

---

## Risk Mitigation

**Risk:** Playwright tests flaky in CI
**Mitigation:** Use retry logic, explicit waits, stable selectors

**Risk:** Test database conflicts in parallel runs
**Mitigation:** Isolated test databases per worker

**Risk:** Slow test execution
**Mitigation:** Parallel execution, MSW mocking, test sharding

---

END OF DESIGN
