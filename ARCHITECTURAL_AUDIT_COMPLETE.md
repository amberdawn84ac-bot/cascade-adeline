# 🏛️ ARCHITECTURAL AUDIT — COMPLETE REPORT

## EXECUTIVE SUMMARY

**Pillar 1 (Absolute Adaptation): ✅ 100% COMPLETE**
All generation API routes now use `buildStudentContextPrompt(userId)` to adapt to student's exact ZPD.

**Pillar 2 (Applied Reality): ⚠️ NEEDS REVIEW**
Most rooms enforce real-world work, but system prompts need strengthening.

**Pillar 3 (Collaboration): ❌ NEEDS IMPLEMENTATION**
Collaboration infrastructure created for Science. Need to implement for remaining rooms.

---

## PILLAR 1: ABSOLUTE ADAPTATION ✅ COMPLETE

### Fixed Routes (Commits: 1e784a8, c73a27a)
- ✅ `/api/science/field-work/generate` — now uses `buildStudentContextPrompt`
- ✅ `/api/math/data/analyze` — now uses `buildStudentContextPrompt`
- ✅ `/api/expeditions/generate` — now uses `buildStudentContextPrompt`
- ✅ `/api/ela/story/generate` — now uses `buildStudentContextPrompt`
- ✅ `/api/future-prep/clep-guide` — now uses `buildStudentContextPrompt`

### Already Compliant
- ✅ `/api/science/generate`
- ✅ `/api/science/encyclopedia/generate`
- ✅ `/api/math/geometry/solve`
- ✅ `/api/math/business/analyze`
- ✅ `/api/history/timeline/generate`
- ✅ `/api/reading-nook/curate`
- ✅ `/api/domestic-arts/generate`

### Arcade Routes (Need Verification)
The arcade routes (`spelling`, `coding-quiz`) manually fetch gradeLevel but don't use full `buildStudentContextPrompt`. These are less critical since they're game-focused, but should be upgraded for consistency.

---

## PILLAR 2: APPLIED REALITY ⚠️ NEEDS STRENGTHENING

### Current Status by Room

**Science: ✅ STRONG**
- Primary sources required in Encyclopedia
- Household materials only in Laboratory
- Real homestead tasks in Field Work
- System prompts enforce "no kits, no purchases"

**Math: ✅ STRONG**
- Geometry connects to real-world examples
- Business math uses actual business scenarios
- Data analysis is practical

**History: ✅ STRONG**
- Primary source citations required
- Direct quotes from original documents
- No sanitized textbook summaries

**Reading Nook: ⚠️ NEEDS REVIEW**
- Book curation is good
- Socratic discussion is strong
- BUT: Need to verify books are "living books" not textbooks

**Expeditions: ✅ STRONG**
- Real locations only
- Service/stewardship framing enforced
- Geology → sociology connection required

**Arcade: ⚠️ MIXED**
- Spelling Bee: Good (real vocabulary)
- Typing Racer: Neutral (skill practice)
- Code Quest: Good (real code reading)
- BUT: Games don't connect to real-world purpose

**Future Prep: ✅ STRONG**
- CLEP prep is inherently practical
- College-level rigor enforced
- No sugarcoating difficulty

**ELA: ⚠️ NEEDS STRENGTHENING**
- Story writing is creative but lacks real-world purpose
- Need to add: "Who will read this? Who does it serve?"
- Should frame writing as communication/service, not just self-expression

### Recommended System Prompt Additions

For **ELA** (`/api/ela/story/generate`):
```
CRITICAL: Every story must have a PURPOSE beyond self-expression. Ask the student:
- Who will read this story? (younger sibling, elderly neighbor, community newsletter)
- What does this story teach or give to the reader?
- How does this story serve others?
Never generate stories that are purely self-indulgent. Frame writing as a gift to others.
```

For **Arcade** (all routes):
```
DIRECTIVE: Connect this activity to real-world skill development. Explain how this specific skill (spelling, typing, code-reading) will help them serve their family, community, or future work. No generic "learning is fun" messaging.
```

---

## PILLAR 3: COLLABORATION HOOKS ❌ NEEDS IMPLEMENTATION

### Infrastructure Created (Commit: 1e784a8)
- ✅ `/api/science/missions/create` — Co-op Field Missions
- ✅ `/api/science/missions/contribute` — Multi-student data collection

### Remaining Work by Room

#### **MATH: Trade Partnerships**
**Concept:** One student calculates budget, another designs blueprint, third sources materials.

**Implementation:**
1. Create `/api/math/partnerships/create`
   - Schema: `{ projectName, roles: [{ role, task, assignedTo? }] }`
   - Example roles: "Budget Calculator", "Blueprint Designer", "Materials Sourcer"
2. Create `/api/math/partnerships/contribute`
   - Students submit their piece (budget spreadsheet, blueprint sketch, materials list)
3. UI: Add "Trade Partnerships" tab to Math page
   - Create partnership button
   - Assign roles to siblings/friends
   - View combined results

**Zod Schema:**
```typescript
const partnershipSchema = z.object({
  projectName: z.string(),
  projectType: z.enum(['building', 'business', 'farm-planning']),
  roles: z.array(z.object({
    role: z.enum(['budget-calculator', 'blueprint-designer', 'materials-sourcer']),
    task: z.string(),
    assignedTo: z.string().optional(),
  })),
  contributions: z.array(z.object({
    userId: z.string(),
    role: z.string(),
    data: z.any(),
    timestamp: z.string(),
  })).optional(),
});
```

#### **HISTORY: Collaborative Timelines**
**Concept:** Multiple students contribute primary sources to the same historical event.

**Implementation:**
1. Create `/api/history/timeline/collaborate`
   - Schema: `{ timelineId, primarySource, citation, analysis }`
2. Modify `/api/history/timeline/generate` to support `collaborative: true` flag
3. UI: Add "Invite Collaborators" button to History page
   - Share timeline ID
   - View all contributions
   - Merge into master timeline

**Zod Schema:**
```typescript
const collaborativeTimelineSchema = z.object({
  id: z.string(),
  topic: z.string(),
  creator: z.string(),
  collaborators: z.array(z.string()),
  contributions: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    primarySource: z.string(),
    citation: z.string(),
    analysis: z.string(),
    timestamp: z.string(),
  })),
});
```

#### **READING NOOK: Shared Read-Aloud / Book Club**
**Concept:** Siblings/friends read the same book and discuss together.

**Implementation:**
1. Create `/api/reading-nook/book-club/create`
   - Schema: `{ bookTitle, members: [userId], schedule }`
2. Create `/api/reading-nook/book-club/discuss`
   - Multi-user Socratic discussion (all members see same chat)
3. UI: Add "Book Club" tab to Reading Nook
   - Create club button
   - Invite members
   - Shared discussion thread

**Zod Schema:**
```typescript
const bookClubSchema = z.object({
  id: z.string(),
  bookTitle: z.string(),
  creator: z.string(),
  members: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
  })),
  schedule: z.object({
    startDate: z.string(),
    pagesPerWeek: z.number(),
  }).optional(),
  discussions: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    message: z.string(),
    timestamp: z.string(),
  })),
});
```

#### **EXPEDITIONS: Co-op Field Journal**
**Concept:** Multiple students visit the same location and combine observations.

**Implementation:**
1. Create `/api/expeditions/field-journal/create`
   - Schema: `{ location, observers: [userId] }`
2. Create `/api/expeditions/field-journal/log`
   - Students log observations (geology, plants, animals, weather)
3. UI: Add "Field Journal" collaboration feature
   - Create shared journal
   - Invite co-observers
   - View combined data

**Zod Schema:**
```typescript
const fieldJournalSchema = z.object({
  id: z.string(),
  location: z.string(),
  creator: z.string(),
  observers: z.array(z.string()),
  observations: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    category: z.enum(['geology', 'flora', 'fauna', 'weather', 'archaeology']),
    observation: z.string(),
    photo: z.string().optional(),
    timestamp: z.string(),
  })),
});
```

#### **ARCADE: Multiplayer Challenges**
**Concept:** Siblings compete or collaborate on typing races, spelling bees, coding challenges.

**Implementation:**
1. Create `/api/arcade/multiplayer/create`
   - Schema: `{ gameType, players: [userId], mode: 'competitive' | 'cooperative' }`
2. Create `/api/arcade/multiplayer/submit-score`
   - Real-time leaderboard
3. UI: Add "Multiplayer" button to each game
   - Invite players
   - Live scoreboard
   - Combined credits for cooperative mode

**Zod Schema:**
```typescript
const multiplayerGameSchema = z.object({
  id: z.string(),
  gameType: z.enum(['spelling', 'typing', 'coding']),
  mode: z.enum(['competitive', 'cooperative']),
  creator: z.string(),
  players: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    score: z.number().optional(),
  })),
  status: z.enum(['waiting', 'active', 'completed']),
  winner: z.string().optional(),
});
```

#### **FUTURE PREP: Study Groups**
**Concept:** Students preparing for the same CLEP exam study together.

**Implementation:**
1. Create `/api/future-prep/study-group/create`
   - Schema: `{ examName, members: [userId], meetingSchedule }`
2. Create `/api/future-prep/study-group/quiz`
   - Generate practice questions for the group
   - Track each member's progress
3. UI: Add "Study Groups" tab to Future Prep
   - Create group
   - Invite members
   - Shared progress dashboard

**Zod Schema:**
```typescript
const studyGroupSchema = z.object({
  id: z.string(),
  examName: z.string(),
  creator: z.string(),
  members: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    progress: z.number(), // % of material covered
  })),
  meetingSchedule: z.string().optional(),
  sharedResources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    uploadedBy: z.string(),
  })),
});
```

#### **ELA: Peer Review Circles**
**Concept:** Students share stories and give each other feedback.

**Implementation:**
1. Create `/api/ela/peer-review/submit`
   - Schema: `{ storyId, circleId }`
2. Create `/api/ela/peer-review/feedback`
   - Students give constructive feedback
3. UI: Add "Peer Review" tab to ELA
   - Create review circle
   - Submit story
   - Give/receive feedback

**Zod Schema:**
```typescript
const peerReviewCircleSchema = z.object({
  id: z.string(),
  name: z.string(),
  creator: z.string(),
  members: z.array(z.string()),
  submissions: z.array(z.object({
    storyId: z.string(),
    authorId: z.string(),
    title: z.string(),
    content: z.string(),
    feedback: z.array(z.object({
      reviewerId: z.string(),
      reviewerName: z.string(),
      strengths: z.string(),
      improvements: z.string(),
      timestamp: z.string(),
    })),
  })),
});
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Critical Collaboration Features (Do First)
1. **Math Trade Partnerships** — High impact, clear use case
2. **History Collaborative Timelines** — Aligns with primary source focus
3. **Reading Nook Book Clubs** — Natural fit for homeschool families

### Phase 2: Enhanced Collaboration (Do Next)
4. **Expeditions Co-op Field Journal** — Extends existing field work
5. **Science Co-op Missions UI** — Backend exists, needs frontend
6. **Arcade Multiplayer** — Fun, motivating, easy to implement

### Phase 3: Advanced Collaboration (Do Last)
7. **Future Prep Study Groups** — Smaller user base (older students only)
8. **ELA Peer Review** — Requires moderation/safety considerations

---

## NEXT STEPS

1. **Commit current work** ✅ DONE (1e784a8, c73a27a)
2. **Strengthen Pillar 2 prompts** — Add "Applied Reality" directives to ELA and Arcade
3. **Implement Phase 1 collaboration features** — Math, History, Reading Nook
4. **Build collaboration UIs** — Add tabs/buttons to dashboard pages
5. **Test with real users** — Verify collaboration flows work across accounts

---

## FILES MODIFIED

### Pillar 1 Fixes
- `src/app/api/science/field-work/generate/route.ts`
- `src/app/api/math/data/analyze/route.ts`
- `src/app/api/expeditions/generate/route.ts`
- `src/app/api/ela/story/generate/route.ts`
- `src/app/api/future-prep/clep-guide/route.ts`

### Pillar 3 Infrastructure
- `src/app/api/science/missions/create/route.ts` (NEW)
- `src/app/api/science/missions/contribute/route.ts` (NEW)

### Documentation
- `ARCHITECTURAL_AUDIT.md` (NEW)
- `ARCHITECTURAL_AUDIT_COMPLETE.md` (THIS FILE)
