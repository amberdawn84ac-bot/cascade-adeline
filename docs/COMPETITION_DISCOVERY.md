# Dynamic Competition Discovery System

## Overview

The competition system has been upgraded from **static seeding** to **dynamic AI-powered web discovery**. Competitions are now scraped from the internet in real-time and automatically filtered by student age, grade level, and interests.

## How It Works

### 1. **Automatic Discovery**
When a student requests opportunity matches and no recent competitions exist (< 7 days old), the system automatically:
- Triggers the discovery API
- Uses GPT-4o to search for current STEM competitions
- Filters by the student's age, grade, and interests
- Saves results to the database with a timestamp

### 2. **Age & Grade Filtering**
Competitions are filtered at two levels:

**Discovery Level** (AI prompt):
```
Only include competitions where:
- Age ${studentAge} falls within the competition's age range
- Grade ${studentGrade} is in the eligible grades list
```

**Matching Level** (code filter):
```typescript
const eligible = competitions.filter(comp => {
  const rules = comp.eligibilityRules;
  if (rules.grades && !rules.grades.includes(grade)) return false;
  if (rules.ageMin && age < rules.ageMin) return false;
  if (rules.ageMax && age > rules.ageMax) return false;
  return true;
});
```

### 3. **Caching Strategy**
- Competitions are cached for **7 days** via the `lastScrapedAt` timestamp
- Prevents excessive API calls to OpenAI
- Ensures fresh, current competitions without redundant searches

## API Endpoints

### `POST /api/competitions/discover`
Manually trigger competition discovery for a specific student profile.

**Request:**
```json
{
  "studentAge": 15,
  "studentGrade": "9",
  "interests": ["robotics", "environmental science"]
}
```

**Response:**
```json
{
  "discovered": 12,
  "competitions": [
    {
      "id": "uuid",
      "name": "Google Science Fair",
      "type": "SCIENCE_FAIR",
      "deadline": "2026-04-30T00:00:00.000Z",
      "eligibilityRules": {
        "grades": ["7", "8", "9", "10", "11", "12"],
        "ageMin": 13,
        "ageMax": 18
      },
      "themes": ["technology", "environment", "robotics"],
      "url": "https://sciencefair.withgoogle.com/"
    }
  ]
}
```

### `GET /api/competitions/discover`
Retrieve recently discovered competitions for the current user.

**Response:**
```json
{
  "total": 8,
  "competitions": [...]
}
```

## Database Schema Changes

### Competition Model
```prisma
model Competition {
  // ... existing fields
  lastScrapedAt DateTime? @map("last_scraped_at")  // NEW: Tracks when competition was discovered
  
  @@index([lastScrapedAt])  // NEW: Index for cache queries
}
```

### New Competition Types
```prisma
enum CompetitionType {
  SCIENCE_FAIR
  RESEARCH_PAPER
  INNOVATION
  ENVIRONMENTAL
  STEM_CHALLENGE
  SCHOLARSHIP
  HACKATHON
  MATH           // NEW
  WRITING        // NEW
  ROBOTICS       // NEW
  OTHER          // NEW
}
```

## Migration Required

To apply the schema changes:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_competition_scraping_fields
```

## Integration Points

### Opportunity Matching (`/api/opportunities/match`)
Automatically triggers discovery if no recent competitions exist:

```typescript
const recentCompetitions = await prisma.competition.findMany({
  where: {
    isActive: true,
    lastScrapedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }
});

if (recentCompetitions.length === 0) {
  await fetch('/api/competitions/discover', {
    method: 'POST',
    body: JSON.stringify({ studentAge, studentGrade, interests })
  });
}
```

## Benefits Over Static Seeding

| Static Seeding | Dynamic Discovery |
|---|---|
| Hardcoded competitions | Real-time web search |
| Manual updates required | Automatic updates |
| Same for all students | Personalized by age/grade |
| Outdated deadlines | Current deadlines only |
| Limited to 8-12 competitions | Discovers 8-12 per student profile |
| No interest matching | Matches student interests |

## Example Use Cases

### Elementary Student (Age 8, Grade 3)
Discovers:
- National STEM Festival (K-12)
- Local science fairs
- Age-appropriate robotics competitions

### High School Senior (Age 17, Grade 12)
Discovers:
- Regeneron Science Talent Search (seniors only)
- ISEF (requires regional win)
- Conrad Challenge
- College scholarship competitions

### Middle School Student (Age 13, Grade 7, Interests: Environment)
Discovers:
- Broadcom MASTERS
- Lexus Eco Challenge (high school, but shows as future opportunity)
- Environmental science fairs
- Water quality competitions

## Backward Compatibility

The static seed file (`prisma/seed-competitions.ts`) is **deprecated but functional**:
- Still runs on initial database setup
- Provides fallback competitions
- Will be gradually replaced by dynamic discoveries
- Marked with deprecation notice

## Future Enhancements

1. **Regional Filtering**: Add location-based filtering for local competitions
2. **Deadline Alerts**: Notify students 30 days before deadlines
3. **Success Tracking**: Track which competitions students enter and win
4. **Recommendation Engine**: Learn which competition types students prefer
5. **Team Matching**: Connect students for team-based competitions
