# Credit and Standards Tracking System

> Ported from the original dear-adeline repo for reference.

## Overview

Dear Adeline uses a **dual-tracking system** to meet both Oklahoma's time-based credit requirements and competency-based learning goals.

## Two Parallel Systems

### 1. Time-Based Credits (Oklahoma Compliance)

**Purpose**: Meet Oklahoma's requirement that 1 credit = 120 hours of instruction (full year course)

**How It Works**:
- Students earn credits based on **time spent** on activities
- Credit calculation:
  - 0.005 credits = 30 minutes (0.6 hours)
  - 0.01 credits = 1 hour
  - 0.02 credits = 2-3 hours

### 2. Standards-Based Mastery (Competency Tracking)

**Purpose**: Track what students actually **know and can do** based on Oklahoma state standards

**How It Works**:
- State standards define specific learning objectives (e.g., "OK.MATH.8.A.1")
- Students progress through mastery levels:
  - **Introduced**: First exposure to the standard
  - **Developing**: Working toward proficiency
  - **Proficient**: Meets the standard
  - **Mastered**: Exceeds the standard

## Current Implementation (cascade-adeline)

The standards system has been ported to Prisma models:
- `StateStandard` — Official standards with codes, subjects, grade levels
- `LearningComponent` — Granular sub-skills within each standard
- `SkillStandardMapping` — Links Concepts to state standards
- `StudentStandardProgress` — Tracks mastery level per student per standard

### Services:
- `src/lib/services/standardsService.ts` — Standards CRUD + progress tracking
- `src/lib/services/activityToStandardsMapper.ts` — AI-powered activity → standards alignment

### Seeds:
- `prisma/seed-standards.ts` — 36 Oklahoma standards (Math, ELA, Science, Social Studies, K-8)
