# Branching Paths & Adaptive Learning

## Overview

Branching paths allow lessons to adapt dynamically based on student responses, choices, and performance. This creates personalized learning experiences where students can go deeper on topics of interest or get additional support where needed.

## Types of Branching

### 1. Performance-Based Branching

Students are directed to different content based on quiz scores or assessment results.

**Example:**
```json
{
  "block_id": "quiz-1",
  "block_type": "quiz",
  "branching": {
    "on_score_above_80": {
      "show_blocks": ["advanced-investigation", "primary-source-deep-dive"],
      "skip_blocks": ["review-basics", "simplified-explanation"],
      "message": "Great work! Let's dig deeper..."
    },
    "on_score_below_70": {
      "show_blocks": ["review-basics", "guided-practice"],
      "skip_blocks": ["advanced-investigation"],
      "message": "Let's review these concepts together..."
    }
  }
}
```

**Implementation:**
```javascript
function handleQuizBranching(score, branchingConfig) {
  if (score >= 80 && branchingConfig.on_score_above_80) {
    return {
      showBlocks: branchingConfig.on_score_above_80.show_blocks,
      skipBlocks: branchingConfig.on_score_above_80.skip_blocks,
      feedback: branchingConfig.on_score_above_80.message
    };
  }
  // ... handle other score ranges
}
```

### 2. Choice-Based Branching

Students choose which path to investigate, allowing interest-led learning.

**Example:**
```json
{
  "block_id": "investigation-choice",
  "block_type": "investigation",
  "prompt": "The Dawes Act affected many groups. Which would you like to investigate first?",
  "student_choice": {
    "options": [
      {
        "label": "Railroad Companies",
        "value": "railroads",
        "description": "Follow the money to railroad expansion"
      },
      {
        "label": "Oil Companies", 
        "value": "oil",
        "description": "Investigate oil discoveries on allotted lands"
      },
      {
        "label": "Individual Families",
        "value": "families",
        "description": "Stories of Cherokee families affected"
      }
    ],
    "branches": {
      "railroads": {
        "insert_blocks": [
          {
            "block_type": "primary_source",
            "source_id": "railroad-land-grants"
          },
          {
            "block_type": "investigation",
            "prompt": "Who owned the Santa Fe Railroad in 1890?"
          }
        ]
      },
      "oil": {
        "insert_blocks": [
          {
            "block_type": "primary_source",
            "source_id": "oklahoma-oil-boom"
          },
          {
            "block_type": "infographic",
            "data_id": "oil-discovery-map"
          }
        ]
      },
      "families": {
        "insert_blocks": [
          {
            "block_type": "primary_source",
            "source_id": "cherokee-oral-histories"
          }
        ]
      }
    },
    "allow_multiple": true, // Can explore more than one path
    "show_all_eventually": false // Or require they explore all
  }
}
```

**Implementation:**
```javascript
function handleChoiceBranching(choice, branchConfig) {
  const selectedPath = branchConfig.branches[choice];
  
  return {
    insertBlocks: selectedPath.insert_blocks,
    pathId: choice,
    canExploreOthers: branchConfig.allow_multiple
  };
}
```

### 3. Interest-Based Branching

System observes what students engage with most and adapts accordingly.

**Example:**
```json
{
  "adaptive_logic": {
    "observe_engagement": true,
    "metrics": ["time_spent", "annotations_made", "questions_asked"],
    "adaptations": {
      "high_document_engagement": {
        "increase_sources": true,
        "source_types": ["document", "photo"]
      },
      "prefers_visual_learning": {
        "increase_sources": true,
        "source_types": ["photo", "infographic", "video"]
      },
      "asks_many_questions": {
        "add_investigation_prompts": true,
        "deeper_dive_available": true
      }
    }
  }
}
```

### 4. Prerequisite-Based Branching

Certain blocks only appear if prerequisite knowledge is demonstrated.

**Example:**
```json
{
  "block_id": "advanced-economic-analysis",
  "block_type": "investigation",
  "conditions": {
    "requires_completion": ["basic-economics-quiz"],
    "requires_score_above": 75,
    "or_has_completed_lessons": ["economics-101"]
  }
}
```

### 5. Time-Based Branching

Different content based on how much time student has available.

**Example:**
```json
{
  "time_preference": {
    "quick_overview": {
      "duration": "15 minutes",
      "show_blocks": ["intro", "key-source", "summary", "quick-quiz"]
    },
    "standard_lesson": {
      "duration": "45 minutes",
      "show_blocks": ["intro", "scripture", "sources-1-3", "investigation", "quiz"]
    },
    "deep_dive": {
      "duration": "2 hours",
      "show_blocks": ["full-lesson", "all-sources", "hands-on", "extended-investigation"]
    }
  }
}
```

## Branching Logic Structure

### In Lesson JSON

```json
{
  "branching_logic": {
    "decision_points": [
      {
        "trigger_block": "quiz-1",
        "trigger_type": "score", // or "choice", "completion", "time"
        "conditions": {
          "if_score_above": 80,
          "then": {
            "show_blocks": ["advanced-content"],
            "skip_blocks": ["review-content"],
            "update_path": "advanced-track"
          },
          "else_if_score_below": 70,
          "then": {
            "show_blocks": ["review-content"],
            "skip_blocks": ["advanced-content"],
            "update_path": "support-track"
          }
        }
      },
      {
        "trigger_block": "investigation-choice",
        "trigger_type": "choice",
        "conditions": {
          "on_choice": {
            "railroads": {
              "insert_blocks": ["railroad-investigation-sequence"]
            },
            "oil": {
              "insert_blocks": ["oil-investigation-sequence"]
            }
          }
        }
      }
    ]
  }
}
```

### In React Component

```javascript
const [visibleBlocks, setVisibleBlocks] = useState(initialBlocks);
const [currentPath, setCurrentPath] = useState('standard');
const [studentChoices, setStudentChoices] = useState({});

function handleBranching(triggerBlock, response) {
  // Find branching rules for this block
  const branchPoint = lesson.branching_logic.decision_points.find(
    dp => dp.trigger_block === triggerBlock.block_id
  );
  
  if (!branchPoint) return;
  
  switch (branchPoint.trigger_type) {
    case 'score':
      handleScoreBranching(response.score, branchPoint.conditions);
      break;
    case 'choice':
      handleChoiceBranching(response.choice, branchPoint.conditions);
      break;
    case 'completion':
      handleCompletionBranching(response, branchPoint.conditions);
      break;
  }
}

function handleScoreBranching(score, conditions) {
  if (score >= conditions.if_score_above) {
    setVisibleBlocks(prev => [
      ...prev,
      ...conditions.then.show_blocks
    ].filter(id => !conditions.then.skip_blocks.includes(id)));
    
    setCurrentPath(conditions.then.update_path);
  }
}
```

## Complex Branching Scenarios

### Multi-Factor Branching

Combine multiple conditions:

```json
{
  "conditions": {
    "all_of": [
      { "quiz_score_above": 80 },
      { "investigation_completed": true },
      { "time_available": "60_minutes" }
    ],
    "then": {
      "show_blocks": ["expert-level-investigation"]
    }
  }
}
```

### Cumulative Progress Branching

Track progress across multiple lessons:

```json
{
  "conditions": {
    "student_progress": {
      "completed_lessons_in_track": 3,
      "average_score": 85,
      "investigation_depth": "advanced"
    },
    "then": {
      "unlock_blocks": ["capstone-project"],
      "suggest_next": "independent-research"
    }
  }
}
```

## Best Practices

### 1. Always Provide Value

Every branch should add value, not just be different:
- ✅ Advanced students get deeper sources
- ❌ Advanced students just get more of the same

### 2. No Dead Ends

Every path should lead somewhere meaningful:
```json
// Good - paths converge back
"railroads" → railroad_investigation → synthesis_block
"oil" → oil_investigation → synthesis_block

// Bad - path just stops
"railroads" → railroad_investigation → [nothing]
```

### 3. Make Choices Clear

Students should understand what each choice means:
```json
{
  "label": "Railroad Companies",
  "description": "Investigate how railroads benefited from allotted lands",
  "estimated_time": "20 minutes",
  "difficulty": "moderate"
}
```

### 4. Allow Exploration

Don't lock students into one path forever:
```json
{
  "allow_path_switching": true,
  "show_other_options": "After completing current investigation",
  "can_revisit": true
}
```

### 5. Track for Credit

Ensure all paths earn appropriate credit:
```json
{
  "railroad_path": {
    "credits": { "history": 1.0, "economics": 0.5 }
  },
  "oil_path": {
    "credits": { "history": 1.0, "science": 0.5 }
  }
}
```

## Branching Visualization

For complex lessons, visualize paths:

```
                    [Introduction]
                          ↓
                   [Scripture Block]
                          ↓
                      [Quiz 1]
                    /    |    \
              Score<70  70-80  >80
                  ↓      ↓      ↓
              [Review] [Standard] [Advanced]
                  ↓      ↓      ↓
                    [Investigation Choice]
                    /      |      \
            Railroads    Oil    Families
                  ↓      ↓      ↓
              [Path-specific sources]
                  ↓      ↓      ↓
                    \    |    /
                   [Synthesis]
                       ↓
                 [Final Assessment]
```

## Implementation Checklist

When adding branching to a lesson:

- [ ] Define clear decision points
- [ ] Specify trigger conditions
- [ ] Create content for each path
- [ ] Ensure paths converge or conclude meaningfully
- [ ] Test all possible paths
- [ ] Verify credit calculations for each path
- [ ] Add path tracking to student progress
- [ ] Provide clear choice descriptions
- [ ] Allow backtracking if appropriate
- [ ] Document branching logic for future editing

## Performance Considerations

**Pre-load branch content:**
```javascript
// Load blocks that might be shown based on common choices
useEffect(() => {
  const likelyBlocks = predictLikelyBranches(studentProfile);
  preloadBlocks(likelyBlocks);
}, [studentProfile]);
```

**Lazy load advanced content:**
```javascript
// Only load if student reaches advanced level
if (score > 85) {
  const advancedBlocks = await fetchAdvancedContent(lessonId);
  setAvailableBlocks(prev => [...prev, ...advancedBlocks]);
}
```

---

**Branching makes lessons alive:** Each student's journey through the material is unique, guided by their interests, abilities, and choices.
