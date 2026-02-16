# Delight & Wow: Product Polish Sprint
**Date:** 2026-02-16
**Status:** Approved
**Timeline:** This week (Priority items today)

## Executive Summary

Transform Dear Adeline from a functional AI learning companion into a magical, delightful experience that creates viral word-of-mouth. Focus on four critical areas:

1. **Fix genUIPayload streaming bug** - Enable generative UI components
2. **Magical onboarding** - Interactive playground, personalized setup, gamified checklist
3. **Personality-driven loading/errors** - Adeline's voice throughout, "while you wait" tips
4. **Rich message history** - Timeline view, highlights, insights, shareable moments

## Success Metrics

- New users complete onboarding checklist (target: 80%)
- GenUI components render successfully (target: 100% of eligible responses)
- Error recovery rate increases (target: 90% retry after friendly error)
- Users share conversation snippets (target: 10% of sessions)
- Time to first "wow moment" < 2 minutes

---

## 1. GenUI Payload Streaming Fix + Magical Animations

### Problem
The `genUIPayload` is computed by `genUIPlanner` and saved to DB, but never reaches the client. Generative UI components (TranscriptCard, InvestigationBoard, ProjectImpactCard, MissionBriefing) never render.

### Solution

#### Server Side (Already 80% Done)
- `messageMetadata` in chat route (line 279-283) contains `genUIPayload`
- `toUIMessageStreamResponse` sends metadata via AI SDK stream protocol
- No changes needed on server

#### Client Side (New Implementation)

**File: `src/app/(routes)/chat/page.tsx`**

Add metadata handler to useChat hook:
```typescript
const [genUIPayload, setGenUIPayload] = useState<GenUIPayload | null>(null);

const { messages, append, isLoading } = useChat({
  api: '/api/chat',
  onMessageUpdate: (message) => {
    const metadata = message.metadata;
    if (metadata?.genUIPayload) {
      setGenUIPayload(metadata.genUIPayload);
    }
  }
});
```

**New Component: `src/components/gen-ui/GenUIRenderer.tsx`**

Dynamic component renderer with animation:
```typescript
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

const componentMap = {
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
};

export function GenUIRenderer({ payload }: { payload: GenUIPayload }) {
  const Component = componentMap[payload.type];
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (payload.type === 'TranscriptCard') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [payload.type]);

  return (
    <>
      {showConfetti && <Confetti numberOfPieces={50} recycle={false} />}
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

### Animation Enhancements

**Install Dependencies:**
```bash
npm install framer-motion react-confetti
```

**Contextual Celebrations:**
- **TranscriptCard**: Brief confetti burst (50 pieces, 3s duration), Papaya-colored
- **InvestigationBoard**: Documents "shuffle" into place (stagger children by 80ms)
- **Credits logged**: Floating particles animation (custom CSS)
- **Scripture notes**: Slide in from left with Paradise color

**Micro-interactions:**
- Hover on credit badges: `scale: 1.05` with spring physics
- GenUI cards: Lift shadow on hover (`boxShadow: '0 16px 32px rgba(0,0,0,0.12)'`)
- Gap nudges: Gentle shake animation (`@keyframes nudgeShake`)

**Visual Polish:**
All genUI components receive:
- Subtle drop shadow: `0 12px 28px rgba(0,0,0,0.08)`
- Colored left border (4px) based on intent:
  - LIFE_LOG: Papaya (#BD6809)
  - REFLECT: Paradise (#9A3F4A)
  - INVESTIGATE: Fuschia (#3D1419)
  - BRAINSTORM: Palm Frond (#2F4731)

---

## 2. Magical Onboarding Experience

### Landing Page Enhancement

**File: `src/app/page.tsx`**

#### Add Interactive Demo Video

Replace `HeroChatMock` with embedded video:
```typescript
function HeroVideoDemo() {
  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden' }}>
      <iframe
        src="[LOOM_URL]" // Record 60-90s demo
        style={{ width: '100%', height: 400, border: 'none' }}
        allowFullScreen
      />
      <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <Button href="/playground" filled>Try It Yourself →</Button>
      </div>
    </div>
  );
}
```

**Demo Video Script (60-90 seconds):**
1. "Meet Adeline" (5s) - Show landing page
2. "Turn life into learning" (15s) - Type "I baked bread today", show TranscriptCard
3. "Learn discernment" (15s) - Type "who profits from Common Core?", show InvestigationBoard
4. "Build with purpose" (15s) - Show project brainstorming with service component
5. "Track everything automatically" (10s) - Show parent dashboard with credits
6. CTA: "Join thousands of homeschool families" (5s)

### Interactive Playground

**New Route: `src/app/playground/page.tsx`**

No-login demo experience:

```typescript
const SUGGESTED_PROMPTS = [
  { text: "I baked sourdough bread today", intent: "LIFE_LOG", icon: "🍞" },
  { text: "Who really profits from standardized testing?", intent: "INVESTIGATE", icon: "🔍" },
  { text: "I want to build a chicken coop", intent: "BRAINSTORM", icon: "🛠️" },
  { text: "Help me reflect on what I learned this week", intent: "REFLECT", icon: "💭" },
];

function PromptChip({ prompt, onClick }: { prompt: typeof SUGGESTED_PROMPTS[0], onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
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
      <span style={{ fontFamily: 'Kalam', color: '#2F4731' }}>{prompt.text}</span>
    </motion.button>
  );
}
```

**Easter Egg:** When user types freeform (not using suggested prompts), Adeline responds with extra personality:
> "I love your curiosity! I'm Adeline, and I'm here to turn your real life into real learning. You can ask me anything—from baking chemistry to building business plans. What interests you?"

### Personalized Onboarding (First-Time User)

**New Component: `src/components/onboarding/WelcomeFlow.tsx`**

```typescript
const ONBOARDING_STEPS = [
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

function WelcomeFlow({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});

  // Progress bar
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;

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
      <div style={{ width: '100%', maxWidth: 600, padding: 24 }}>
        <ProgressBar value={progress} />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
          >
            {/* Step content */}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

**After Setup: Personalized First Message**

```typescript
function generateWelcomeMessage(data: OnboardingData): string {
  const { childName, interests } = data;
  const interestText = interests.slice(0, 2).join(' and ');

  return `Hi ${childName}! I heard you love ${interestText}. ${getPersonalizedHook(interests)} I'm here to help you turn those interests into real learning!`;
}

function getPersonalizedHook(interests: string[]): string {
  const hooks: Record<string, string> = {
    baking: "Have you ever thought about the chemistry that makes bread rise?",
    animals: "Did you know that caring for chickens teaches biology, economics, and responsibility?",
    coding: "What if you could build apps that solve real problems in your community?",
    // ... more hooks
  };

  return hooks[interests[0]] || "There's so much to discover together!";
}
```

### Gamified Onboarding Checklist

**New Component: `src/components/onboarding/ChecklistWidget.tsx`**

Floating widget (collapsible) in chat interface:

```typescript
const CHECKLIST_ITEMS = [
  { id: 'meet', label: 'Meet Adeline', autoComplete: true },
  { id: 'life_log', label: 'Log your first activity', intent: 'LIFE_LOG' },
  { id: 'investigate', label: 'Explore an investigation', intent: 'INVESTIGATE' },
  { id: 'brainstorm', label: 'Start a project', intent: 'BRAINSTORM' },
  { id: 'reflect', label: 'Reflect on your learning', intent: 'REFLECT' },
];

function ChecklistWidget() {
  const [expanded, setExpanded] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set(['meet']));

  const progress = (completed.size / CHECKLIST_ITEMS.length) * 100;

  return (
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
      }}
    >
      {expanded ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3>Getting Started</h3>
            <button onClick={() => setExpanded(false)}>−</button>
          </div>
          <ProgressBar value={progress} />
          {CHECKLIST_ITEMS.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              completed={completed.has(item.id)}
              onComplete={() => handleComplete(item.id)}
            />
          ))}
        </>
      ) : (
        <CircularProgress value={progress} onClick={() => setExpanded(true)} />
      )}
    </motion.div>
  );
}
```

**Completion Celebration:**
When user completes all 5 steps:
- Full-screen confetti (200 pieces, 5s duration)
- Modal: "🎉 You're ready! Now the real adventure begins."
- Badge unlocked: "Adeline Academy Student"
- Checklist widget fades out after 3 seconds

---

## 3. Loading States with Personality

### Adeline "Typing" Animation

**New Component: `src/components/chat/AdelineTyping.tsx`**

```typescript
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

export function AdelineTyping({ intent }: { intent?: string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Rotate messages every 3s
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % THINKING_MESSAGES.length);
    }, 3000);

    // Show progress stages after 3s
    const progressTimer = setTimeout(() => setShowProgress(true), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(progressTimer);
    };
  }, []);

  useEffect(() => {
    if (!showProgress) return;

    const stages = [
      { time: 0, text: "Understanding your question..." },
      { time: 2000, text: "Searching my knowledge..." },
      { time: 5000, text: "Crafting a thoughtful response..." },
    ];

    stages.forEach(({ time, text }, idx) => {
      setTimeout(() => setStage(idx), time);
    });
  }, [showProgress]);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <WheatStalk size={32} color="#BD6809" />
      </motion.div>

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
        {/* Shimmer effect */}
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
          }}
        />

        <div style={{ fontFamily: 'Kalam', color: '#121B13', marginBottom: 8 }}>
          {intent ? INTENT_MESSAGES[intent] : THINKING_MESSAGES[messageIndex]}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
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

        {showProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: 12 }}
          >
            <div style={{ fontSize: 12, color: '#4B3424', marginBottom: 4 }}>
              {stages[stage].text}
            </div>
            <ProgressBar value={(stage + 1) * 33} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
```

### Error Handling in Adeline's Voice

**New Component: `src/components/chat/ErrorBoundary.tsx`**

```typescript
const ERROR_MESSAGES: Record<string, ErrorMessage> = {
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
};

export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorDisplay
          error={error}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

function ErrorDisplay({ error, onRetry }: { error: Error, onRetry: () => void }) {
  const errorType = detectErrorType(error);
  const config = ERROR_MESSAGES[errorType];

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
      }}
    >
      {config.illustration}
      <h3 style={{ fontFamily: 'Kranky', color: '#2F4731', marginTop: 16 }}>
        {config.title}
      </h3>
      <p style={{ fontFamily: 'Kalam', color: '#4B3424', margin: '12px 0' }}>
        {config.message}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        {config.actions.map(action => (
          <Button
            key={action.label}
            onClick={() => handleAction(action.action, onRetry)}
            filled={action.primary}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
```

**Auto-Retry Logic:**

```typescript
function useAutoRetry(fn: () => Promise<void>, maxAttempts = 2) {
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const retry = useCallback(async () => {
    if (attempts >= maxAttempts) return;

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          fn().catch(() => setAttempts(a => a + 1));
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [attempts, fn, maxAttempts]);

  return { retry, attempts, countdown };
}
```

### "While You Wait" Tips

**New Component: `src/components/chat/WaitingTips.tsx`**

```typescript
const TIPS = [
  { icon: "💡", text: "Did you know? You can upload photos of your projects for instant credits!" },
  { icon: "🌾", text: "Tip: Ask me 'who profits from...' to investigate any topic." },
  { icon: "📚", text: "Try saying 'I want to reflect on my week' for guided self-assessment." },
  { icon: "🎨", text: "Your learning is automatically tracked—check your transcript anytime!" },
  { icon: "⚡", text: "Pro tip: The more specific your description, the better credits I can award." },
  { icon: "🔍", text: "I can search my library of trusted Christian resources for any topic." },
  { icon: "🌱", text: "Every project should help someone—service learning is built into everything!" },
  { icon: "📖", text: "Want to explore Greek or Hebrew? Ask about any Bible verse!" },
  { icon: "🏆", text: "Building a portfolio? All your work is saved for state compliance reports." },
  { icon: "🤝", text: "Join clubs to connect with other homeschool families learning together!" },
];

export function WaitingTips({ show }: { show: boolean }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length);
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
        <span style={{ marginRight: 8 }}>{tip.icon}</span>
        {tip.text}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 4. Message History + Conversation Insights

### Timeline View with Visual Markers

**Enhanced Chat Component: `src/app/(routes)/chat/page.tsx`**

```typescript
function groupMessagesByDate(messages: Message[]): GroupedMessages {
  const groups: GroupedMessages = {};

  messages.forEach(msg => {
    const date = new Date(msg.createdAt);
    const key = getDateKey(date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });

  return groups;
}

function getDateKey(date: Date): string {
  const now = new Date();
  const diff = differenceInDays(now, date);

  if (diff === 0) return "Today's Learning";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "Last Week";
  if (diff < 14) return "Two Weeks Ago";
  return format(date, 'MMMM d, yyyy');
}

function DateDivider({ label }: { label: string }) {
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
      <WheatDivider />
      <span style={{
        fontFamily: 'Kranky',
        color: '#BD6809',
        fontSize: '1.1rem',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <WheatDivider />
    </motion.div>
  );
}
```

**Timeline Markers:**

```typescript
function TimelineMarker({ type, data }: { type: MarkerType, data: any }) {
  const config = MARKER_CONFIGS[type];

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      onClick={() => handleMarkerClick(data)}
      style={{
        position: 'absolute',
        left: -40,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: config.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {config.icon}
    </motion.div>
  );
}

const MARKER_CONFIGS = {
  CREDIT_EARNED: {
    icon: <span style={{ fontSize: 16 }}>⭐</span>,
    color: '#BD6809',
    label: (data: any) => `${data.amount} ${data.subject}`,
  },
  PROJECT_STARTED: {
    icon: <Lightbulb size={18} color="#FFFFFF" />,
    color: '#2F4731',
    label: (data: any) => data.projectName,
  },
  INVESTIGATION: {
    icon: <MagnifyingGlass size={18} color="#FFFFFF" />,
    color: '#3D1419',
    label: (data: any) => data.topic,
  },
  REFLECTION: {
    icon: <Dove size={18} color="#FFFFFF" />,
    color: '#9A3F4A',
    label: (data: any) => 'Deep reflection',
  },
  MILESTONE: {
    icon: <span style={{ fontSize: 16 }}>🏆</span>,
    color: '#FFD700',
    label: (data: any) => data.achievement,
  },
};
```

**Infinite Scroll:**

```typescript
function ChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const offset = messages.length;
    const newMessages = await fetchMessages({ offset, limit: 20 });

    if (newMessages.length < 20) setHasMore(false);
    setMessages(prev => [...newMessages, ...prev]);
    setLoading(false);
  };

  return (
    <InfiniteScroll
      dataLength={messages.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<LoadingIndicator />}
      scrollableTarget="chat-container"
      inverse
    >
      {!hasMore && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Acorn size={48} color="#BD6809" />
          <p style={{ fontFamily: 'Kalam', color: '#4B3424', marginTop: 8 }}>
            You've reached the beginning of your learning journey! 🌱
          </p>
        </div>
      )}

      {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
        <Fragment key={date}>
          <DateDivider label={date} />
          {msgs.map(msg => (
            <MessageWithMarkers key={msg.id} message={msg} />
          ))}
        </Fragment>
      ))}
    </InfiniteScroll>
  );
}
```

### Highlights Tab

**New Component: `src/components/chat/HighlightsPanel.tsx`**

```typescript
function HighlightsPanel() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<'all' | 'manual' | 'auto'>('all');

  useEffect(() => {
    fetchHighlights().then(setHighlights);
  }, []);

  const filteredHighlights = highlights.filter(h =>
    filter === 'all' || h.source === filter
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Kranky', color: '#2F4731' }}>✨ Highlights</h2>
        <FilterButtons value={filter} onChange={setFilter} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {filteredHighlights.map(highlight => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </div>

      {filteredHighlights.length === 0 && (
        <EmptyState
          illustration={<Scroll size={80} color="#BD6809" />}
          message="No highlights yet. Click the ⭐ button on any message to save it!"
        />
      )}
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
  const borderColor = INTENT_COLORS[highlight.intent];

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#4B3424' }}>
          {format(new Date(highlight.createdAt), 'MMM d, yyyy · h:mm a')}
        </span>
        {highlight.source === 'manual' && <Badge>Manual</Badge>}
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

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <IconButton onClick={() => shareHighlight(highlight)}>
          <Share size={16} />
        </IconButton>
        <IconButton onClick={() => exportHighlight(highlight)}>
          <Download size={16} />
        </IconButton>
        <IconButton onClick={() => deleteHighlight(highlight.id)}>
          <Trash size={16} />
        </IconButton>
      </div>
    </motion.div>
  );
}
```

**Auto-Generated Highlights Algorithm:**

```typescript
async function generateHighlights(userId: string): Promise<Highlight[]> {
  const highlights: Highlight[] = [];

  // 1. First concept masteries
  const masteries = await prisma.userConceptMastery.findMany({
    where: { userId, level: { gte: 0.7 } },
    orderBy: { updatedAt: 'asc' },
    take: 10,
  });

  for (const mastery of masteries) {
    const conversation = await findConversationForMastery(mastery);
    if (conversation) {
      highlights.push({
        type: 'FIRST_MASTERY',
        content: conversation.content,
        impact: `First time mastering ${mastery.concept.name}!`,
        createdAt: mastery.updatedAt,
      });
    }
  }

  // 2. High-quality reflections
  const reflections = await prisma.reflectionEntry.findMany({
    where: { userId, depthScore: { gte: 0.7 } },
    orderBy: { depthScore: 'desc' },
    take: 10,
  });

  reflections.forEach(reflection => {
    highlights.push({
      type: 'DEEP_REFLECTION',
      content: reflection.content,
      impact: `Reflection depth: ${Math.round(reflection.depthScore * 100)}%`,
      createdAt: reflection.createdAt,
    });
  });

  // 3. Project milestones
  const projects = await prisma.project.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  projects.forEach(project => {
    highlights.push({
      type: 'PROJECT_COMPLETED',
      content: project.description,
      impact: `Completed: ${project.title}`,
      createdAt: project.updatedAt,
    });
  });

  // Sort by date and return top 20
  return highlights.sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  ).slice(0, 20);
}
```

### Conversation Insights Panel

**New Component: `src/components/chat/InsightsPanel.tsx`**

```typescript
function InsightsPanel({ conversationId }: { conversationId: string }) {
  const insights = useConversationInsights(conversationId);
  const userData = useUserData();

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
      <InsightSection title="This Conversation">
        <Stat label="Messages" value={insights.messageCount} icon="💬" />
        <Stat label="Credits Earned" value={insights.creditsEarned} icon="⭐" />
        <Stat label="Time Spent" value={formatDuration(insights.duration)} icon="⏱️" />

        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Concepts Explored</h4>
          {insights.concepts.map(concept => (
            <ConceptBadge key={concept.id} concept={concept} />
          ))}
        </div>
      </InsightSection>

      {/* Learning Streak */}
      <InsightSection title="Learning Streak">
        <div style={{ fontSize: 24, fontFamily: 'Kranky', color: '#BD6809' }}>
          🔥 {userData.streak} days
        </div>
        <p style={{ fontSize: 14, color: '#4B3424', marginTop: 4 }}>
          Keep it up! You're building a habit.
        </p>
        <HeatmapCalendar data={userData.activityData} />
      </InsightSection>

      {/* Progress Toward Goals */}
      <InsightSection title="Progress Toward Goals">
        {userData.gradeRequirements.map(req => (
          <ProgressItem
            key={req.subject}
            label={req.subject}
            current={req.earned}
            target={req.required}
            color={SUBJECT_COLORS[req.subject]}
          />
        ))}
      </InsightSection>

      {/* ZPD Recommendations */}
      <InsightSection title="You're Ready To Learn">
        {userData.zpdConcepts.slice(0, 3).map(concept => (
          <ZPDCard
            key={concept.id}
            concept={concept}
            onClick={() => startLearningConversation(concept)}
          />
        ))}
      </InsightSection>
    </motion.div>
  );
}

function HeatmapCalendar({ data }: { data: ActivityData[] }) {
  const weeks = groupByWeeks(data, 12); // Last 12 weeks

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 12 }}>
      {weeks.flat().map((day, idx) => (
        <Tooltip key={idx} content={`${day.date}: ${day.credits} credits`}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: getHeatmapColor(day.credits),
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
}

function getHeatmapColor(credits: number): string {
  if (credits === 0) return '#E7DAC3';
  if (credits < 0.5) return 'rgba(189,104,9,0.3)';
  if (credits < 1.0) return 'rgba(189,104,9,0.6)';
  return '#BD6809';
}
```

### Share Conversation Snippets

**New Component: `src/components/chat/ShareSnippet.tsx`**

```typescript
function ShareSnippet({ messages, onClose }: { messages: Message[], onClose: () => void }) {
  const [template, setTemplate] = useState<TemplateType>('student');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const templates: Record<TemplateType, Template> = {
    student: {
      title: "Look what I learned!",
      color: '#BD6809',
      illustration: <Lightbulb size={60} color="#BD6809" />,
    },
    parent: {
      title: "Homeschool win!",
      color: '#2F4731',
      illustration: <WheatStalk size={60} color="#2F4731" />,
    },
    investigation: {
      title: "Check out this investigation",
      color: '#3D1419',
      illustration: <MagnifyingGlass size={60} color="#3D1419" />,
    },
  };

  const generateImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#FFFEF7';
    ctx.fillRect(0, 0, 800, 600);

    // Template styling
    const tpl = templates[template];
    ctx.fillStyle = tpl.color;
    ctx.font = 'bold 36px "Kranky"';
    ctx.fillText(tpl.title, 50, 80);

    // Messages (max 3)
    const snippetMessages = messages.slice(-3);
    let y = 150;

    snippetMessages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';

      // Bubble background
      ctx.fillStyle = isUser ? '#2F4731' : '#FFFFFF';
      roundRect(ctx, 50, y, 700, 80, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = isUser ? '#2F4731' : '#E7DAC3';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.fillStyle = isUser ? '#FFFFFF' : '#121B13';
      ctx.font = '18px "Kalam"';
      wrapText(ctx, msg.content, 70, y + 30, 660, 24);

      y += 100;
    });

    // Footer
    ctx.fillStyle = '#4B3424';
    ctx.font = '16px "Kalam"';
    ctx.fillText('Powered by Dear Adeline Academy', 50, 560);

    // Convert to blob
    canvas.toBlob(blob => {
      if (blob) saveAs(blob, 'adeline-snippet.png');
    });
  }, [messages, template]);

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 24 }}>
        <h2 style={{ fontFamily: 'Kranky', color: '#2F4731', marginBottom: 16 }}>
          Share Your Learning
        </h2>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {Object.keys(templates).map(key => (
            <button
              key={key}
              onClick={() => setTemplate(key as TemplateType)}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: template === key ? '2px solid #BD6809' : '1px solid #E7DAC3',
                background: template === key ? 'rgba(189,104,9,0.1)' : '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {templates[key as TemplateType].title}
            </button>
          ))}
        </div>

        <canvas ref={canvasRef} style={{ border: '1px solid #E7DAC3', borderRadius: 12 }} />

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Button onClick={generateImage} filled>
            Download Image
          </Button>
          <Button onClick={() => shareOnSocial('twitter')}>
            Share on X
          </Button>
          <Button onClick={() => shareOnSocial('facebook')}>
            Share on Facebook
          </Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" required />
            <span style={{ fontSize: 14, color: '#4B3424' }}>
              I confirm this content is safe to share publicly (no personal information)
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
```

---

## Implementation Dependencies

### New npm Packages

```bash
npm install framer-motion react-confetti react-infinite-scroll-component
npm install html-to-image file-saver
npm install date-fns
npm install @radix-ui/react-dialog @radix-ui/react-tooltip
npm install sonner  # Toast notifications
```

### New Files to Create

1. `src/components/gen-ui/GenUIRenderer.tsx`
2. `src/app/playground/page.tsx`
3. `src/components/onboarding/WelcomeFlow.tsx`
4. `src/components/onboarding/ChecklistWidget.tsx`
5. `src/components/chat/AdelineTyping.tsx`
6. `src/components/chat/ErrorBoundary.tsx`
7. `src/components/chat/WaitingTips.tsx`
8. `src/components/chat/HighlightsPanel.tsx`
9. `src/components/chat/InsightsPanel.tsx`
10. `src/components/chat/ShareSnippet.tsx`
11. `src/lib/highlights.ts` (auto-generation logic)

### Database Schema Additions

**New Model: Highlight**
```prisma
model Highlight {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messageId   String?  @db.Uuid
  content     String
  type        String   // FIRST_MASTERY, DEEP_REFLECTION, PROJECT_COMPLETED, MANUAL
  source      String   // auto, manual
  impact      String?
  userNote    String?
  intent      String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}
```

**New Model: OnboardingProgress**
```prisma
model OnboardingProgress {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @unique @db.Uuid
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  completedSteps  String[] // ['meet', 'life_log', 'investigate', 'brainstorm', 'reflect']
  completedAt     DateTime?
  createdAt       DateTime @default(now())
}
```

---

## Success Criteria & Testing

### Functional Tests

1. **GenUI Streaming:**
   - Send "I baked bread today" → TranscriptCard renders with confetti
   - Send "who profits from Common Core?" → InvestigationBoard renders
   - Verify metadata arrives in `onMessageUpdate` callback

2. **Onboarding:**
   - New user lands on `/playground` → can try prompts without login
   - User signs up → sees WelcomeFlow modal
   - Complete onboarding → checklist widget appears
   - Complete all 5 checklist items → celebration modal + confetti

3. **Loading States:**
   - Send message → see Adeline typing animation
   - Response takes >3s → see progress stages
   - Response takes >5s → see rotating tips
   - Network error → see friendly error message with retry

4. **Message History:**
   - Scroll up → loads more messages
   - Messages grouped by date with dividers
   - Timeline markers appear for credits/projects/investigations
   - Click marker → jumps to that message

5. **Highlights:**
   - Auto-generated highlights appear in Highlights tab
   - Hover message → ⭐ button appears
   - Click ⭐ → message saved to highlights
   - Export highlight → downloads as PNG

6. **Insights:**
   - Insights panel shows current conversation stats
   - Learning streak heatmap shows last 12 weeks
   - ZPD recommendations show 3 ready-to-learn concepts
   - Click ZPD concept → starts guided conversation

### Performance Tests

- Initial page load: < 2s
- GenUI component render: < 500ms
- Infinite scroll load: < 1s
- Highlight auto-generation: < 3s for 100 messages
- Image export: < 2s

### Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 10+)

---

## Future Enhancements (Phase 2+)

After this week's sprint, consider:

1. **Message Editing & Regeneration** (nice-to-have from original requirements)
2. **Image Upload Preview** (nice-to-have)
3. **Voice Input** (Whisper integration)
4. **Conversation Branching** (explore alternate paths)
5. **Collaborative Learning** (parent can jump into conversation)
6. **Achievement Badges** (gamification layer)
7. **Weekly Digest Email** (highlights + insights)
8. **Mobile App** (React Native)

---

## Rollout Plan

### Day 1 (Today):
- ✅ Fix genUIPayload streaming bug
- ✅ Implement Adeline typing animation
- ✅ Implement error boundaries with personality
- ✅ Add playground route with suggested prompts

### Day 2:
- Implement WelcomeFlow onboarding
- Implement checklist widget
- Add timeline view with date dividers
- Add "while you wait" tips

### Day 3:
- Implement highlights panel
- Implement insights panel
- Add infinite scroll for message history
- Add timeline markers

### Day 4:
- Implement share snippet feature
- Polish animations and transitions
- Fix any bugs from Days 1-3
- User testing with 3-5 beta families

### Day 5:
- Address feedback from user testing
- Performance optimization
- Deploy to production
- Announce to existing users

---

## Appendix: Animation Specifications

### Entrance Animations
```typescript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
};

const slideInRight = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3 },
};
```

### Micro-interactions
```typescript
const hoverLift = {
  whileHover: { scale: 1.05, y: -2 },
  whileTap: { scale: 0.98 },
};

const pulse = {
  animate: { scale: [1, 1.05, 1] },
  transition: { duration: 2, repeat: Infinity },
};

const shimmer = {
  animate: { x: [-100, 400] },
  transition: { duration: 2, repeat: Infinity, ease: 'linear' },
};
```

### Spring Physics
```typescript
const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};
```

---

**END OF DESIGN DOCUMENT**
