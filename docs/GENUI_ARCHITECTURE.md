# GenUI Architecture: Bidirectional Interface Generation

Dear Adeline's Generative UI system transforms AI responses into interactive React components with a **closed adaptive loop** — components can dispatch events back to LangGraph to trigger real-time remediation.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BIDIRECTIONAL GENUI FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │  User    │───▶│  Router  │───▶│ GenUI    │───▶│  GenUIRenderer       │  │
│  │  Prompt  │    │          │    │ Planner  │    │  (React Components)  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────────┘  │
│                                                            │               │
│                                                            ▼               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    DUAL DISPATCH FROM COMPONENTS                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  1. REAL-TIME REMEDIATION (via useGenUIRemediation)                  │  │
│  │     └─▶ [REMEDIATION:STUCK] message ─▶ Router ─▶ New GenUI Component │  │
│  │                                                                       │
│  │  2. PERSISTENT TELEMETRY (via useGenUITelemetry)                     │  │
│  │     └─▶ /api/genui/telemetry ─▶ Database ─▶ Future Personalization   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. JSON Payload Schema

All GenUI components receive props via a standardized JSON payload:

```typescript
interface GenUIPayload {
  component: string;           // Component name (e.g., 'CalibratedQuiz')
  props: Record<string, any>;  // Props matching the component's Zod schema
}
```

### 2. Pedagogical State Schema

Interactive components extend `PedagogicalStateSchema` for adaptive learning:

```typescript
// src/lib/gen-ui/pattern-library.ts
export const PedagogicalStateSchema = z.object({
  difficultyLevel: z.enum(['intro', 'standard', 'challenge']).default('standard'),
  isScaffolded: z.boolean().default(false),
  previousMisconceptions: z.array(z.string()).optional(),
  hintLevel: z.number().min(0).max(3).default(0),
  maxAttempts: z.number().optional(),
  componentId: z.string().optional(),
});
```

### 3. Component Registry

`GenUIRenderer.tsx` maps component names to React components:

```typescript
const componentMap: Record<string, React.ComponentType<any>> = {
  TranscriptCard,
  CalibratedQuiz,
  DragTimelineCard,
  InteractiveConceptMap,
  Flashcard,
  // ... 29 total components
};
```

---

## Bidirectional Communication

### Real-Time Remediation Loop

When a student struggles, components trigger immediate UI updates via the active chat stream:

```typescript
// In CalibratedQuiz.tsx
const { requestRemediation } = useGenUIRemediation();

// When student is confidently wrong (misconception detected)
if (!correct && confidence === 'sure') {
  requestRemediation({
    type: 'concept_confused',
    componentType: 'CalibratedQuiz',
    componentId,
    misconception: `Student was confident but wrong on: "${question}"`,
  });
}
```

**Flow:**
1. Component calls `requestRemediation()`
2. Context injects `[REMEDIATION:TYPE]` message via `useChat.append()`
3. Router detects remediation prefix, sets `intent: 'REMEDIATION'`
4. `getRemediationComponent()` selects scaffolded component
5. New component streams down on same connection (zero latency)

### Persistent Telemetry Loop

For long-term mastery tracking (doesn't trigger immediate UI):

```typescript
// In DragTimelineCard.tsx
const { dispatch: dispatchTelemetry } = useGenUITelemetry(componentId, 'DragTimelineCard');

// On completion
dispatchTelemetry({
  type: 'complete',
  correct: isCorrect,
  score: 85,
  timeMs: 45000,
  difficultyLevel,
});
```

**Flow:**
1. Component calls `dispatchTelemetry()`
2. Event batched and sent to `/api/genui/telemetry`
3. Endpoint updates `UserConceptMastery`, `LearningGap` tables
4. Next session uses this data for personalized component selection

---

## Key Files

| File | Purpose |
|------|---------|
| `src/components/gen-ui/GenUIRenderer.tsx` | Maps JSON payloads to React components |
| `src/lib/gen-ui/pattern-library.ts` | Zod schemas + `PedagogicalStateSchema` |
| `src/hooks/useGenUITelemetry.ts` | Fire-and-forget analytics hook |
| `src/contexts/GenUIRemediationContext.tsx` | Real-time remediation dispatch |
| `src/lib/langgraph/router.ts` | Intent classification + remediation detection |
| `src/app/api/chat/route.ts` | Streaming + `getRemediationComponent()` |
| `src/app/api/genui/telemetry/route.ts` | Persistent mastery updates |

---

## Streaming Protocol

Uses Vercel AI SDK v1 data stream format:

```
0:"text chunk"           # Text content
2:{"genUIPayload":{...}} # GenUI annotation
```

Components are streamed as annotations, rendered inline by `GenUIRenderer`.

---

## Adding New Interactive Components

1. **Create component** in `src/components/gen-ui/patterns/`
2. **Add Zod schema** to `pattern-library.ts` (extend `PedagogicalStateSchema`)
3. **Register** in `GenUIRenderer.tsx` componentMap
4. **Wire dual dispatch**:
   - `useGenUITelemetry` for persistent tracking
   - `useGenUIRemediation` for real-time help when student struggles

Example:
```typescript
export function NewComponent({ 
  componentId = `new-${Date.now()}`,
  difficultyLevel = 'standard',
  isScaffolded = false,
  maxAttempts = 3,
  ...props 
}: NewComponentProps) {
  const { dispatch } = useGenUITelemetry(componentId, 'NewComponent');
  const { requestRemediation } = useGenUIRemediation();
  
  const handleComplete = (success: boolean) => {
    dispatch({ type: success ? 'complete' : 'attempt', ... });
    
    if (!success && attempts >= maxAttempts) {
      requestRemediation({ type: 'student_stuck', ... });
    }
  };
}
```

---

## Remediation Component Selection

When `REMEDIATION` intent is detected, `getRemediationComponent()` selects:

| Remediation Type | Component | Trigger |
|-----------------|-----------|---------|
| `STUCK` (3+ failures) | `Flashcard` | Multiple failed attempts |
| `STUCK` (<3 failures) | `InteractiveConceptMap` | Early struggle |
| `HINT` | `MnemonicCard` | Explicit hint request |
| `SCAFFOLD` | `StepList` | "Break it down" request |
| `MISCONCEPTION` | `AnalogyCard` | Confidently wrong answer |

---

## Database Integration

Telemetry updates these Prisma models:

- **`UserActivity`** — All events logged for analytics
- **`UserConceptMastery`** — Mastery level per concept
- **`LearningGap`** — Detected struggles for future scaffolding

---

## Future Enhancements

- [ ] **Dual Coding Components** — `NarratedDiagram`, `AudioGraphicDialogue`
- [ ] **Progressive Rendering** — Skeleton payloads with delta patching
- [ ] **Weighted Tag Matching** — Smarter component selection
- [ ] **Context-Aware Selection** — Use `detectedGaps` for component choice
