# Quick Start Demo

## Test the Lesson System Locally

This guide shows you how to quickly test the lesson system components without integrating into your full app.

## Prerequisites

- Node.js 18+ installed
- Basic React knowledge

## 5-Minute Demo Setup

### 1. Create a Simple Test Page

```bash
# In your Dear Adeline project
npx create-next-app@latest lesson-demo --typescript --tailwind --app
cd lesson-demo
```

### 2. Copy Files

```bash
# From this package
cp -r components lesson-demo/components/
cp -r styles lesson-demo/styles/
cp example-lesson.json lesson-demo/public/
```

### 3. Create Demo Page

```typescript
// app/page.tsx
import LessonRenderer from '@/components/LessonRenderer';
import '@/styles/field-notes.css';
import '@/styles/blocks.css';

// Import the example lesson
import exampleLesson from '@/public/example-lesson.json';

export default function Home() {
  return (
    <main className="min-h-screen">
      <LessonRenderer lessonData={exampleLesson} />
    </main>
  );
}
```

### 4. Run Demo

```bash
npm run dev
```

Open http://localhost:3000 to see the Dawes Act lesson rendered with field notes styling!

## What to Test

### Visual Aesthetics
- [ ] Handwritten fonts loading correctly
- [ ] Cream/parchment background
- [ ] Decorative elements (lines, flourishes, borders)
- [ ] Scripture block with frame and corners
- [ ] Primary source block with tape corners
- [ ] Bottom border with botanical elements

### Interactions
- [ ] Scripture reflection input
- [ ] Primary source annotation prompts
- [ ] Expand/collapse language notes
- [ ] Investigation prompts

### Responsive Design
- [ ] View on mobile (should still look good)
- [ ] Tablet view
- [ ] Desktop view

## Testing Individual Blocks

### Test Just Scripture Block

```typescript
// app/test-scripture/page.tsx
import ScriptureBlock from '@/components/blocks/ScriptureBlock';
import '@/styles/field-notes.css';
import '@/styles/blocks.css';

const sampleScripture = {
  block_id: "test-scripture",
  block_type: "scripture",
  reference: "Leviticus 25:23",
  translation: "ESV",
  passage: "The land shall not be sold in perpetuity, for the land is mine. For you are strangers and sojourners with me.",
  hebrew_notes: "The Hebrew word for 'land' (אֶרֶץ eretz) emphasizes God's ownership...",
  reflection_prompt: "How does this apply to modern land ownership?"
};

export default function TestScripture() {
  return (
    <div className="field-notes-wrapper">
      <div className="field-notes-content">
        <ScriptureBlock blockData={sampleScripture} />
      </div>
    </div>
  );
}
```

### Test Primary Source Block

```typescript
// app/test-source/page.tsx
import PrimarySourceBlock from '@/components/blocks/PrimarySourceBlock';
import '@/styles/field-notes.css';
import '@/styles/blocks.css';

const sampleSource = {
  block_id: "test-source",
  block_type: "primary_source",
  source_type: "document",
  title: "Sample Historical Document",
  creator: "Unknown",
  date: "1887",
  context: "This is background context for the document",
  excerpt: "This is the document text that students will read and analyze...",
  citation: "Source citation goes here",
  investigation_prompts: [
    "What do you notice about the language?",
    "Who might have written this?"
  ]
};

export default function TestSource() {
  return (
    <div className="field-notes-wrapper">
      <div className="field-notes-content">
        <PrimarySourceBlock blockData={sampleSource} />
      </div>
    </div>
  );
}
```

## Styling Customization Demo

### Try Different Color Palettes

Edit `/styles/field-notes.css`:

```css
:root {
  /* Try a darker, more vintage look */
  --paper-cream: #F5F1E8;
  --paper-light: #EDE7D9;
  --ink-brown: #3D2F1F;
  
  /* Or a brighter, more colorful style */
  --neon-fuschia: #FF1493;
  --neon-orange: #FF8C42;
  --deep-purple: #9B59B6;
}
```

### Try Different Fonts

```css
/* More formal academic style */
--font-handwritten: 'Crimson Text', serif;
--font-neat: 'Lora', serif;

/* More playful style */
--font-handwritten: 'Pangolin', cursive;
--font-neat: 'Patrick Hand', cursive;
```

## Performance Testing

### Measure Component Load Times

```typescript
import { useEffect } from 'react';

useEffect(() => {
  console.time('LessonRender');
  // Component renders
  console.timeEnd('LessonRender');
}, []);
```

### Test with Large Lessons

Create a lesson with 20+ blocks and see how it performs.

## Debugging Tips

### Common Issues

**Fonts not loading:**
```bash
# Check browser console for 403 errors
# Verify Google Fonts API is accessible
# Try downloading fonts locally
```

**Styles not applying:**
```typescript
// Verify CSS is imported in correct order
import '@/styles/field-notes.css';  // Base styles first
import '@/styles/blocks.css';       // Block styles second
```

**React warnings about keys:**
```typescript
// Make sure every block has unique block_id
blocks.map(block => (
  <BlockComponent key={block.block_id} ... />
))
```

## Next Steps After Demo

1. **Connect to your AI** - Integrate with your Gemini/Claude setup
2. **Add real data** - Upload primary sources to Supabase
3. **Build swarm agents** - Implement the agent architecture
4. **Create more lessons** - Use example as template
5. **Test with students** - Get real feedback

## Sharing Your Demo

Want to show the team? Deploy to Vercel:

```bash
# From lesson-demo directory
vercel deploy
```

## Demo Data Included

This package includes:
- ✅ Complete Dawes Act lesson JSON
- ✅ 3 example primary sources with full metadata
- ✅ 4 example scripture passages with Hebrew/Greek notes
- ✅ All React components
- ✅ Complete CSS styling
- ✅ Documentation

Everything you need to see the vision in action!

---

**Questions?** Review the INTEGRATION_GUIDE.md for full production setup.
