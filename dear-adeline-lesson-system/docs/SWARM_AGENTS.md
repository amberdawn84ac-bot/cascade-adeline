# Swarm Agents Architecture

## Overview

Dear Adeline uses multiple specialized AI agents that work together (a "swarm") to dynamically assemble personalized lessons. Each agent has a specific role, and they collaborate to create investigative learning experiences.

## The Agent Swarm

```
Student Query → Router Agent
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
  Source Retriever        Scripture Connector
        ↓                       ↓
        └───────────┬───────────┘
                    ↓
            Lesson Assembler
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   Path Router          Assessment Generator
        ↓                       ↓
        └───────────┬───────────┘
                    ↓
            Response Formatter
                    ↓
            Student receives lesson
```

## Agent Specifications

### 1. Router Agent

**Purpose:** Understands student queries and routes to appropriate agents

**Input:**
- Student's question/interest
- Student's learning history
- Current subject context

**Output:**
- Subject track identification
- Relevant topics/keywords
- Suggested investigation approach

**Example:**
```
Student: "I want to learn about what happened to Cherokee land in Oklahoma"

Router Agent determines:
- Subject Track: truth-based-history
- Secondary Tracks: government-economics, justice-changemaking
- Keywords: Cherokee, Oklahoma, land, Dawes Act, Indian Territory
- Investigation Type: follow-the-money
```

**Implementation:**
```javascript
const routerPrompt = `You are the Router Agent for Dear Adeline. 
Analyze this student query and determine:
1. Primary subject track (from 8 options)
2. Investigation approach (timeline, follow-the-money, compare-sources, network-map)
3. Keywords for source retrieval
4. Estimated depth (quick overview vs deep dive)

Student query: "${studentQuery}"
Student context: ${studentProfile}`;
```

### 2. Source Retriever Agent

**Purpose:** Finds relevant primary sources from The Hippocampus

**Input:**
- Keywords from Router
- Subject track
- Student grade level
- Investigation type

**Output:**
- Ranked list of relevant primary sources
- Source metadata
- Suggested source sequence

**Process:**
1. Generate embedding from keywords
2. Semantic search in Supabase vector store
3. Filter by subject track relevance
4. Filter by grade-appropriate reading level
5. Rank by investigation usefulness
6. Return top 5-10 sources

**Implementation:**
```javascript
const sourceRetrieverPrompt = `You are the Source Retriever Agent.
Find primary sources for this investigation:

Keywords: ${keywords}
Subject: ${subjectTrack}
Investigation Type: ${investigationType}
Student Level: ${gradeLevel}

Search The Hippocampus and return:
1. Most relevant documents (3-5)
2. Supporting photos/visuals (2-3)
3. Alternative viewpoints (1-2)

Prioritize:
- Authenticity over popularity
- Primary over secondary sources
- Diversity of perspective
- Age-appropriateness`;

// Then execute semantic search
const { data: sources } = await supabase
  .from('sources')
  .select('*')
  .textSearch('chunk_text', keywords)
  .match({ subject_track: subjectTrack })
  .limit(10);
```

### 3. Scripture Connector Agent

**Purpose:** Identifies biblical passages relevant to the topic

**Input:**
- Topic/investigation
- Historical context
- Moral/ethical dimensions

**Output:**
- Primary scripture passage
- Connection explanation
- Hebrew/Greek word studies (if relevant)
- Reflection prompts

**Example:**
```
Topic: Dawes Act & land allotment

Scripture Connector identifies:
- Primary: Leviticus 25:23 (land belongs to God)
- Secondary: Proverbs 22:22-23 (don't rob the poor)
- Connection: God's design for land vs. commodity view
- Reflection: How did policy violate biblical principles?
```

**Implementation:**
```javascript
const scripturePrompt = `You are the Scripture Connector Agent.
Find biblical passages relevant to this topic:

Topic: ${topic}
Context: ${context}
Ethical dimensions: ${ethicalIssues}

Return:
1. Primary passage (most directly relevant)
2. 1-2 supporting passages
3. Hebrew/Greek insights
4. How Scripture applies to this investigation
5. Reflection questions

Avoid proof-texting. Find genuine connections between God's word 
and historical events/investigations.`;
```

### 4. Lesson Assembler Agent

**Purpose:** Combines sources and scripture into coherent lesson blocks

**Input:**
- Retrieved sources
- Scripture passages
- Investigation type
- Student preferences

**Output:**
- Ordered sequence of blocks
- Block metadata
- Estimated duration
- Life credit mappings

**Logic:**
1. Start with Scripture foundation
2. Introduce topic with text block
3. Present primary sources in investigation sequence
4. Intersperse investigation prompts
5. Add hands-on activities if relevant
6. Include assessment/reflection
7. Calculate credits

**Implementation:**
```javascript
const assemblerPrompt = `You are the Lesson Assembler Agent.
Create a lesson structure using these materials:

Sources: ${JSON.stringify(sources)}
Scripture: ${JSON.stringify(scripture)}
Investigation Type: ${investigationType}
Duration Target: ${durationMinutes} minutes

Build a lesson using these block types:
- text (introduction, transitions)
- scripture (foundation)
- primary_source (documents, photos)
- investigation (prompts, activities)
- hands_on (farm/practical work)
- quiz (assessment)

Order blocks logically:
1. Hook with scripture/question
2. Provide context
3. Present sources to investigate
4. Guide investigation
5. Synthesize learning
6. Assess understanding

Return lesson JSON following schema.`;
```

### 5. Path Router Agent

**Purpose:** Handles branching logic during lesson

**Input:**
- Student responses (quiz scores, choices)
- Current block position
- Available alternative paths

**Output:**
- Next block(s) to show
- Blocks to skip
- Personalized feedback

**Example Branching:**
```javascript
if (quizScore > 80) {
  // Student mastered basics
  return {
    show_blocks: ['advanced-investigation', 'deeper-sources'],
    skip_blocks: ['review-basics']
  };
} else if (quizScore < 70) {
  // Student needs more support
  return {
    show_blocks: ['review-basics', 'simplified-sources'],
    skip_blocks: ['advanced-investigation']
  };
}

if (studentChoice === 'investigate-railroads') {
  return {
    insert_blocks: railroadInvestigationBlocks,
    branch_to: 'railroad-path'
  };
}
```

### 6. Assessment Generator Agent

**Purpose:** Creates quizzes and checks understanding

**Input:**
- Lesson content
- Learning objectives
- Sources examined

**Output:**
- Quiz questions
- Correct answers
- Explanations
- Rubrics

**Question Types Generated:**
- Multiple choice (basic comprehension)
- Short answer (analysis)
- Document analysis (close reading)
- Compare/contrast (critical thinking)

**Implementation:**
```javascript
const assessmentPrompt = `You are the Assessment Generator.
Create quiz questions for this lesson:

Sources examined: ${sources}
Learning objectives: ${objectives}
Investigation type: ${investigationType}

Generate:
- 3 multiple choice (test document comprehension)
- 2 short answer (test analysis skills)
- 1 synthesis question (connect scripture + history)

Questions should:
- Reference specific sources
- Require critical thinking, not just recall
- Check "follow the money" investigation skills
- Connect to biblical principles where relevant`;
```

### 7. Response Formatter Agent

**Purpose:** Formats Adeline's conversational responses

**Input:**
- Lesson blocks
- Student question/context
- Conversation history

**Output:**
- Natural, conversational text
- Adeline's teaching voice
- Socratic questions
- Encouragement

**Adeline's Voice:**
- Warm, encouraging grandmother figure
- Asks questions rather than lecturing
- Celebrates curiosity
- Connects to real-world farm/life experiences
- References Scripture naturally

**Example:**
```javascript
const formatterPrompt = `You are Adeline, speaking to a student.
Transform this lesson content into natural conversation:

Lesson blocks: ${blocks}
Student question: "${studentQuestion}"

Speak as Adeline:
- Warm, encouraging tone
- Use Socratic questions
- Connect to farm life experiences
- Reference Scripture organically
- Guide, don't lecture
- Celebrate student's investigation skills

Example phrases:
- "That's such a curious question! Let's investigate together..."
- "What do you notice about this document?"
- "This reminds me of when we learned about..."
- "Scripture tells us... How does that connect to what you're seeing?"`;
```

## Agent Communication Flow

### Example: Student asks about Dawes Act

**Step 1 - Router:**
```javascript
{
  subject_track: "truth-based-history",
  secondary_tracks: ["government-economics", "justice-changemaking"],
  investigation_type: "follow-the-money",
  keywords: ["Dawes Act", "Cherokee", "land allotment", "Oklahoma"],
  depth: "deep-dive"
}
```

**Step 2 - Source Retriever:**
```javascript
{
  sources: [
    { id: "dawes-act-text", type: "document", rank: 10 },
    { id: "cherokee-family-photo", type: "photo", rank: 9 },
    { id: "dawes-application", type: "document", rank: 8 },
    { id: "land-loss-data", type: "infographic", rank: 8 }
  ]
}
```

**Step 3 - Scripture Connector:**
```javascript
{
  primary_passage: {
    reference: "Leviticus 25:23",
    text: "The land shall not be sold in perpetuity...",
    connection: "God's design for land vs. commodity view"
  },
  reflection: "How did the Dawes Act violate this principle?"
}
```

**Step 4 - Lesson Assembler:**
```javascript
{
  blocks: [
    { type: "scripture", content: leviticus_25_23 },
    { type: "text", content: introduction },
    { type: "primary_source", source_id: "dawes-act-text" },
    { type: "investigation", prompt: "Follow the money..." },
    // ... more blocks
  ]
}
```

**Step 5 - Response Formatter:**
```
"What a great question about Cherokee land! I'm so glad you're curious about this. 

Before we investigate what happened, let's look at what Scripture teaches about land. 
Leviticus 25:23 says... [scripture block renders]

Now, let's look at the actual law that was passed in 1887... [primary source block renders]"
```

## Swarm Orchestration

The swarm is coordinated by **LangGraph** workflow:

```javascript
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph({
  channels: {
    studentQuery: null,
    routingDecision: null,
    sources: null,
    scripture: null,
    lessonBlocks: null,
    formattedResponse: null
  }
});

workflow
  .addNode("router", routerAgent)
  .addNode("sourceRetriever", sourceRetrieverAgent)
  .addNode("scriptureConnector", scriptureConnectorAgent)
  .addNode("lessonAssembler", lessonAssemblerAgent)
  .addNode("responseFormatter", responseFormatterAgent);

workflow
  .addEdge("router", "sourceRetriever")
  .addEdge("router", "scriptureConnector")
  .addEdge(["sourceRetriever", "scriptureConnector"], "lessonAssembler")
  .addEdge("lessonAssembler", "responseFormatter");

const app = workflow.compile();
```

## Caching & Performance

**Cache frequently used:**
- Scripture passages and connections
- Common source combinations
- Lesson templates for standard topics

**Don't cache:**
- Student-specific responses
- Branching decisions
- Assessment results

## Error Handling

If any agent fails:
1. Log error with context
2. Fall back to simpler version
3. Alert if critical path broken
4. Provide graceful degradation

```javascript
try {
  sources = await sourceRetrieverAgent(query);
} catch (error) {
  logger.error("Source retrieval failed", { error, query });
  // Fallback: use pre-selected general sources
  sources = await getDefaultSourcesForTopic(topic);
}
```

## Monitoring & Improvement

Track:
- Which agents get invoked most
- Average response times
- Student satisfaction per agent
- Source quality ratings
- Scripture connection relevance

Use this data to:
- Fine-tune agent prompts
- Improve source tagging
- Expand scripture database
- Optimize swarm flow

---

**The swarm makes Dear Adeline smart:** Each agent is specialized, and together they create personalized, investigative, Scripture-centered learning experiences that no single AI could produce alone.
