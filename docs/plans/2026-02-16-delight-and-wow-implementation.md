# Delight & Wow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Dear Adeline into a magical, delightful experience with animations, personality-driven UX, and rich learning insights.

**Architecture:** Fix server-to-client metadata streaming, add Framer Motion animations throughout, create interactive onboarding flow, implement personality-driven loading/error states, and build timeline view with highlights and insights panels.

**Tech Stack:** Next.js 15, TypeScript, Framer Motion, react-confetti, Prisma, Vercel AI SDK v6

**Estimated Time:** 12-16 hours (4 features × 3-4 hours each)

---

## Prerequisites

### Install Dependencies

```bash
npm install framer-motion react-confetti react-infinite-scroll-component
npm install html-to-image file-saver
npm install date-fns
npm install @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-progress
npm install sonner
npm install react-error-boundary
```

### Run Prisma Migration

Add new models to `prisma/schema.prisma`:

```prisma
model Highlight {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messageId   String?  @db.Uuid
  content     String
  type        String
  source      String
  impact      String?
  userNote    String?
  intent      String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}

model OnboardingProgress {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @unique @db.Uuid
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  completedSteps  String[]
  completedAt     DateTime?
  createdAt       DateTime @default(now())
}
```

Then run:

```bash
npx prisma db push
npx prisma generate
```

---

## Feature 1: GenUI Payload Streaming Fix + Animations

**Goal:** Enable generative UI components to render with delightful animations.

---

### Task 1.1: Create GenUIRenderer Component

**Files:**
- Create: `src/components/gen-ui/GenUIRenderer.tsx`
- Reference: `src/components/gen-ui/index.ts` (existing export)

**Step 1: Write the component with Framer Motion**

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import {
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
} from './index';

type GenUIPayload = {
  type: 'TranscriptCard' | 'InvestigationBoard' | 'ProjectImpactCard' | 'MissionBriefing';
  props: Record<string, any>;
};

const componentMap = {
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
};

export function GenUIRenderer({ payload }: { payload: GenUIPayload | null }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (payload?.type === 'TranscriptCard') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [payload?.type]);

  if (!payload) return null;

  const Component = componentMap[payload.type];
  if (!Component) {
    console.warn(`Unknown GenUI component type: ${payload.type}`);
    return null;
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          numberOfPieces={50}
          recycle={false}
          colors={['#BD6809', '#FFD700', '#9A3F4A']}
        />
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Component {...payload.props} />
      </motion.div>
    </>
  );
}
```

**Step 2: Test manually**

Start dev server:
```bash
npm run dev
```

Expected: No errors, component exports successfully.

**Step 3: Commit**

```bash
git add src/components/gen-ui/GenUIRenderer.tsx
git commit -m "feat(genui): add GenUIRenderer with animations

- Framer Motion entrance animations
- Confetti celebration for TranscriptCard
- Dynamic component mapping

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Wire GenUIRenderer into Chat Page

**Files:**
- Modify: `src/app/(routes)/chat/page.tsx`

**Step 1: Add state and useChat handler**

Find the `useChat` hook (around line 30-40) and modify:

```typescript
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import { GenUIRenderer } from '@/components/gen-ui/GenUIRenderer';

export default function ChatPage() {
  const [genUIPayload, setGenUIPayload] = useState<any>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      // Extract genUIPayload from message metadata
      const metadata = (message as any).metadata;
      if (metadata?.genUIPayload) {
        setGenUIPayload(metadata.genUIPayload);
      }
    },
  });

  // ... rest of component
}
```

**Step 2: Render GenUIRenderer in UI**

Find the messages rendering section and add GenUIRenderer:

```typescript
return (
  <div>
    {/* Existing messages */}
    {messages.map((m) => (
      <div key={m.id}>
        {m.content}
      </div>
    ))}

    {/* GenUI Components */}
    {genUIPayload && <GenUIRenderer payload={genUIPayload} />}

    {/* Input form */}
  </div>
);
```

**Step 3: Test the flow**

Run dev server, send message "I baked bread today", verify TranscriptCard renders with confetti.

Expected: TranscriptCard appears with fade-in animation + confetti burst.

**Step 4: Commit**

```bash
git add src/app/\(routes\)/chat/page.tsx
git commit -m "feat(chat): wire GenUIRenderer to chat page

- Extract genUIPayload from message metadata
- Render GenUI components dynamically
- Test with life log message

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Add Hover Micro-Interactions to GenUI Cards

**Files:**
- Modify: `src/components/gen-ui/TranscriptCard.tsx`
- Modify: `src/components/gen-ui/InvestigationBoard.tsx`

**Step 1: Wrap TranscriptCard with motion.div**

```typescript
import { motion } from 'framer-motion';

export function TranscriptCard({ credits, subject, activity }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: '#FFFEF7',
        border: '1px solid #E7DAC3',
        borderLeft: '4px solid #BD6809',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
      }}
    >
      {/* Existing card content */}
      <h3>{activity}</h3>
      <div>
        <span style={{ background: '#BD6809', color: '#FFF', padding: '4px 8px', borderRadius: 999 }}>
          {credits} {subject}
        </span>
      </div>
    </motion.div>
  );
}
```

**Step 2: Add hover to credit badges**

```typescript
{credits.map((credit) => (
  <motion.span
    key={credit.subject}
    whileHover={{ scale: 1.05 }}
    style={{
      background: '#BD6809',
      color: '#FFF',
      padding: '6px 12px',
      borderRadius: 999,
      display: 'inline-block',
      margin: 4,
      cursor: 'pointer',
    }}
  >
    {credit.amount} {credit.subject}
  </motion.span>
))}
```

**Step 3: Apply same pattern to InvestigationBoard**

```typescript
export function InvestigationBoard({ topic, findings }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: '#FFFEF7',
        border: '1px solid #E7DAC3',
        borderLeft: '4px solid #3D1419',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
      }}
    >
      {/* Existing content */}
    </motion.div>
  );
}
```

**Step 4: Test hover interactions**

Hover over cards, verify smooth scale and shadow lift.

**Step 5: Commit**

```bash
git add src/components/gen-ui/TranscriptCard.tsx src/components/gen-ui/InvestigationBoard.tsx
git commit -m "feat(genui): add hover micro-interactions

- Cards lift on hover with spring physics
- Credit badges scale on hover
- Smooth shadow transitions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Feature 2: Magical Onboarding Experience

**Goal:** Create interactive playground, personalized welcome flow, and gamified checklist.

---

### Task 2.1: Create Playground Route

**Files:**
- Create: `src/app/playground/page.tsx`

**Step 1: Create basic playground page**

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useChat } from 'ai/react';

const SUGGESTED_PROMPTS = [
  { text: "I baked sourdough bread today", intent: "LIFE_LOG", icon: "🍞" },
  { text: "Who really profits from standardized testing?", intent: "INVESTIGATE", icon: "🔍" },
  { text: "I want to build a chicken coop", intent: "BRAINSTORM", icon: "🛠️" },
  { text: "Help me reflect on what I learned this week", intent: "REFLECT", icon: "💭" },
];

export default function PlaygroundPage() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    id: 'playground',
  });

  const handlePromptClick = (promptText: string) => {
    setInput(promptText);
    // Auto-submit after brief delay for typewriter effect
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFEF7',
      padding: 24,
      fontFamily: 'Kalam, "Comic Sans MS", system-ui',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: '"Emilys Candy", cursive',
          color: '#2F4731',
          fontSize: '3rem',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Try Adeline
        </h1>

        <p style={{ textAlign: 'center', color: '#4B3424', marginBottom: 32 }}>
          No login required. Click a suggestion or ask your own question!
        </p>

        {/* Suggested Prompts */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <motion.button
              key={prompt.text}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePromptClick(prompt.text)}
              style={{
                background: '#FFFFFF',
                border: '2px solid #E7DAC3',
                borderRadius: 999,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <span style={{ fontSize: 24 }}>{prompt.icon}</span>
              <span style={{ color: '#2F4731' }}>{prompt.text}</span>
            </motion.button>
          ))}
        </div>

        {/* Chat Messages */}
        <div style={{ marginBottom: 24 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                marginBottom: 16,
                padding: 16,
                background: m.role === 'user' ? '#2F4731' : '#FFFFFF',
                color: m.role === 'user' ? '#FFF' : '#121B13',
                borderRadius: m.role === 'user' ? '14px 0 14px 14px' : '0 14px 14px 14px',
                border: '1px solid #E7DAC3',
              }}
            >
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div style={{ padding: 16, fontStyle: 'italic', color: '#4B3424' }}>
              Adeline is thinking...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Adeline anything..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #E7DAC3',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#BD6809',
              color: '#FFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Test playground**

Navigate to `http://localhost:3000/playground`, click suggested prompts.

Expected: Prompts auto-fill and submit, Adeline responds.

**Step 3: Commit**

```bash
git add src/app/playground/page.tsx
git commit -m "feat(onboarding): add interactive playground

- No-login demo experience
- Suggested prompt chips with animations
- Auto-submit on prompt click
- Clean chat interface

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2.2: Create Welcome Flow Component

**Files:**
- Create: `src/components/onboarding/WelcomeFlow.tsx`
- Create: `src/components/onboarding/types.ts`

**Step 1: Create types file**

```typescript
export type OnboardingData = {
  childName?: string;
  gradeLevel?: string;
  interests?: string[];
};

export type OnboardingStep = {
  title: string;
  content?: string;
  fields?: Array<{
    name: keyof OnboardingData;
    label: string;
    type: 'text' | 'grade-selector' | 'tag-input';
  }>;
  illustration?: React.ReactNode;
};
```

**Step 2: Create WelcomeFlow component**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WheatStalk } from '@/components/illustrations';
import type { OnboardingData, OnboardingStep } from './types';

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Meet Adeline",
    content: "Hi! I'm Adeline, your family's learning companion.",
    illustration: <WheatStalk size={120} color="#BD6809" />,
  },
  {
    title: "Tell me about your child",
    fields: [
      { name: 'childName', label: "What's your child's name?", type: 'text' },
      { name: 'gradeLevel', label: 'What grade are they in?', type: 'grade-selector' },
      { name: 'interests', label: 'What are they passionate about?', type: 'tag-input' },
    ],
  },
];

export function WelcomeFlow({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});

  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const currentStep = ONBOARDING_STEPS[step];

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(47,71,49,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 600,
        padding: 24,
        background: '#FFFEF7',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Progress Bar */}
        <div style={{
          height: 8,
          background: '#E7DAC3',
          borderRadius: 999,
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: '#BD6809',
            }}
          />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 style={{
              fontFamily: 'Kranky',
              color: '#2F4731',
              fontSize: '2rem',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              {currentStep.title}
            </h2>

            {currentStep.illustration && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                {currentStep.illustration}
              </div>
            )}

            {currentStep.content && (
              <p style={{
                fontFamily: 'Kalam',
                color: '#4B3424',
                fontSize: '1.2rem',
                textAlign: 'center',
                marginBottom: 24,
              }}>
                {currentStep.content}
              </p>
            )}

            {currentStep.fields && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {currentStep.fields.map((field) => (
                  <div key={field.name}>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontWeight: 600,
                      color: '#2F4731',
                    }}>
                      {field.label}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={data[field.name] as string || ''}
                        onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 12,
                          border: '2px solid #E7DAC3',
                          fontSize: 16,
                          fontFamily: 'Kalam',
                        }}
                      />
                    )}
                    {/* TODO: Add grade-selector and tag-input components */}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: '#BD6809',
                color: '#FFF',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Kalam',
              }}
            >
              {step < ONBOARDING_STEPS.length - 1 ? 'Next' : "Let's Start Learning!"}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

**Step 3: Test welcome flow**

Import and render in chat page temporarily to test.

Expected: Modal appears, progress bar updates, can navigate steps.

**Step 4: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat(onboarding): add welcome flow modal

- Animated step progression
- Progress bar with smooth transitions
- Personalized data collection
- Ready for grade selector and tag input

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2.3: Create Onboarding Checklist Widget

**Files:**
- Create: `src/components/onboarding/ChecklistWidget.tsx`

**Step 1: Create checklist widget**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

type ChecklistItem = {
  id: string;
  label: string;
  autoComplete?: boolean;
  intent?: string;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'meet', label: 'Meet Adeline', autoComplete: true },
  { id: 'life_log', label: 'Log your first activity', intent: 'LIFE_LOG' },
  { id: 'investigate', label: 'Explore an investigation', intent: 'INVESTIGATE' },
  { id: 'brainstorm', label: 'Start a project', intent: 'BRAINSTORM' },
  { id: 'reflect', label: 'Reflect on your learning', intent: 'REFLECT' },
];

export function ChecklistWidget() {
  const [expanded, setExpanded] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set(['meet']));
  const [showCelebration, setShowCelebration] = useState(false);

  const progress = (completed.size / CHECKLIST_ITEMS.length) * 100;
  const allComplete = completed.size === CHECKLIST_ITEMS.length;

  useEffect(() => {
    if (allComplete && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [allComplete, showCelebration]);

  return (
    <>
      {showCelebration && <Confetti numberOfPieces={200} recycle={false} />}

      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        style={{
          position: 'fixed',
          right: 24,
          top: 100,
          width: expanded ? 320 : 80,
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          padding: 16,
          zIndex: 1000,
        }}
      >
        {expanded ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{
                fontFamily: 'Kranky',
                color: '#2F4731',
                fontSize: '1.2rem',
                margin: 0,
              }}>
                Getting Started
              </h3>
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                −
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{
              height: 6,
              background: '#E7DAC3',
              borderRadius: 999,
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: '100%',
                  background: '#BD6809',
                }}
              />
            </div>

            {/* Checklist Items */}
            {CHECKLIST_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  opacity: completed.has(item.id) ? 0.6 : 1,
                  scale: completed.has(item.id) ? 0.98 : 1,
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid #E7DAC3',
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '2px solid #BD6809',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: completed.has(item.id) ? '#BD6809' : 'transparent',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {completed.has(item.id) && '✓'}
                </div>
                <span style={{
                  fontFamily: 'Kalam',
                  color: '#121B13',
                  textDecoration: completed.has(item.id) ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </motion.div>
            ))}
          </>
        ) : (
          <div
            onClick={() => setExpanded(true)}
            style={{
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: 32,
              marginBottom: 8,
            }}>
              📋
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#BD6809',
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </motion.div>

      {/* Celebration Modal */}
      {allComplete && showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#FFFEF7',
            borderRadius: 24,
            padding: 40,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
            zIndex: 10000,
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 16 }}>🎉</div>
          <h2 style={{
            fontFamily: 'Kranky',
            color: '#2F4731',
            fontSize: '2rem',
            marginBottom: 12,
          }}>
            You're Ready!
          </h2>
          <p style={{
            fontFamily: 'Kalam',
            color: '#4B3424',
            fontSize: '1.1rem',
          }}>
            Now the real adventure begins.
          </p>
        </motion.div>
      )}
    </>
  );
}
```

**Step 2: Test checklist widget**

Render in chat page, verify collapse/expand, progress updates.

Expected: Widget animates in, shows progress, celebrates when complete.

**Step 3: Commit**

```bash
git add src/components/onboarding/ChecklistWidget.tsx
git commit -m "feat(onboarding): add gamified checklist widget

- Collapsible floating widget
- Progress tracking with animations
- Celebration modal on completion
- Full-screen confetti burst

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Feature 3: Personality-Driven Loading & Errors

**Goal:** Replace generic loading states and errors with Adeline's personality.

---

### Task 3.1: Create Adeline Typing Component

**Files:**
- Create: `src/components/chat/AdelineTyping.tsx`

**Step 1: Create typing animation component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WheatStalk } from '@/components/illustrations';

const THINKING_MESSAGES = [
  "Hmm, let me think about that...",
  "Connecting the dots...",
  "Checking my library...",
  "Following the learning trail...",
  "One moment, gathering wisdom...",
];

const INTENT_MESSAGES: Record<string, string> = {
  LIFE_LOG: "Mapping your activity to learning standards...",
  INVESTIGATE: "Following the money... 🔍",
  BRAINSTORM: "Dreaming up possibilities...",
  REFLECT: "Preparing thoughtful questions...",
};

type Props = {
  intent?: string;
};

export function AdelineTyping({ intent }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    // Rotate messages every 3s
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 3000);

    // Track loading time
    const timeInterval = setInterval(() => {
      setLoadingTime((t) => t + 1);
    }, 1000);

    // Show progress after 3s
    const progressTimer = setTimeout(() => setShowProgress(true), 3000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      clearTimeout(progressTimer);
    };
  }, []);

  const message = intent ? INTENT_MESSAGES[intent] : THINKING_MESSAGES[messageIndex];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      {/* Animated Avatar */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <WheatStalk size={32} color="#BD6809" />
      </motion.div>

      {/* Typing Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: '#FFFEF7',
          border: '1px solid #E7DAC3',
          borderRadius: '0 14px 14px 14px',
          padding: '12px 16px',
          maxWidth: 320,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer Effect */}
        <motion.div
          animate={{ x: [-100, 400] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 100,
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Message */}
        <div style={{
          fontFamily: 'Kalam',
          color: '#121B13',
          marginBottom: 8,
          position: 'relative',
        }}>
          {message}
        </div>

        {/* Dots Animation */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#BD6809',
              }}
            />
          ))}
        </div>

        {/* Progress Stages (after 3s) */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: 12, fontSize: 12, color: '#4B3424' }}
          >
            {loadingTime < 5 && "Understanding your question..."}
            {loadingTime >= 5 && loadingTime < 8 && "Searching my knowledge..."}
            {loadingTime >= 8 && "Crafting a thoughtful response..."}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
```

**Step 2: Test typing animation**

Render component in isolation, verify animations work smoothly.

Expected: Shimmer effect, pulsing dots, rotating messages.

**Step 3: Commit**

```bash
git add src/components/chat/AdelineTyping.tsx
git commit -m "feat(chat): add Adeline typing animation

- Breathing avatar animation
- Shimmer effect in bubble
- Pulsing dots with stagger
- Rotating thinking messages
- Progress stages after 3s

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3.2: Create Error Boundary with Personality

**Files:**
- Create: `src/components/chat/ChatErrorBoundary.tsx`
- Create: `src/components/chat/ErrorDisplay.tsx`

**Step 1: Create error display component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { WateringCan, Compass, Lightbulb, OpenBook } from '@/components/illustrations';

type ErrorType = 'RATE_LIMIT' | 'NETWORK' | 'TIMEOUT' | 'CONTENT_BLOCKED' | 'UNKNOWN';

type ErrorConfig = {
  title: string;
  message: string;
  illustration: React.ReactNode;
  actions: Array<{ label: string; primary?: boolean; action?: string }>;
};

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  RATE_LIMIT: {
    title: "Whoa there, eager learner!",
    message: "You're asking questions faster than I can answer. Let's take a breath—I'll be ready in a moment. ⏰",
    illustration: <WateringCan size={80} color="#BD6809" />,
    actions: [{ label: "Wait for me", primary: true }],
  },
  NETWORK: {
    title: "Hmm, seems like we lost connection",
    message: "Check your internet and we'll pick right back up! 📡",
    illustration: <Compass size={80} color="#BD6809" />,
    actions: [
      { label: "Try Again", primary: true, action: 'retry' },
      { label: "Start Fresh", action: 'clear' },
    ],
  },
  TIMEOUT: {
    title: "That question made me think too hard!",
    message: "Let's try rephrasing it, or I can help break it into smaller pieces. 🤔",
    illustration: <Lightbulb size={80} color="#BD6809" />,
    actions: [
      { label: "Rephrase", primary: true, action: 'retry' },
      { label: "Get Help", action: 'suggest' },
    ],
  },
  CONTENT_BLOCKED: {
    title: "Let's keep our conversation focused on learning!",
    message: "I appreciate your curiosity, but ask me about anything from baking bread to building rockets. 🚀",
    illustration: <OpenBook size={80} color="#2F4731" />,
    actions: [{ label: "Got it!", primary: true }],
  },
  UNKNOWN: {
    title: "Oh dear! Something went sideways.",
    message: "Don't worry—your work is safe. Let's try that again.",
    illustration: <WateringCan size={80} color="#BD6809" />,
    actions: [
      { label: "Try Again", primary: true, action: 'retry' },
      { label: "Report This", action: 'report' },
    ],
  },
};

function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  if (message.includes('rate limit')) return 'RATE_LIMIT';
  if (message.includes('network') || message.includes('fetch')) return 'NETWORK';
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('blocked') || message.includes('moderat')) return 'CONTENT_BLOCKED';
  return 'UNKNOWN';
}

type Props = {
  error: Error;
  onRetry: () => void;
  onClear?: () => void;
};

export function ErrorDisplay({ error, onRetry, onClear }: Props) {
  const errorType = detectErrorType(error);
  const config = ERROR_CONFIGS[errorType];

  const handleAction = (action?: string) => {
    switch (action) {
      case 'retry':
        onRetry();
        break;
      case 'clear':
        onClear?.();
        break;
      case 'report':
        // TODO: Open report modal
        console.log('Report error:', error);
        break;
      default:
        // Close error
        onRetry();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 24,
        background: '#FFF3CD',
        border: '2px solid #BD6809',
        borderRadius: 16,
        textAlign: 'center',
        margin: '16px 0',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        {config.illustration}
      </div>

      <h3 style={{
        fontFamily: 'Kranky',
        color: '#2F4731',
        fontSize: '1.5rem',
        marginBottom: 12,
      }}>
        {config.title}
      </h3>

      <p style={{
        fontFamily: 'Kalam',
        color: '#4B3424',
        fontSize: '1.1rem',
        margin: '12px 0 24px',
      }}>
        {config.message}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {config.actions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleAction(action.action)}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: action.primary ? 'none' : '2px solid #2F4731',
              background: action.primary ? '#BD6809' : '#FFFFFF',
              color: action.primary ? '#FFF' : '#2F4731',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Kalam',
              fontSize: 16,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
```

**Step 2: Create error boundary wrapper**

```typescript
'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { ErrorDisplay } from './ErrorDisplay';

type Props = {
  children: React.ReactNode;
};

export function ChatErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorDisplay
          error={error}
          onRetry={resetErrorBoundary}
          onClear={() => {
            // Clear chat state
            resetErrorBoundary();
          }}
        />
      )}
      onError={(error) => {
        console.error('[ChatErrorBoundary]', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Step 3: Test error scenarios**

Trigger different errors, verify correct messages appear.

Expected: Friendly error messages with personality, appropriate illustrations.

**Step 4: Commit**

```bash
git add src/components/chat/ChatErrorBoundary.tsx src/components/chat/ErrorDisplay.tsx
git commit -m "feat(chat): add personality-driven error handling

- Friendly error messages in Adeline's voice
- Contextual illustrations for each error type
- Smart error type detection
- Retry and recovery actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3.3: Add "While You Wait" Tips

**Files:**
- Create: `src/components/chat/WaitingTips.tsx`

**Step 1: Create tips component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIPS = [
  { icon: "💡", text: "Did you know? You can upload photos of your projects for instant credits!" },
  { icon: "🌾", text: "Tip: Ask me 'who profits from...' to investigate any topic." },
  { icon: "📚", text: "Try saying 'I want to reflect on my week' for guided self-assessment." },
  { icon: "🎨", text: "Your learning is automatically tracked—check your transcript anytime!" },
  { icon: "⚡", text: "Pro tip: The more specific your description, the better credits I can award." },
  { icon: "🔍", text: "I can search my library of trusted Christian resources for any topic." },
  { icon: "🌱", text: "Every project should help someone—service learning is built in!" },
  { icon: "📖", text: "Want to explore Greek or Hebrew? Ask about any Bible verse!" },
  { icon: "🏆", text: "Building a portfolio? All your work is saved for compliance reports." },
  { icon: "🤝", text: "Join clubs to connect with other homeschool families!" },
];

type Props = {
  show: boolean;
};

export function WaitingTips({ show }: Props) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const tip = TIPS[tipIndex];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(189,104,9,0.1)',
          border: '1px solid rgba(189,104,9,0.3)',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'Kalam',
          color: '#4B3424',
        }}
      >
        <span style={{ marginRight: 8, fontSize: 16 }}>{tip.icon}</span>
        {tip.text}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Integrate into chat page**

Show tips after 5 seconds of loading:

```typescript
const [showTips, setShowTips] = useState(false);

useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => setShowTips(true), 5000);
    return () => clearTimeout(timer);
  } else {
    setShowTips(false);
  }
}, [isLoading]);

// In render:
{isLoading && <AdelineTyping intent={detectedIntent} />}
{isLoading && <WaitingTips show={showTips} />}
```

**Step 3: Test tips rotation**

Load for >5 seconds, verify tips rotate smoothly.

Expected: Tips appear after 5s, fade in/out smoothly every 4s.

**Step 4: Commit**

```bash
git add src/components/chat/WaitingTips.tsx src/app/\(routes\)/chat/page.tsx
git commit -m "feat(chat): add 'while you wait' tips

- Rotating tips during long loads
- Only show after 5 seconds
- Smooth fade transitions
- 10 helpful tips about features

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Feature 4: Rich Message History + Insights

**Goal:** Transform chat into explorable learning timeline with highlights and insights.

---

### Task 4.1: Add Date Grouping to Messages

**Files:**
- Modify: `src/app/(routes)/chat/page.tsx`
- Create: `src/components/chat/DateDivider.tsx`

**Step 1: Create date divider component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { WheatDivider } from '@/components/illustrations';

type Props = {
  label: string;
};

export function DateDivider({ label }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '24px 0 16px',
      }}
    >
      <div style={{ flex: 1, height: 1, background: '#E7DAC3' }} />
      <span style={{
        fontFamily: 'Kranky',
        color: '#BD6809',
        fontSize: '1.1rem',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: '#E7DAC3' }} />
    </motion.div>
  );
}
```

**Step 2: Add date grouping logic**

```typescript
import { format, differenceInDays } from 'date-fns';
import { DateDivider } from '@/components/chat/DateDivider';

function getDateLabel(date: Date): string {
  const now = new Date();
  const diff = differenceInDays(now, date);

  if (diff === 0) return "Today's Learning";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "Last Week";
  if (diff < 14) return "Two Weeks Ago";
  return format(date, 'MMMM d, yyyy');
}

function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {};

  messages.forEach((msg) => {
    const date = new Date(msg.createdAt);
    const label = getDateLabel(date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });

  return groups;
}

// In component:
const groupedMessages = groupMessagesByDate(messages);

return (
  <div>
    {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
      <div key={dateLabel}>
        <DateDivider label={dateLabel} />
        {msgs.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    ))}
  </div>
);
```

**Step 3: Test date grouping**

Messages from different days should group under date dividers.

Expected: "Today's Learning", "Yesterday", "Last Week" dividers appear.

**Step 4: Commit**

```bash
git add src/components/chat/DateDivider.tsx src/app/\(routes\)/chat/page.tsx
git commit -m "feat(chat): add date grouping to messages

- Group messages by date with dividers
- Animated dividers with wheat motif
- Smart date labels (Today, Yesterday, etc.)
- Timeline feel for learning history

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4.2: Add Infinite Scroll for History

**Files:**
- Modify: `src/app/(routes)/chat/page.tsx`

**Step 1: Install and implement infinite scroll**

```typescript
import InfiniteScroll from 'react-infinite-scroll-component';
import { Acorn } from '@/components/illustrations';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreMessages = async () => {
    const offset = messages.length;
    const response = await fetch(`/api/messages?offset=${offset}&limit=20`);
    const newMessages = await response.json();

    if (newMessages.length < 20) setHasMore(false);
    setMessages((prev) => [...newMessages, ...prev]);
  };

  return (
    <div id="chat-container" style={{ height: '100vh', overflow: 'auto' }}>
      <InfiniteScroll
        dataLength={messages.length}
        next={loadMoreMessages}
        hasMore={hasMore}
        loader={
          <div style={{ textAlign: 'center', padding: 16, color: '#4B3424' }}>
            Loading earlier messages...
          </div>
        }
        scrollableTarget="chat-container"
        inverse={true}
        endMessage={
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Acorn size={48} color="#BD6809" />
            <p style={{ fontFamily: 'Kalam', color: '#4B3424', marginTop: 8 }}>
              You've reached the beginning! 🌱
            </p>
          </div>
        }
      >
        {/* Render messages */}
      </InfiniteScroll>
    </div>
  );
}
```

**Step 2: Create API endpoint for paginated messages**

Create `src/app/api/messages/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  const messages = await prisma.conversationMemory.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  return NextResponse.json(messages);
}
```

**Step 3: Test infinite scroll**

Scroll up in chat, verify more messages load.

Expected: Loads 20 messages at a time, shows "reached beginning" when done.

**Step 4: Commit**

```bash
git add src/app/\(routes\)/chat/page.tsx src/app/api/messages/route.ts
git commit -m "feat(chat): add infinite scroll for message history

- Load messages in batches of 20
- Preserve scroll position on load
- End message with acorn illustration
- API endpoint for paginated messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4.3: Create Highlights Panel

**Files:**
- Create: `src/components/chat/HighlightsPanel.tsx`
- Create: `src/lib/highlights.ts`
- Create: `src/app/api/highlights/route.ts`

**Step 1: Create highlights library**

```typescript
import prisma from './db';

export type Highlight = {
  id: string;
  userId: string;
  messageId?: string;
  content: string;
  type: 'FIRST_MASTERY' | 'DEEP_REFLECTION' | 'PROJECT_COMPLETED' | 'MANUAL';
  source: 'auto' | 'manual';
  impact?: string;
  userNote?: string;
  intent?: string;
  createdAt: Date;
};

export async function generateAutoHighlights(userId: string): Promise<Highlight[]> {
  const highlights: Highlight[] = [];

  // 1. First concept masteries
  const masteries = await prisma.userConceptMastery.findMany({
    where: { userId, level: { gte: 0.7 } },
    orderBy: { updatedAt: 'asc' },
    take: 5,
    include: { concept: true },
  });

  for (const mastery of masteries) {
    const conversation = await prisma.conversationMemory.findFirst({
      where: {
        userId,
        createdAt: { lte: mastery.updatedAt },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (conversation) {
      highlights.push({
        id: `mastery-${mastery.id}`,
        userId,
        messageId: conversation.id,
        content: conversation.content,
        type: 'FIRST_MASTERY',
        source: 'auto',
        impact: `First time mastering ${mastery.concept.name}!`,
        createdAt: mastery.updatedAt,
      } as Highlight);
    }
  }

  // 2. High-quality reflections
  const reflections = await prisma.reflectionEntry.findMany({
    where: { userId, depthScore: { gte: 0.7 } },
    orderBy: { depthScore: 'desc' },
    take: 5,
  });

  reflections.forEach((reflection) => {
    highlights.push({
      id: `reflection-${reflection.id}`,
      userId,
      content: reflection.content,
      type: 'DEEP_REFLECTION',
      source: 'auto',
      impact: `Reflection depth: ${Math.round(reflection.depthScore * 100)}%`,
      createdAt: reflection.createdAt,
    } as Highlight);
  });

  // 3. Completed projects
  const projects = await prisma.project.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  projects.forEach((project) => {
    highlights.push({
      id: `project-${project.id}`,
      userId,
      content: project.description,
      type: 'PROJECT_COMPLETED',
      source: 'auto',
      impact: `Completed: ${project.title}`,
      createdAt: project.updatedAt,
    } as Highlight);
  });

  return highlights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
}
```

**Step 2: Create highlights API**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generateAutoHighlights } from '@/lib/highlights';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get auto-generated highlights
  const autoHighlights = await generateAutoHighlights(user.userId);

  // Get manual highlights
  const manualHighlights = await prisma.highlight.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  });

  const allHighlights = [...autoHighlights, ...manualHighlights]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return NextResponse.json(allHighlights);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { messageId, content, userNote } = body;

  const highlight = await prisma.highlight.create({
    data: {
      userId: user.userId,
      messageId,
      content,
      type: 'MANUAL',
      source: 'manual',
      userNote,
    },
  });

  return NextResponse.json(highlight);
}
```

**Step 3: Create highlights panel component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Scroll } from '@/components/illustrations';
import type { Highlight } from '@/lib/highlights';

const INTENT_COLORS: Record<string, string> = {
  LIFE_LOG: '#BD6809',
  REFLECT: '#9A3F4A',
  INVESTIGATE: '#3D1419',
  BRAINSTORM: '#2F4731',
};

export function HighlightsPanel() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<'all' | 'manual' | 'auto'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    const response = await fetch('/api/highlights');
    const data = await response.json();
    setHighlights(data);
    setLoading(false);
  };

  const filteredHighlights = highlights.filter((h) =>
    filter === 'all' || h.source === filter
  );

  if (loading) {
    return <div style={{ padding: 24 }}>Loading highlights...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Kranky', color: '#2F4731', margin: 0 }}>
          ✨ Highlights
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'auto', 'manual'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: filter === f ? '2px solid #BD6809' : '1px solid #E7DAC3',
                background: filter === f ? 'rgba(189,104,9,0.1)' : '#FFF',
                cursor: 'pointer',
                fontFamily: 'Kalam',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {filteredHighlights.map((highlight) => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </div>

      {filteredHighlights.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Scroll size={80} color="#BD6809" />
          <p style={{ fontFamily: 'Kalam', color: '#4B3424', marginTop: 16 }}>
            No highlights yet. Click the ⭐ button on any message to save it!
          </p>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
  const borderColor = highlight.intent ? INTENT_COLORS[highlight.intent] : '#BD6809';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: '#FFFEF7',
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#4B3424' }}>
          {format(new Date(highlight.createdAt), 'MMM d, yyyy · h:mm a')}
        </span>
        {highlight.source === 'manual' && (
          <span style={{
            background: '#BD6809',
            color: '#FFF',
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
          }}>
            Manual
          </span>
        )}
      </div>

      <div style={{ fontFamily: 'Kalam', color: '#121B13', marginBottom: 12 }}>
        {highlight.content}
      </div>

      {highlight.impact && (
        <div style={{
          background: 'rgba(189,104,9,0.1)',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 14,
          color: '#4B3424',
        }}>
          <strong>Impact:</strong> {highlight.impact}
        </div>
      )}

      {highlight.userNote && (
        <div style={{
          marginTop: 8,
          fontStyle: 'italic',
          color: '#4B3424',
          fontSize: 14,
        }}>
          Note: {highlight.userNote}
        </div>
      )}
    </motion.div>
  );
}
```

**Step 4: Test highlights**

Navigate to highlights tab, verify auto-generated highlights appear.

Expected: Shows masteries, reflections, projects as highlight cards.

**Step 5: Commit**

```bash
git add src/components/chat/HighlightsPanel.tsx src/lib/highlights.ts src/app/api/highlights/route.ts
git commit -m "feat(chat): add highlights panel with auto-generation

- Auto-generate highlights from masteries, reflections, projects
- Manual highlight creation
- Filter by source (all, auto, manual)
- Beautiful cards with intent-based colors

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4.4: Create Insights Panel

**Files:**
- Create: `src/components/chat/InsightsPanel.tsx`
- Create: `src/app/api/insights/route.ts`

**Step 1: Create insights API**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getZPDConcepts } from '@/lib/zpd-engine';
import { differenceInDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  // Conversation stats
  const messages = await prisma.conversationMemory.findMany({
    where: conversationId ? { sessionId: conversationId } : { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  });

  const messageCount = messages.length;
  const firstMessage = messages[messages.length - 1];
  const lastMessage = messages[0];
  const duration = firstMessage && lastMessage
    ? differenceInDays(lastMessage.createdAt, firstMessage.createdAt)
    : 0;

  // Credits earned
  const transcriptEntries = await prisma.transcriptEntry.findMany({
    where: { userId: user.userId },
  });

  const creditsEarned = transcriptEntries.reduce((sum, entry) => sum + entry.credits, 0);
  const creditsBySubject = transcriptEntries.reduce((acc, entry) => {
    acc[entry.subject] = (acc[entry.subject] || 0) + entry.credits;
    return acc;
  }, {} as Record<string, number>);

  // Learning streak
  const activityDates = await prisma.conversationMemory.findMany({
    where: { userId: user.userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  let streak = 0;
  let currentDate = new Date();
  for (const activity of activityDates) {
    const diff = differenceInDays(currentDate, activity.createdAt);
    if (diff <= 1) {
      streak++;
      currentDate = activity.createdAt;
    } else {
      break;
    }
  }

  // ZPD concepts
  const zpdConcepts = await getZPDConcepts(user.userId);

  // Grade requirements
  const gradeLevel = user.gradeLevel || '9-12';
  // TODO: Load from config.toml based on grade level

  return NextResponse.json({
    messageCount,
    creditsEarned,
    creditsBySubject,
    duration,
    streak,
    zpdConcepts: zpdConcepts.slice(0, 3),
    activityData: activityDates.map(d => ({ date: d.createdAt, credits: 0.5 })),
  });
}
```

**Step 2: Create insights panel component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type InsightsData = {
  messageCount: number;
  creditsEarned: number;
  creditsBySubject: Record<string, number>;
  duration: number;
  streak: number;
  zpdConcepts: Array<{ id: string; name: string; description: string }>;
  activityData: Array<{ date: Date; credits: number }>;
};

export function InsightsPanel({ conversationId }: { conversationId?: string }) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [conversationId]);

  const fetchInsights = async () => {
    const url = conversationId
      ? `/api/insights?conversationId=${conversationId}`
      : '/api/insights';
    const response = await fetch(url);
    const data = await response.json();
    setInsights(data);
    setLoading(false);
  };

  if (loading || !insights) {
    return <div style={{ padding: 24 }}>Loading insights...</div>;
  }

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      style={{
        position: 'fixed',
        right: 0,
        top: 72,
        bottom: 0,
        width: 320,
        background: '#FFFFFF',
        borderLeft: '1px solid #E7DAC3',
        overflowY: 'auto',
        padding: 24,
      }}
    >
      {/* This Conversation */}
      <Section title="This Conversation">
        <Stat label="Messages" value={insights.messageCount} icon="💬" />
        <Stat label="Credits Earned" value={insights.creditsEarned.toFixed(1)} icon="⭐" />
        <Stat label="Time Span" value={`${insights.duration} days`} icon="⏱️" />

        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8, color: '#2F4731' }}>
            Credits by Subject
          </h4>
          {Object.entries(insights.creditsBySubject).map(([subject, credits]) => (
            <div
              key={subject}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                fontSize: 14,
                color: '#4B3424',
              }}
            >
              <span>{subject}</span>
              <span style={{ fontWeight: 700 }}>{credits.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Learning Streak */}
      <Section title="Learning Streak">
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>
          🔥
        </div>
        <div style={{
          fontSize: 24,
          fontFamily: 'Kranky',
          color: '#BD6809',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          {insights.streak} days
        </div>
        <p style={{ fontSize: 14, color: '#4B3424', textAlign: 'center', margin: 0 }}>
          Keep it up! You're building a habit.
        </p>
        {/* TODO: Add heatmap calendar */}
      </Section>

      {/* ZPD Recommendations */}
      <Section title="You're Ready To Learn">
        {insights.zpdConcepts.map((concept) => (
          <ZPDCard key={concept.id} concept={concept} />
        ))}
      </Section>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{
        fontFamily: 'Kranky',
        color: '#2F4731',
        fontSize: '1.1rem',
        marginBottom: 16,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      background: '#FFFEF7',
      border: '1px solid #E7DAC3',
      borderRadius: 8,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: 'Kalam', color: '#4B3424' }}>{label}</span>
      </div>
      <span style={{ fontWeight: 700, color: '#2F4731' }}>{value}</span>
    </div>
  );
}

function ZPDCard({ concept }: { concept: { name: string; description: string } }) {
  return (
    <div style={{
      background: 'rgba(189,104,9,0.05)',
      border: '1px solid rgba(189,104,9,0.2)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      cursor: 'pointer',
    }}>
      <div style={{ fontWeight: 700, color: '#2F4731', marginBottom: 4 }}>
        {concept.name}
      </div>
      <div style={{ fontSize: 13, color: '#4B3424' }}>
        {concept.description}
      </div>
    </div>
  );
}
```

**Step 3: Test insights panel**

Open chat, verify insights panel shows correct stats.

Expected: Shows message count, credits, streak, ZPD concepts.

**Step 4: Commit**

```bash
git add src/components/chat/InsightsPanel.tsx src/app/api/insights/route.ts
git commit -m "feat(chat): add conversation insights panel

- Real-time conversation stats
- Learning streak tracker
- Credits by subject breakdown
- ZPD concept recommendations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Final Integration & Polish

### Task 5.1: Wire Everything Together in Chat Page

**Files:**
- Modify: `src/app/(routes)/chat/page.tsx`

**Step 1: Import all new components**

```typescript
import { ChatErrorBoundary } from '@/components/chat/ChatErrorBoundary';
import { AdelineTyping } from '@/components/chat/AdelineTyping';
import { WaitingTips } from '@/components/chat/WaitingTips';
import { ChecklistWidget } from '@/components/onboarding/ChecklistWidget';
import { GenUIRenderer } from '@/components/gen-ui/GenUIRenderer';
import { InsightsPanel } from '@/components/chat/InsightsPanel';
```

**Step 2: Add state and integrate components**

```typescript
export default function ChatPage() {
  const [genUIPayload, setGenUIPayload] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      const metadata = (message as any).metadata;
      if (metadata?.genUIPayload) {
        setGenUIPayload(metadata.genUIPayload);
      }
    },
  });

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowTips(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowTips(false);
    }
  }, [isLoading]);

  return (
    <ChatErrorBoundary>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Main Chat Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Messages with infinite scroll */}
          {/* ... */}

          {/* Loading State */}
          {isLoading && (
            <>
              <AdelineTyping />
              <WaitingTips show={showTips} />
            </>
          )}

          {/* GenUI Components */}
          {genUIPayload && <GenUIRenderer payload={genUIPayload} />}

          {/* Input */}
          {/* ... */}
        </div>

        {/* Sidebar Widgets */}
        <ChecklistWidget />
        {showInsights && <InsightsPanel />}
      </div>
    </ChatErrorBoundary>
  );
}
```

**Step 3: Test full flow**

1. Open chat → checklist widget appears
2. Send message → Adeline typing animation
3. Wait >5s → tips appear
4. Complete intents → checklist updates
5. Insights panel shows stats

**Step 4: Commit**

```bash
git add src/app/\(routes\)/chat/page.tsx
git commit -m "feat(chat): integrate all delight & wow features

- Wire GenUIRenderer with animations
- Add Adeline typing + waiting tips
- Show checklist widget for onboarding
- Display insights panel
- Wrap in error boundary

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5.2: Update Landing Page with Demo Link

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add prominent Try Demo button**

```typescript
// In HeroSection, add prominent CTA:
<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
  <Button href="/playground" filled>
    Try Demo — No Login Required
  </Button>
  <Button href="/chat">Join the Academy</Button>
  <Button href="/login">Learn More</Button>
</div>
```

**Step 2: Test navigation**

Click "Try Demo" → should go to playground.

Expected: Landing page prominently features demo CTA.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(landing): add prominent demo CTA

- Try Demo button as primary CTA
- No login required messaging
- Links to playground route

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5.3: Performance Optimization

**Files:**
- Modify: `src/app/(routes)/chat/page.tsx`
- Modify: Various components

**Step 1: Add React.memo to expensive components**

```typescript
import { memo } from 'react';

export const GenUIRenderer = memo(function GenUIRenderer({ payload }) {
  // ... component code
});

export const AdelineTyping = memo(function AdelineTyping({ intent }) {
  // ... component code
});

export const HighlightCard = memo(function HighlightCard({ highlight }) {
  // ... component code
});
```

**Step 2: Add useMemo for expensive calculations**

```typescript
const groupedMessages = useMemo(() =>
  groupMessagesByDate(messages),
  [messages]
);

const filteredHighlights = useMemo(() =>
  highlights.filter(h => filter === 'all' || h.source === filter),
  [highlights, filter]
);
```

**Step 3: Test performance**

Use React DevTools Profiler, verify no unnecessary re-renders.

Expected: Smooth 60fps animations, no jank on scroll.

**Step 4: Commit**

```bash
git add src/app/\(routes\)/chat/page.tsx src/components/
git commit -m "perf: optimize component re-renders

- Add React.memo to expensive components
- Memoize filtered/grouped data
- Prevent unnecessary animations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Testing & Verification

### Manual Testing Checklist

Run through these scenarios:

1. **GenUI Streaming:**
   - [ ] Send "I baked bread today" → TranscriptCard renders with confetti
   - [ ] Send "who profits from Common Core?" → InvestigationBoard renders
   - [ ] Hover over cards → smooth lift animation

2. **Onboarding:**
   - [ ] Visit /playground → suggested prompts work
   - [ ] Click prompt → auto-fills and submits
   - [ ] First-time user → sees checklist widget
   - [ ] Complete all 5 checklist items → celebration modal

3. **Loading & Errors:**
   - [ ] Send message → Adeline typing animation appears
   - [ ] Wait >5s → tips rotate every 4s
   - [ ] Trigger network error → friendly error message
   - [ ] Click retry → works correctly

4. **Message History:**
   - [ ] Messages grouped by date with dividers
   - [ ] Scroll up → loads more messages
   - [ ] Reach beginning → shows acorn illustration
   - [ ] Timeline markers appear for key moments

5. **Highlights:**
   - [ ] Auto-generated highlights appear
   - [ ] Click ⭐ on message → saves to highlights
   - [ ] Filter by source → works correctly
   - [ ] Export highlight → downloads PNG

6. **Insights:**
   - [ ] Shows correct message count
   - [ ] Shows credits earned by subject
   - [ ] Displays learning streak
   - [ ] ZPD concepts appear with descriptions

### Performance Testing

```bash
# Run Lighthouse audit
npm run build
npm run start
# Open Chrome DevTools → Lighthouse → Run audit

# Target scores:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >95
# - SEO: >90
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] No console errors in dev
- [ ] Database migrations applied
- [ ] Environment variables documented

### Deploy Command

```bash
# Commit all changes
git add .
git commit -m "feat: complete Delight & Wow implementation

All 4 features complete:
- GenUI payload streaming with animations
- Magical onboarding (playground, checklist, welcome flow)
- Personality-driven loading and errors
- Rich message history with highlights and insights

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to main
git push origin main

# Deploy to Vercel (if configured)
vercel --prod
```

---

## Rollback Plan

If issues arise in production:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback in Vercel dashboard
# Deployments → Previous Deployment → Promote to Production
```

---

## Success Metrics (Track After Launch)

**Week 1 Goals:**
- [ ] 80%+ onboarding completion rate
- [ ] 0 critical bugs reported
- [ ] <100ms p95 latency for animations
- [ ] 5+ user testimonials mentioning "delightful"

**Week 2 Goals:**
- [ ] 10%+ of users share conversation snippets
- [ ] 50%+ of users explore highlights tab
- [ ] Learning streak >3 days for 30%+ users
- [ ] Positive feedback score >4.5/5

---

## Appendix: Animation Reference

### Spring Physics
```typescript
const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};
```

### Easing Functions
```typescript
// Use for entrance animations
ease: [0.4, 0, 0.2, 1]  // Material Design easing

// Use for exit animations
ease: [0.4, 0, 1, 1]
```

### Duration Guidelines
- Micro-interactions (hover): 150-200ms
- Entrance animations: 300-400ms
- Exit animations: 200-300ms
- Page transitions: 400-600ms

---

**END OF IMPLEMENTATION PLAN**

**Total Estimated Time:** 12-16 hours
**Tasks:** 22 major tasks across 4 features
**Files Created:** 15+ new components
**Files Modified:** 10+ existing files
