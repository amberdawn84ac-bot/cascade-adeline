# Lesson Schema Documentation

## Overview

Each lesson in Dear Adeline is a JSON object that defines the complete learning experience. Lessons are composed of **blocks** - modular content units that can be dynamically assembled, reordered, and conditionally displayed.

## Top-Level Lesson Structure

```json
{
  "lesson_id": "string (unique identifier)",
  "title": "string (lesson title)",
  "subject_track": "string (one of 8 tracks)",
  "grade_level": "string or array",
  "estimated_duration": "string (e.g., '45 minutes', '2 days')",
  "learning_objectives": ["array", "of", "objectives"],
  "scripture_foundation": {
    "primary_passage": "reference",
    "connection": "how it relates to lesson"
  },
  "blocks": [
    // Array of block objects (see below)
  ],
  "branching_logic": {
    // Optional branching paths
  },
  "credits": {
    // Array of life-credit mappings
  }
}
```

## Subject Tracks

Must be one of these 8 tracks:
1. `"gods-creation-science"`
2. `"health-naturopathy"`
3. `"food-systems"`
4. `"government-economics"`
5. `"justice-changemaking"`
6. `"discipleship-cultural-discernment"`
7. `"truth-based-history"`
8. `"english-literature"`

## Block Types

Every block has a common structure plus type-specific fields:

```json
{
  "block_id": "unique-id",
  "block_type": "type-name",
  "order": 1,
  "conditions": {
    // Optional: when to show this block
  },
  // Type-specific fields below
}
```

### 1. Text Block
Basic instructional text with field notes styling.

```json
{
  "block_type": "text",
  "content": "The lesson content in markdown",
  "visual_style": "paragraph|callout|handwritten",
  "emphasis": "normal|highlighted|important"
}
```

### 2. Scripture Block
Biblical passage with context and reflection.

```json
{
  "block_type": "scripture",
  "reference": "Leviticus 25:23",
  "translation": "ESV",
  "passage": "The full text of the passage",
  "hebrew_greek_notes": "Optional word studies",
  "reflection_prompt": "How does this connect to land ownership?"
}
```

### 3. Primary Source Block
Historical document, photo, or artifact.

```json
{
  "block_type": "primary_source",
  "source_type": "document|photo|audio|video|artifact",
  "title": "Dawes Application #42",
  "source_url": "url or path to source",
  "source_id": "hippocampus-id",
  "date": "1902",
  "creator": "Cherokee Nation applicant",
  "context": "Brief context about the source",
  "citation": "Full citation",
  "investigation_prompts": [
    "What do you notice about the language used?",
    "What's missing from this document?"
  ]
}
```

### 4. Investigation Block
Guided research or critical thinking activity.

```json
{
  "block_type": "investigation",
  "prompt": "Follow the money: Who benefited from the Dawes Act?",
  "investigation_type": "follow-the-money|compare-sources|timeline|network-map",
  "resources": [
    {
      "type": "primary_source",
      "source_id": "hippocampus-id"
    }
  ],
  "guiding_questions": [
    "Who owned the railroad companies?",
    "What happened to the land after allotment?"
  ],
  "expected_duration": "30 minutes"
}
```

### 5. Hands-On Activity Block
Farm work, experiments, building projects.

```json
{
  "block_type": "hands_on",
  "activity_title": "Soil Sovereignty Test",
  "description": "Compare soil health on different land types",
  "materials_needed": ["soil samples", "pH test kit"],
  "steps": [
    "Collect soil from 3 locations",
    "Test pH and composition",
    "Document findings"
  ],
  "safety_notes": ["Wear gloves"],
  "documentation_prompts": ["Take photos", "Record measurements"]
}
```

### 6. Quiz/Assessment Block
Questions to check understanding.

```json
{
  "block_type": "quiz",
  "quiz_type": "multiple-choice|true-false|short-answer|matching",
  "questions": [
    {
      "question": "What was the stated goal of the Dawes Act?",
      "type": "multiple-choice",
      "options": [
        "To assimilate Native Americans",
        "To preserve tribal lands",
        "To create national parks"
      ],
      "correct_answer": 0,
      "explanation": "The Dawes Act aimed to assimilate Native Americans by dividing tribal lands into individual allotments."
    }
  ],
  "passing_score": 70,
  "branching": {
    "on_pass": "next-block-id",
    "on_fail": "review-block-id"
  }
}
```

### 7. Photo Block
Historical or instructional photos.

```json
{
  "block_type": "photo",
  "image_url": "path/to/image",
  "caption": "Cherokee family on their allotment, 1903",
  "source": "Library of Congress",
  "analysis_prompts": [
    "What details do you notice?",
    "What story does this tell?"
  ],
  "field_notes_style": true
}
```

### 8. Video Block
Historical footage, documentaries, or instructional videos.

```json
{
  "block_type": "video",
  "video_url": "url-to-video",
  "title": "Interview with Dawes Act survivor",
  "duration": "8:32",
  "transcript_available": true,
  "viewing_prompts": [
    "Listen for: How did land division affect families?",
    "Notice: What emotions are expressed?"
  ]
}
```

### 9. Flashcard Block
Vocabulary, concepts, or people to remember.

```json
{
  "block_type": "flashcard",
  "cards": [
    {
      "front": "Allotment",
      "back": "Individual parcel of land assigned to a Native American family",
      "etymology": "From Old French 'aloter' - to divide by lot"
    }
  ],
  "style": "flip|swipe|quiz"
}
```

### 10. Infographic Block
Visual data presentation.

```json
{
  "block_type": "infographic",
  "title": "Land Loss: 1887-1934",
  "data_visualization": "timeline|bar-chart|network|map",
  "data_source": "hippocampus-id",
  "svg_content": "inline SVG or path to image",
  "interpretation_guide": "What patterns do you see?"
}
```

### 11. Game Block
Interactive learning game.

```json
{
  "block_type": "game",
  "game_type": "matching|sorting|timeline|map-placement",
  "title": "Match the Policy to Its Impact",
  "instructions": "Drag each policy to its consequence",
  "items": [
    {
      "id": "dawes",
      "content": "Dawes Act",
      "correct_match": "land-loss"
    }
  ]
}
```

### 12. Worksheet Block
Printable or digital worksheet.

```json
{
  "block_type": "worksheet",
  "title": "Dawes Act Analysis Worksheet",
  "format": "pdf|interactive",
  "sections": [
    {
      "title": "Document Analysis",
      "questions": [
        {
          "prompt": "Who created this document?",
          "response_type": "text|drawing|table"
        }
      ]
    }
  ],
  "downloadable": true
}
```

## Branching Logic

Lessons can branch based on student responses:

```json
{
  "branching_logic": {
    "decision_points": [
      {
        "trigger_block": "quiz-1",
        "conditions": {
          "if_score_above": 80,
          "show_blocks": ["advanced-investigation"],
          "skip_blocks": ["review-basics"]
        }
      },
      {
        "trigger_block": "investigation-2",
        "conditions": {
          "if_student_chooses": "deep-dive",
          "show_blocks": ["primary-source-3", "primary-source-4"],
          "else_show": ["summary-block"]
        }
      }
    ]
  }
}
```

## Life Credits Mapping

Each lesson can map to multiple academic subjects:

```json
{
  "credits": [
    {
      "subject": "US History",
      "hours": 1.5,
      "standards": ["OKHS.5.2", "CCSS.ELA.RH.8.2"]
    },
    {
      "subject": "Critical Thinking",
      "hours": 0.5
    },
    {
      "subject": "Research Skills",
      "hours": 1.0
    }
  ]
}
```

## Storage in Hippocampus

Lessons are stored in Supabase with:
- Full JSON in `lessons` table
- Individual blocks in `lesson_blocks` table for fine-grained retrieval
- Primary sources referenced by ID in `sources` table
- Scripture passages in `scripture_library` table

## Dynamic Assembly

Adeline's swarm agents can:
1. **Retrieve** relevant lesson templates
2. **Customize** blocks based on student interests
3. **Insert** personalized primary sources
4. **Adjust** difficulty and pacing
5. **Branch** based on student responses
6. **Track** credits and progress

---

This schema supports the full vision: primary sources, biblical integration, investigative learning, and beautiful field notes presentation.
