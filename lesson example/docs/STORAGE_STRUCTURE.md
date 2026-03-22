# Storage Structure & Hippocampus Architecture

## Overview

The Hippocampus is Dear Adeline's knowledge management system - where primary sources, scripture, and lesson components are stored for dynamic retrieval. This document explains the complete storage architecture.

## Database Schema

### 1. Sources Table

Stores chunked primary source materials with embeddings for semantic search.

```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- document | photo | audio | video | artifact
  title TEXT NOT NULL,
  creator TEXT,
  date TEXT, -- When the source was created (e.g., "1887", "ca. 1903")
  date_digitized TIMESTAMPTZ,
  location TEXT, -- Where source was created
  collection TEXT, -- Archive/library
  url TEXT, -- Link to original
  rights TEXT, -- public_domain | fair_use | cc_by
  
  -- Content
  chunk_text TEXT, -- Actual content (transcribed if needed)
  chunk_index INTEGER, -- For multi-chunk sources
  total_chunks INTEGER,
  
  -- Search/Retrieval
  embedding VECTOR(1536), -- Semantic search
  subject_track TEXT, -- Primary subject
  relevance_scores JSONB, -- { "truth-based-history": 10, "government": 8, ... }
  topics TEXT[], -- Searchable tags
  era TEXT, -- Historical period
  
  -- Educational Metadata
  reading_level TEXT, -- "6-8", "9-12", etc.
  content_warnings TEXT[],
  investigation_types TEXT[], -- "follow-the-money", "timeline", etc.
  
  -- Scripture Connections
  scripture_connections JSONB, -- [{ passage, connection }]
  
  -- Full Metadata
  metadata JSONB, -- Flexible additional data
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX sources_embedding_idx ON sources 
  USING ivfflat (embedding vector_cosine_ops);
  
CREATE INDEX sources_text_idx ON sources 
  USING GIN (to_tsvector('english', chunk_text));
  
CREATE INDEX sources_subject_idx ON sources(subject_track);
CREATE INDEX sources_topics_idx ON sources USING GIN(topics);
```

**Example Row:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source_id": "dawes-act-section-5",
  "source_type": "document",
  "title": "Dawes Act Section 5: Surplus Land Provision",
  "creator": "U.S. Congress",
  "date": "1887-02-08",
  "collection": "National Archives",
  "url": "https://www.archives.gov/...",
  "rights": "public_domain",
  "chunk_text": "SEC. 5. That upon the approval of the allotments...",
  "chunk_index": 5,
  "total_chunks": 12,
  "embedding": [0.023, -0.145, ...], // 1536 dimensions
  "subject_track": "truth-based-history",
  "relevance_scores": {
    "truth-based-history": 10,
    "government-economics": 9,
    "justice-changemaking": 8
  },
  "topics": ["Dawes Act", "land allotment", "Native American", "Oklahoma"],
  "era": "late-19th-century",
  "reading_level": "9-12",
  "investigation_types": ["follow-the-money", "document-analysis"],
  "scripture_connections": [{
    "passage": "Leviticus 25:23",
    "connection": "Contradicts God's principle that land belongs to Him"
  }]
}
```

### 2. Scripture Library Table

```sql
CREATE TABLE scripture_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL, -- "Leviticus 25:23"
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER, -- For passages spanning verses
  translation TEXT NOT NULL, -- "ESV", "NASB", etc.
  
  -- Content
  passage TEXT NOT NULL,
  hebrew_greek_notes TEXT,
  word_studies JSONB, -- { "land": { "hebrew": "eretz", "meaning": "..." } }
  
  -- Search
  embedding VECTOR(1536),
  topics TEXT[], -- "land stewardship", "justice", etc.
  themes TEXT[], -- "covenant", "redemption", etc.
  
  -- Connections
  related_passages TEXT[], -- Other scripture references
  historical_context TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX scripture_embedding_idx ON scripture_library 
  USING ivfflat (embedding vector_cosine_ops);
  
CREATE INDEX scripture_topics_idx ON scripture_library USING GIN(topics);
CREATE INDEX scripture_reference_idx ON scripture_library(reference);
```

### 3. Lessons Table

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subject_track TEXT NOT NULL,
  
  -- Lesson Structure
  lesson_json JSONB NOT NULL, -- Full lesson per LESSON_SCHEMA.md
  
  -- Metadata
  grade_level TEXT[],
  estimated_duration TEXT,
  learning_objectives TEXT[],
  
  -- Usage Tracking
  times_used INTEGER DEFAULT 0,
  avg_completion_time INTERVAL,
  avg_student_rating NUMERIC(3,2),
  
  -- Version Control
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lessons_subject_idx ON lessons(subject_track);
CREATE INDEX lessons_active_idx ON lessons(is_active);
```

### 4. Student Progress Table

```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL, -- Or UUID if you have user table
  lesson_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  
  -- Response Data
  response JSONB, -- Student's answers, reflections, etc.
  time_spent INTERVAL,
  
  -- Status
  completed BOOLEAN DEFAULT FALSE,
  score NUMERIC(5,2), -- If applicable (quiz blocks)
  
  -- Branching
  path_taken TEXT, -- Which branch they followed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

CREATE INDEX progress_student_idx ON student_progress(student_id);
CREATE INDEX progress_lesson_idx ON student_progress(lesson_id);
```

### 5. Life Credits Table

```sql
CREATE TABLE life_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  
  -- Credit Details
  subject TEXT NOT NULL, -- "US History", "Biblical Studies", etc.
  hours NUMERIC(4,2) NOT NULL,
  standards TEXT[], -- Academic standards met
  
  -- Verification
  completed_blocks TEXT[], -- Which blocks contributed
  verified_by TEXT, -- Parent/teacher verification
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

CREATE INDEX credits_student_idx ON life_credits(student_id);
CREATE INDEX credits_subject_idx ON life_credits(subject);
```

## Semantic Search Functions

### Source Matching Function

```sql
CREATE OR REPLACE FUNCTION match_sources(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  title TEXT,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.source_id,
    s.title,
    s.chunk_text,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM sources s
  WHERE 
    (filter_subject IS NULL OR s.subject_track = filter_subject)
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Scripture Matching Function

```sql
CREATE OR REPLACE FUNCTION match_scripture(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  reference TEXT,
  passage TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.reference,
    s.passage,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM scripture_library s
  WHERE 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Data Population Workflow

### 1. Adding a New Primary Source

```typescript
// Example: Adding Dawes Act document
async function addPrimarySource() {
  // 1. Prepare content
  const sourceData = {
    source_id: "dawes-act-section-5",
    source_type: "document",
    title: "Dawes Act Section 5",
    creator: "U.S. Congress",
    date: "1887-02-08",
    chunk_text: "SEC. 5. That upon the approval...",
    // ... other fields
  };
  
  // 2. Generate embedding
  const embedding = await generateEmbedding(sourceData.chunk_text);
  
  // 3. Insert to database
  const { data, error } = await supabase
    .from('sources')
    .insert({
      ...sourceData,
      embedding,
      created_at: new Date().toISOString()
    });
}
```

### 2. Adding Scripture

```typescript
async function addScripture() {
  const scriptureData = {
    reference: "Leviticus 25:23",
    book: "Leviticus",
    chapter: 25,
    verse_start: 23,
    translation: "ESV",
    passage: "The land shall not be sold in perpetuity...",
    hebrew_greek_notes: "The Hebrew word 'eretz'...",
    topics: ["land stewardship", "covenant", "ownership"]
  };
  
  const embedding = await generateEmbedding(
    scriptureData.passage + " " + scriptureData.topics.join(" ")
  );
  
  await supabase.from('scripture_library').insert({
    ...scriptureData,
    embedding
  });
}
```

## Retrieval Patterns

### Pattern 1: Topic-Based Source Retrieval

```typescript
async function findSourcesForTopic(topic: string, subjectTrack: string) {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(topic);
  
  // Semantic search
  const { data } = await supabase.rpc('match_sources', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
    filter_subject: subjectTrack
  });
  
  return data;
}
```

### Pattern 2: Multi-Source Investigation

```typescript
async function assembleInvestigation(keywords: string[]) {
  const sources = [];
  
  for (const keyword of keywords) {
    const embedding = await generateEmbedding(keyword);
    const matches = await supabase.rpc('match_sources', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 5
    });
    sources.push(...matches.data);
  }
  
  // Deduplicate by source_id
  return Array.from(
    new Map(sources.map(s => [s.source_id, s])).values()
  );
}
```

### Pattern 3: Scripture Connection

```typescript
async function findRelevantScripture(topic: string, context: string) {
  const query = `${topic} ${context}`;
  const embedding = await generateEmbedding(query);
  
  const { data } = await supabase.rpc('match_scripture', {
    query_embedding: embedding,
    match_threshold: 0.65,
    match_count: 3
  });
  
  return data;
}
```

## Caching Strategy

**Cache at multiple levels:**

1. **Source chunks** - Cache frequently accessed sources in Redis
2. **Embeddings** - Cache query embeddings for common searches
3. **Assembled lessons** - Cache complete lesson JSON for popular lessons
4. **Scripture passages** - Keep all scripture in memory (small dataset)

```typescript
// Example caching
const cacheKey = `source:${sourceId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const source = await supabase
  .from('sources')
  .select('*')
  .eq('source_id', sourceId)
  .single();

await redis.set(cacheKey, JSON.stringify(source), 'EX', 3600);
return source;
```

## Performance Optimization

### Embedding Generation

- Batch embed multiple sources at once
- Cache embeddings for reuse
- Use async processing for large imports

### Search Performance

- Keep embedding dimensions at 1536 (optimal for most models)
- Use appropriate match_threshold (0.65-0.8 range)
- Limit results to what's needed (5-10 typically sufficient)

### Storage Optimization

- Compress large text chunks
- Store images/videos externally (S3/Cloudflare)
- Archive old/unused lessons

## Backup Strategy

```bash
# Daily backup of critical tables
pg_dump -h $DB_HOST -U $DB_USER -t sources -t scripture_library -t lessons > backup.sql

# Backup to S3
aws s3 cp backup.sql s3://dear-adeline-backups/$(date +%Y-%m-%d).sql
```

---

**The Hippocampus grows:** As you add more sources, the system becomes smarter at finding relevant materials for any student inquiry.
