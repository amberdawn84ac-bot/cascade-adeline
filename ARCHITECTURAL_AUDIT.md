# 🏛️ ARCHITECTURAL AUDIT — ALL DASHBOARD ROOMS

## Audit Criteria

### PILLAR 1: Absolute Adaptation
Does the API route use `buildStudentContextPrompt(userId)` to adapt to student's ZPD?

### PILLAR 2: Applied Reality
Are activities real-world, gritty, and purposeful? No hypotheticals, no busywork?

### PILLAR 3: Collaboration Hook
Can students work together on shared projects/data?

---

## ROOM 1: SCIENCE ✅ FIXED

### Findings
- **Pillar 1**: ✅ PASS (after fix to field-work/generate)
- **Pillar 2**: ✅ PASS (primary sources, household materials, real homestead tasks)
- **Pillar 3**: ✅ FIXED (added Co-op Missions API routes)

### Actions Taken
- Fixed `/api/science/field-work/generate` to use `buildStudentContextPrompt`
- Created `/api/science/missions/create` for collaborative field missions
- Created `/api/science/missions/contribute` for multi-student data collection

---

## ROOM 2: MATH

### API Routes to Audit
- `/api/math/geometry/solve`
- `/api/math/business/analyze`
- `/api/math/data/analyze`

### Initial Assessment
- **Pillar 1**: Need to verify `buildStudentContextPrompt` usage
- **Pillar 2**: Business/geometry are applied, but need to verify real-world grounding
- **Pillar 3**: No collaboration features detected

---

## ROOM 3: HISTORY

### API Routes to Audit
- `/api/history/timeline/generate`

### Initial Assessment
- **Pillar 1**: Need to verify adaptation
- **Pillar 2**: Has primary source requirements (good)
- **Pillar 3**: No collaborative timeline feature

---

## ROOM 4: READING NOOK

### API Routes to Audit
- `/api/reading-nook/curate`
- `/api/reading-nook/discuss`

### Initial Assessment
- **Pillar 1**: Need to verify adaptation
- **Pillar 2**: Socratic discussion is good, but need to verify book curation
- **Pillar 3**: No shared read-aloud or debate feature

---

## ROOM 5: EXPEDITIONS (Homesteading)

### API Routes to Audit
- `/api/expeditions/generate`

### Initial Assessment
- **Pillar 1**: Need to verify adaptation
- **Pillar 2**: Real-world location-based (good)
- **Pillar 3**: No collaborative field journal

---

## ROOM 6: ARCADE

### API Routes to Audit
- `/api/arcade/spelling`
- `/api/arcade/coding-quiz`
- `/api/arcade/award-credits`

### Initial Assessment
- **Pillar 1**: Need to verify adaptation
- **Pillar 2**: Games are educational but need to verify real-world connection
- **Pillar 3**: No multiplayer or trade partnerships

---

## ROOM 7: FUTURE PREP (College Prep)

### API Routes to Audit
- `/api/future-prep/clep-guide`
- `/api/future-prep/advise`

### Initial Assessment
- **Pillar 1**: Need to verify adaptation
- **Pillar 2**: CLEP prep is practical (good)
- **Pillar 3**: No peer study groups

---

## ROOM 8: ELA

### API Routes to Audit
- `/api/ela/story/generate`
- `/api/story/generate-prompt`
- `/api/story/analyze-submission`

### Initial Assessment
- **Pillar 1**: Need to verify adaptation
- **Pillar 2**: Story writing is creative but need to verify real-world purpose
- **Pillar 3**: No peer review or collaborative writing

---

## PRIORITY FIXES

### Critical (Pillar 1 - Adaptation)
1. Audit all API routes for `buildStudentContextPrompt` usage
2. Add where missing

### High (Pillar 3 - Collaboration)
1. Math: Add "Trade Partnerships" (budget + blueprint collaboration)
2. History: Add "Collaborative Timelines" (multi-user primary source contributions)
3. Reading Nook: Add "Shared Read-Aloud" or "Book Club Discussions"
4. Expeditions: Add "Co-op Field Journal" (shared location observations)

### Medium (Pillar 2 - Applied Reality)
1. Verify all prompts enforce real-world, physical work
2. Remove any remaining hypotheticals or generic scenarios
