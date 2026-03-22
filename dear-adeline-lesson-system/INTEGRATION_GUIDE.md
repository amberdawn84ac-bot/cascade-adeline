# Integration Guide

## Adding the Lesson System to Dear Adeline

This guide shows you how to integrate the lesson system into your existing Next.js/Supabase Dear Adeline application.

## Prerequisites

- Next.js 14+ project
- Supabase database
- Google Gemini AI integration
- LangGraph (for swarm agents)

## Step 1: Install Dependencies

```bash
npm install @langchain/langgraph @langchain/google-genai
npm install marked react-markdown  # For markdown rendering
```

## Step 2: Database Setup

### Create Supabase Tables

```sql
-- Sources table (for primary source chunks)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- document, photo, audio, video, artifact
  title TEXT NOT NULL,
  creator TEXT,
  date TEXT,
  collection TEXT,
  url TEXT,
  rights TEXT, -- public_domain, fair_use, cc_by
  metadata JSONB,
  chunk_text TEXT,
  embedding VECTOR(1536), -- For semantic search
  subject_track TEXT,
  relevance_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for semantic search
CREATE INDEX ON sources USING ivfflat (embedding vector_cosine_ops);

-- Full text search index
CREATE INDEX sources_text_idx ON sources USING GIN (to_tsvector('english', chunk_text));

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subject_track TEXT NOT NULL,
  lesson_json JSONB NOT NULL, -- Full lesson structure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scripture library
CREATE TABLE scripture_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL,
  translation TEXT NOT NULL,
  passage TEXT NOT NULL,
  hebrew_greek_notes TEXT,
  topics TEXT[], -- For search
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student progress tracking
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  response JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enable Vector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 3: Copy Files to Your Project

```bash
# Copy components
cp -r components/* [your-project]/components/

# Copy styles
cp -r styles/* [your-project]/styles/

# Copy example data
mkdir -p [your-project]/data/lessons
cp example-lesson.json [your-project]/data/lessons/
```

## Step 4: Add Lesson System to Your API

### Create API Route: `/api/lessons/retrieve`

```typescript
// app/api/lessons/retrieve/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { query, subjectTrack } = await request.json();
  const supabase = createClient();
  
  // Generate embedding for query
  const embedding = await generateEmbedding(query);
  
  // Semantic search for relevant sources
  const { data: sources } = await supabase
    .rpc('match_sources', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 10,
      filter_subject: subjectTrack
    });
  
  return NextResponse.json({ sources });
}
```

### Create API Route: `/api/lessons/assemble`

```typescript
// app/api/lessons/assemble/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { assembleLessonWithSwarm } from '@/lib/swarm';

export async function POST(request: Request) {
  const { studentQuery, sources, scripture } = await request.json();
  
  // Use swarm agents to assemble lesson
  const lesson = await assembleLessonWithSwarm({
    query: studentQuery,
    sources,
    scripture
  });
  
  return NextResponse.json({ lesson });
}
```

## Step 5: Implement Swarm Agents

### Create `/lib/swarm/index.ts`

```typescript
import { StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.0-flash-exp",
  apiKey: process.env.GOOGLE_API_KEY,
});

// Router Agent
async function routerAgent(state: any) {
  const prompt = `Analyze this student query and determine:
  1. Primary subject track
  2. Investigation type
  3. Keywords for retrieval
  
  Query: "${state.studentQuery}"`;
  
  const response = await model.invoke(prompt);
  return { routingDecision: response };
}

// Source Retriever Agent
async function sourceRetrieverAgent(state: any) {
  // Implement source retrieval logic
  // See SWARM_AGENTS.md for full implementation
}

// Create workflow
const workflow = new StateGraph({
  channels: {
    studentQuery: null,
    routingDecision: null,
    sources: null,
    scripture: null,
    lessonBlocks: null
  }
});

workflow
  .addNode("router", routerAgent)
  .addNode("sourceRetriever", sourceRetrieverAgent)
  // Add other agents...
  
export const lessonSwarm = workflow.compile();
```

## Step 6: Create Lesson Page

### `/app/lessons/[lessonId]/page.tsx`

```typescript
import LessonRenderer from '@/components/LessonRenderer';
import { createClient } from '@/utils/supabase/server';

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
  const supabase = createClient();
  
  const { data: lesson } = await supabase
    .from('lessons')
    .select('lesson_json')
    .eq('lesson_id', params.lessonId)
    .single();
  
  return <LessonRenderer lessonData={lesson.lesson_json} />;
}
```

## Step 7: Integrate with Chat Interface

### In your existing chat component:

```typescript
// When Adeline needs to teach a lesson
if (shouldShowLesson) {
  const lesson = await fetch('/api/lessons/assemble', {
    method: 'POST',
    body: JSON.stringify({
      studentQuery: message,
      sources: retrievedSources,
      scripture: relevantScripture
    })
  }).then(r => r.json());
  
  // Render lesson inline
  return <LessonRenderer lessonData={lesson} />;
}
```

## Step 8: Add Field Notes Styling

### In `/app/layout.tsx` or global CSS:

```typescript
import '@/styles/field-notes.css';
import '@/styles/blocks.css';
```

## Step 9: Seed Initial Data

### Upload example lesson:

```typescript
// scripts/seed-lessons.ts
import { createClient } from '@supabase/supabase-js';
import exampleLesson from '../data/lessons/example-lesson.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

await supabase.from('lessons').insert({
  lesson_id: exampleLesson.lesson_id,
  title: exampleLesson.title,
  subject_track: exampleLesson.subject_track,
  lesson_json: exampleLesson
});
```

## Step 10: Test the System

1. Navigate to `/lessons/dawes-act-oklahoma-001`
2. Verify field notes styling renders correctly
3. Test block interactions (scripture reflection, primary source annotations)
4. Try branching logic by answering quiz questions

## Configuration Options

### Environment Variables

```env
# .env.local
GOOGLE_API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Lesson system config
ENABLE_BRANCHING=true
DEFAULT_SUBJECT_TRACK=truth-based-history
```

### Customizing Adeline's Voice

Edit the Response Formatter agent prompt in `/lib/swarm/responseFormatter.ts`:

```typescript
const ADELINE_VOICE = `You are Adeline, a wise grandmother who...
[customize her voice based on your vision]`;
```

## Troubleshooting

**Issue:** Fonts not loading
**Fix:** Verify Google Fonts import in field-notes.css

**Issue:** Sources not retrieving
**Fix:** Check vector embeddings are being generated correctly

**Issue:** Swarm agents timing out
**Fix:** Increase timeout limits, consider caching common responses

## Next Steps

1. **Add more lessons** - Use example-lesson.json as template
2. **Populate sources** - Follow SOURCE_PREPARATION.md guide
3. **Test branching** - Create lessons with multiple paths
4. **Customize styling** - Adjust field-notes.css for your brand
5. **Monitor performance** - Track agent response times
6. **Gather feedback** - Test with students, refine prompts

## Support Files

- See `LESSON_SCHEMA.md` for complete JSON specification
- See `SOURCE_PREPARATION.md` for source collection workflow
- See `SWARM_AGENTS.md` for agent architecture details
- See `STORAGE_STRUCTURE.md` for database schema

---

**You're ready to build investigative, Scripture-centered lessons for Dear Adeline!**
