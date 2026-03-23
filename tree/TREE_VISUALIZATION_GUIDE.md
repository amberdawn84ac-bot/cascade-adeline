# Tree Visualization System - Complete Integration Guide

## What We've Built 🌳

A complete K-12 adaptive learning tree visualization that grows with your students from kindergarten seedlings to high school mature oaks.

## Architecture Overview

```
/api/tree 
└─> Fetches student data
    └─> Maps standards to 8 tracks
        └─> Returns grade-band-specific config

/components/tree/TreeVisualization.tsx
└─> Main component
    └─> Fetches from API
        └─> Renders appropriate tree for grade level
            ├─> SeedlingTree (K-2)
            ├─> YoungTree (3-5)
            ├─> GrowingTree (6-8)
            └─> MatureOak (9-12)
```

## The 8 Branches (Subject Tracks)

Every tree has 8 branches representing your integrated curriculum:

1. 🌿 **God's Creation & Science** (`gods-creation-science`)
2. 🌱 **Health & Naturopathy** (`health-naturopathy`) 
3. 🌾 **Food Systems & Stewardship** (`food-systems`)
4. ⚖️ **Government & Economics** (`government-economics`)
5. ✊ **Justice & Change-Making** (`justice-changemaking`)
6. 📖 **Discipleship & Discernment** (`discipleship-cultural-discernment`)
7. 📜 **Truth-Based History** (`truth-based-history`)
8. ✍️ **English & Literature** (`english-literature`)

## How Leaves Work

**Leaves = Standards/Learning Outcomes**

Each leaf represents a specific standard from your `StateStandard` table, colored by mastery level:

- 🍂 Gray (`NOT_STARTED`) - Haven't started
- 🍁 Light peach (`INTRODUCED`) - Just introduced
- 🍃 Peach (`PRACTICING`) - Actively practicing
- 🌿 Light green (`PROFICIENT`) - Proficient
- ✅ Dark green (`MASTERED`) - Fully mastered

## Grade-Specific Trees

### K-2: Seedling 🌱
- **Visual:** Simple sprout with 8 shoots from ground
- **Leaves:** 3-5 BIG leaves per branch
- **Complexity:** Minimal, playful
- **Special:** Cute face on stem
- **Focus:** Observable, tactile learning

### 3-5: Young Tree 🌳
- **Visual:** Small tree with trunk and 8 branches
- **Leaves:** 8-10 medium leaves per branch
- **Complexity:** Moderate detail
- **Special:** Progress % in trunk
- **Focus:** Building foundations

### 6-8: Growing Tree 🌲
- **Visual:** Stronger tree with secondary branches
- **Leaves:** 12-15 smaller leaves per branch
- **Complexity:** Detailed branching
- **Special:** Bark texture, multiple levels
- **Focus:** Critical thinking, investigation

### 9-12: Mature Oak 🌳
- **Visual:** Full oak with tertiary branching
- **Leaves:** 18-20 tiny leaves per branch
- **Complexity:** Dense, sophisticated
- **Special:** Fruits on mastered branches, graduation % tracker
- **Focus:** Independence, mastery, college readiness

## Interactive Features

### Branch Click
- Opens detail panel showing all standards in that track
- Displays progress: mastered, proficient, practicing
- Lists each leaf with mastery status
- Click leaf → generate activity to practice

### Leaf Hover
- Shows standard code and full description
- Displays current mastery level
- Shows when it was mastered (if applicable)
- "Practice This" button if not mastered

### Progress Tracking
- Overall % completion across all branches
- Recent growth (last 30 days)
- Total leaves grown vs total leaves available
- Branch-specific progress bars

## API Endpoint

### GET `/api/tree`

**Response:**
```json
{
  "gradeBand": "young-tree",
  "gradeLevel": "5th",
  "branches": [
    {
      "track": "truth-based-history",
      "displayName": "Truth-Based History",
      "color": "#CD853F",
      "icon": "📜",
      "leaves": [
        {
          "id": "uuid",
          "standardCode": "OAS.OK.5.2",
          "description": "Analyze the Dawes Act impact on Native Americans",
          "mastery": "PROFICIENT",
          "demonstratedAt": "2026-03-15T10:30:00Z",
          "microcredits": 0.04
        }
      ],
      "progress": {
        "total": 15,
        "mastered": 8,
        "proficient": 4,
        "practicing": 2,
        "percent": 53
      }
    }
  ],
  "progress": {
    "total": 120,
    "mastered": 45,
    "percent": 38,
    "recentGrowth": 7
  },
  "visualConfig": {
    "treeHeight": 500,
    "trunkWidth": 40,
    "branchCount": 8,
    "maxLeavesPerBranch": 10,
    "leafSize": "medium",
    "complexity": "moderate"
  }
}
```

## Integration with Existing Systems

### Standards Tracking
The tree pulls from your existing `StudentStandardProgress` table:
```typescript
// When a lesson is completed
await db.studentStandardProgress.upsert({
  where: { userId_standardId: { userId, standardId } },
  update: { 
    mastery: 'PROFICIENT',
    microcreditsEarned: { increment: 0.02 }
  }
});
// Tree automatically updates on next load
```

### Lesson System Integration
When lessons award standards:
```typescript
// In lesson completion handler
const lessonStandards = ["OAS.OK.5.2", "CCSS.ELA-LITERACY.RH.6-8.1"];
// These standards become "leaves" on the tree
// Completing the lesson changes leaf color from gray → peach → green
```

### Life Credit Logging
When students log activities:
```typescript
// "I baked bread"
// LifeCreditLogger maps to Chemistry
// Standards in Chemistry track get updated
// Leaves on "God's Creation & Science" branch change color
```

## How to Add to Your App

### 1. Add to Navigation
```typescript
// In your dashboard/navigation
<Link href="/tree">
  🌳 My Learning Tree
</Link>
```

### 2. Create Page
```typescript
// app/tree/page.tsx
import { TreeVisualization } from '@/components/tree/TreeVisualization';

export default function TreePage() {
  return <TreeVisualization />;
}
```

### 3. Database Migration
```bash
# Already added to schema.prisma
npx prisma db push
```

The system uses your existing tables:
- `StateStandard` - The standards (leaves)
- `StudentStandardProgress` - Mastery tracking (leaf color)
- `User.gradeLevel` - Which tree to show

## Customization

### Change Track Colors
Edit `getTrackColor()` in `/api/tree/route.ts`:
```typescript
function getTrackColor(track: string): string {
  const colors: Record<string, string> = {
    'gods-creation-science': '#YOUR_COLOR',
    // ...
  };
  return colors[track] || '#7BA05B';
}
```

### Adjust Leaf Counts
Edit `maxLeavesPerBranch` in `getVisualConfig()`:
```typescript
'young-tree': {
  maxLeavesPerBranch: 15, // Show more leaves
  // ...
}
```

### Add More Grade Bands
Create new tree component in `/components/tree/trees/`:
```typescript
export function MiddleSchoolTree({ ... }) {
  // Custom visualization for 6-8
}
```

## Future Enhancements

### Path Through Trees (Multi-Year Journey)
Show progression K → 12 as walking path through forest:
```
🌱 Seedling (K-2) → 🌳 Young Tree (3-5) → 🌲 Growing (6-8) → 🌳 Mature Oak (9-12)
```

### Seasonal Changes
Tree appearance changes by season:
- Fall: Orange/red leaves
- Winter: Bare branches show structure
- Spring: New leaf buds
- Summer: Full green canopy

### Cross-Branch Connections
Show when one lesson lights up multiple branches:
```typescript
// "Operation Bitter Harvest" on Monsanto
leavesGrown: {
  "truth-based-history": [3 leaves],
  "justice-changemaking": [2 leaves],
  "food-systems": [4 leaves],
  "gods-creation-science": [2 leaves]
}
// Visual: Glowing connections between branches
```

### Fruits & Harvest
When branch is >70% mastered:
- Fruits appear (shown in MatureOak)
- Click fruit → certificate/badge
- "Harvest" feature: export mastered standards as portfolio

### Student Portfolio Export
```typescript
// Generate visual PDF of tree
// Include all mastered leaves
// Show progression over time
// Biblical connections noted
```

## Testing

### Test with Sample Data
```typescript
// Create test student with various mastery levels
const testStandards = [
  { standardCode: "NGSS.5-LS1-1", mastery: "MASTERED" },
  { standardCode: "CCSS.ELA.5.RL.1", mastery: "PROFICIENT" },
  { standardCode: "OAS.OK.5.2", mastery: "PRACTICING" },
  // ... mix of all levels
];
```

### Check Responsiveness
- Mobile view: Tree scales down
- Tablet: Side-by-side tree + details
- Desktop: Full interactive experience

### Performance
- API response time: < 500ms
- SVG render time: < 100ms
- Smooth hover/click interactions

## Deployment Checklist

- [x] Database models added to Prisma
- [x] API endpoint created
- [x] React components built
- [x] All 4 tree types complete
- [x] Interactive features working
- [ ] Database migration run
- [ ] Standards seeded
- [ ] Test with real student data
- [ ] Add to navigation
- [ ] Create tree page
- [ ] User testing with kids

## Credits & Philosophy

This tree visualization embodies your educational philosophy:

✅ **Non-siloed learning** - Branches intertwine, lessons cross tracks
✅ **Growth mindset** - Tree literally grows as student learns
✅ **Biblical integration** - Natural, organic, not forced
✅ **Beauty & wonder** - Learning is alive, not mechanical
✅ **Individual journey** - Every student's tree is unique
✅ **Adaptive** - Grows with child K→12
✅ **Mastery-based** - Color changes show real progress
✅ **Transparent** - Parents/students see exactly where they are

## Questions?

The tree is ready to grow! Just need to:
1. Run database migration
2. Seed some standards
3. Create a page to display it
4. Watch your students' trees grow! 🌱→🌳

---

*"A tree is known by its fruit" - Matthew 12:33*
