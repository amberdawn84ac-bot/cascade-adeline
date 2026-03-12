# Systemic Justice Integration - Testing Guide

## Quick Test Commands

To verify that systemic justice features are working correctly in each room, follow these test scenarios:

### 1. SCIENCE ROOM - FOIA Request Generation

**Test:** Generate a water quality experiment
```
1. Navigate to /dashboard/science
2. Click "The Laboratory" tab
3. Enter query: "water quality testing"
4. Click Generate
5. Verify: Red "Take Action" section appears with:
   - Action Type: FOIA-REQUEST
   - Target: County Water Department (or similar)
   - Complete FOIA draft letter
   - Copy button works
```

**Test:** Generate field work projects
```
1. Navigate to /dashboard/science
2. Click "Field Work" tab
3. Click "Generate Field Work"
4. Verify: Each project has red "Systemic Action" section with:
   - Delivery target (specific neighbor name)
   - Action plan (FOIA, policy draft, or delivery mission)
   - Copy button works
```

### 2. MATH ROOM - Policy Analysis

**Test:** Business math profit-from-harm detection
```
1. Navigate to /dashboard/math/business
2. Set up a business (e.g., Lemonade Stand)
3. Set price: $1.50, quantity: 50, cost: $0.10, fixed: $5
4. Click "Ask Adeline to Analyze"
5. Verify: "Policy Impact Analysis" section appears with:
   - Systemic harm detected (e.g., wage theft risk)
   - Affected population
   - Policy recommendation
   - Budget impact with numbers
   - "Draft Letter to Representative" button works
```

**Test:** Data analysis inequality detection
```
1. Navigate to /dashboard/math/data
2. Enter inequality data: "45000, 48000, 42000, 120000, 115000, 125000"
3. Question: "Income by neighborhood"
4. Click "Analyze with Adeline"
5. Verify: "Systemic Injustice Detected" section appears with:
   - Inequality pattern identified
   - Who is harmed
   - Policy solution
   - Budget impact
   - "Draft Advocacy Letter" button works
```

### 3. HISTORY ROOM - Modern Parallel & Clemency

**Test:** Historical injustice connection
```
1. Navigate to /dashboard/history
2. Enter query: "Jim Crow laws" or "Trail of Tears" or "Japanese internment"
3. Click search
4. Verify: "Modern Parallel: Take Action Today" section appears with:
   - Current injustice description
   - Clemency campaign (if relevant)
   - Policy that perpetuates harm
   - Who to petition (with contact info)
   - Complete advocacy letter
   - "Copy Advocacy Letter" button works
```

### 4. READING NOOK - Justice Theme

**Test:** Book curation with justice connections
```
1. Navigate to /dashboard/reading-nook
2. Click "Bookshelf" tab
3. Click "🌿 Curate New Books"
4. Verify: At least some books have "⚖️ Justice Connection" section with:
   - Systemic issue the book addresses
   - Real case/campaign connection
   - Action prompt
```

### 5. EXPEDITIONS - Stewardship Mission

**Test:** Location-based stewardship
```
1. Navigate to /dashboard/expeditions
2. Enter location: "Appalachian forest" or "Local creek" or "Prairie grassland"
3. Click "Survey Location"
4. Verify: "Stewardship Mission" section appears with:
   - Environmental threat (specific)
   - Affected community (named groups)
   - Action steps (3-5 concrete steps)
   - Delivery target (specific neighbor)
   - "Copy Mission Plan" button works
```

### 6. FUTURE PREP - Career Ethics

**Test:** CLEP guide with ethics analysis
```
1. Navigate to /dashboard/college-prep
2. Click "CLEP & Dual Enrollment" tab
3. Select exam: "Biology" or "Business Law" or "Psychology"
4. Click "⚔ Generate Adeline Study Guide"
5. Verify: "Career Ethics Analysis" section appears with:
   - Industry harms
   - Ethical alternatives
   - Advocacy opportunities (named organizations)
   - "Copy Ethics Analysis" button works
```

### 7. ELA - Story Purpose

**Test:** Story generation with service purpose
```
1. Navigate to /dashboard/ela/story-starter
2. Enter story idea: "A boy who helps his elderly neighbor"
3. Select genre: "realistic"
4. Click "Generate Story Starter"
5. Verify: "Your Story's Purpose" section appears with:
   - Intended reader (specific person/group)
   - Service goal (what it gives them)
   - Publication target (specific venue)
   - "Copy Story Starter" button works
```

## Verification Checklist

For each room, verify:

- [ ] **API Route**: Zod schema includes systemic action field
- [ ] **System Prompt**: Includes directive to generate systemic action
- [ ] **UI Component**: Displays systemic action section when present
- [ ] **Copy Button**: Works and shows confirmation alert
- [ ] **Specificity**: No generic placeholders - real names, agencies, neighbors
- [ ] **Completeness**: Draft letters are ready-to-send, not templates
- [ ] **Visual Design**: Red/amber color scheme, clear hierarchy, alert icons

## Common Issues & Fixes

### Issue: Systemic action not generating
**Cause**: Topic not relevant to justice/service
**Fix**: Try topics related to public health, environment, inequality, or community service

### Issue: Generic placeholders in drafts
**Cause**: LLM not following specificity directive
**Fix**: System prompt may need stronger emphasis on "NO PLACEHOLDERS"

### Issue: UI section not appearing
**Cause**: Field is optional and LLM didn't generate it
**Fix**: Verify the topic should trigger systemic action, or check API response

### Issue: Copy button not working
**Cause**: Browser clipboard permissions
**Fix**: Ensure HTTPS or localhost, check browser console for errors

## Manual Testing Script

Run through all 7 rooms in sequence:

```bash
# 1. Science
- Generate water quality experiment
- Generate field work projects
- Verify FOIA/delivery sections appear

# 2. Math
- Analyze business (lemonade stand)
- Analyze inequality data
- Verify policy analysis sections appear

# 3. History
- Research Jim Crow or similar injustice
- Verify modern parallel and clemency sections appear

# 4. Reading Nook
- Curate books
- Verify justice theme on relevant books

# 5. Expeditions
- Survey a natural location
- Verify stewardship mission appears

# 6. Future Prep
- Generate CLEP guide (Biology, Business, etc.)
- Verify career ethics section appears

# 7. ELA
- Generate story starter
- Verify purpose & audience section appears
```

## Expected Behavior

### When Systemic Action SHOULD Generate:
- Science: Water, soil, air quality, food safety, environmental topics
- Math: Business models, inequality data, resource distribution
- History: Any historical injustice (slavery, genocide, labor exploitation, etc.)
- Reading Nook: Books about justice, inequality, human dignity
- Expeditions: Any natural location (environmental threats exist everywhere)
- Future Prep: Any career path (all professions have ethical dimensions)
- ELA: Every story (all writing should serve a reader)

### When It Might NOT Generate:
- Pure abstract math (geometry without real-world context)
- Basic science concepts with no public health/environmental connection
- Historical events with no clear modern parallel
- Books that are purely entertainment with no justice themes

## Success Criteria

✅ At least 80% of generated content includes systemic action fields
✅ All draft letters are complete and actionable (no [INSERT NAME] placeholders)
✅ All copy buttons work and show confirmation
✅ Visual design is consistent across all rooms
✅ Students understand the purpose and can execute the actions

## Notes

- This testing should be done with a real student profile (via onboarding)
- Test with different grade levels to verify age-appropriate content
- Verify that `buildStudentContextPrompt` is working (content should adapt to student)
- Check browser console for any API errors during generation
