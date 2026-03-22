# Dear Adeline Lesson System - Complete Prototype

## Overview

This is a complete prototype of the Dear Adeline dynamic lesson system, built around **primary sources**, **biblical integration**, and **investigative learning**. This package demonstrates:

- How lessons are structured and stored
- What block types support dynamic, branching content
- How primary sources are chunked and retrieved
- What swarm agents assemble lessons on-the-fly
- How to render with the "field notes" aesthetic

## Sample Lesson

**"The Dawes Act & Land Allotment"** (Oklahoma History track)

This lesson demonstrates using primary sources (actual Dawes applications, historical photos, firsthand accounts) instead of textbook summaries. Students investigate original documents, connect to Scripture, and form their own conclusions.

## File Structure

```
dear-adeline-lesson-system/
├── README.md (this file)
├── LESSON_SCHEMA.md (detailed JSON schema docs)
├── INTEGRATION_GUIDE.md (how to add to your codebase)
├── example-lesson.json (complete Dawes Act lesson)
├── components/
│   ├── LessonRenderer.jsx (main lesson wrapper)
│   ├── blocks/
│   │   ├── TextBlock.jsx
│   │   ├── ScriptureBlock.jsx
│   │   ├── InvestigationBlock.jsx
│   │   ├── PrimarySourceBlock.jsx
│   │   ├── QuizBlock.jsx
│   │   ├── HandsOnBlock.jsx
│   │   ├── PhotoBlock.jsx
│   │   ├── VideoBlock.jsx
│   │   ├── FlashcardBlock.jsx
│   │   ├── InfographicBlock.jsx
│   │   ├── GameBlock.jsx
│   │   └── WorksheetBlock.jsx
│   └── FieldNotesWrapper.jsx
├── styles/
│   ├── field-notes.css (main aesthetic)
│   └── blocks.css (block-specific styles)
├── docs/
│   ├── SOURCE_PREPARATION.md
│   ├── STORAGE_STRUCTURE.md
│   ├── SWARM_AGENTS.md
│   └── BRANCHING_PATHS.md
└── data/
    ├── primary-sources/ (example chunked sources)
    └── scripture-references/ (example scripture storage)
```

## Key Concepts

### 1. Primary Sources Over Textbooks
Instead of quoting an Oklahoma history textbook, students examine:
- Actual Dawes Roll applications
- Historical photographs from archives
- Journal entries from people who lived through it
- Government documents and policies
- Newspaper articles from the era

### 2. Block-Based Lessons
Each lesson is composed of **blocks** - modular content pieces that can be:
- Reordered
- Conditionally shown based on student choices
- Rendered with different visual styles
- Combined to create branching paths

### 3. The Hippocampus (Knowledge Store)
Primary sources are chunked and stored in Supabase with:
- **Semantic embeddings** for retrieval
- **Metadata** (source type, era, subject, Scripture connections)
- **Citation info** (where it came from, who created it)
- **Usage rights** (public domain, fair use, etc.)

### 4. Swarm Agents
Different AI agents handle different tasks:
- **Source Retriever** - Finds relevant primary sources
- **Scripture Connector** - Identifies relevant biblical passages
- **Lesson Assembler** - Builds block sequence
- **Path Router** - Handles branching based on student responses
- **Assessment Generator** - Creates quizzes/activities

### 5. Field Notes Aesthetic
Lessons render with that beautiful nature journal look:
- Hand-drawn decorative elements
- Handwritten fonts
- Cream/parchment backgrounds
- Illustrations and diagrams
- Organic, non-rigid layouts

## Quick Start

1. **Review the example lesson**: `example-lesson.json`
2. **Study the schema**: `LESSON_SCHEMA.md`
3. **Examine components**: Look at each block component
4. **Read the docs**: Understand source prep and agent architecture
5. **Follow integration guide**: Add to Dear Adeline

## Core Philosophy

**No middleman's agenda.** Students investigate primary sources, connect to Scripture, and form their own understanding. Adeline guides the investigation but doesn't pre-digest the narrative.

---

Built for Dear Adeline Academy by Amber Renfroe
