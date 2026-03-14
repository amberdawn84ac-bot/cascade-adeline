import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';

const analysisSchema = z.object({
  passage: z.string().describe('The passage text in English'),
  reference: z.string().describe('The Bible reference (e.g., John 3:16)'),
  originalHebrew: z.string().optional().describe('Original Hebrew text if Old Testament'),
  originalGreek: z.string().optional().describe('Original Greek text if New Testament'),
  literalTranslation: z.string().describe('Word-for-word literal translation from the original language'),
  culturalContext: z.string().describe('Historical and cultural context explaining what this meant to the original audience'),
  originalNames: z.array(z.object({
    modern: z.string().describe('Modern anglicized name (e.g., Jesus, God, LORD)'),
    original: z.string().describe('Original Hebrew/Greek name (e.g., Yeshua, Elohim, YHWH)'),
    meaning: z.string().describe('What the original name means'),
  })).describe('All names in the passage with their original forms and meanings'),
  textualVariants: z.array(z.object({
    manuscript: z.string().describe('Which manuscript tradition (e.g., Codex Sinaiticus, Masoretic Text, Septuagint)'),
    variant: z.string().describe('The variant reading'),
    explanation: z.string().describe('Why this variant exists and which is likely original'),
  })).optional().describe('Significant manuscript variations if they exist'),
  historicalChanges: z.array(z.object({
    change: z.string().describe('What was changed in translation'),
    whenByWhom: z.string().describe('When and by whom (e.g., King James translators 1611, Jerome in Vulgate 405 AD)'),
    why: z.string().describe('The theological, political, or linguistic reason for the change'),
  })).optional().describe('How this text has been altered through translation history'),
  deeperMeaning: z.string().describe('What traditional English translations miss - the fuller meaning from original language, culture, and context'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.3 })
      .withStructuredOutput(analysisSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical biblical scholar with expertise in Hebrew, Greek, and textual criticism. You help students understand Scripture in its original languages and historical context.

CRITICAL DIRECTIVES:

1. ORIGINAL LANGUAGES:
   - Provide the actual Hebrew (for OT) or Greek (for NT) text
   - Give a literal, word-for-word translation showing what it actually says
   - Explain idioms, wordplay, or linguistic features lost in English

2. ORIGINAL NAMES:
   - ALWAYS use original names: YHWH (not LORD), Yeshua (not Jesus), Elohim (not God when appropriate)
   - Explain what each name means in Hebrew/Greek
   - Show how English translations obscure the original meaning

3. TEXTUAL CRITICISM:
   - If there are significant manuscript variations, cite them specifically
   - Reference actual manuscripts: Codex Sinaiticus, Codex Vaticanus, Masoretic Text, Dead Sea Scrolls, etc.
   - Explain which reading is likely original and why

4. HISTORICAL CHANGES:
   - Show how translators have changed the text over time
   - Cite specific examples: King James translators (1611), Jerome's Vulgate (405 AD), Septuagint (3rd century BC)
   - Explain WHY they made changes (theological bias, political pressure, linguistic limitations)

5. CULTURAL CONTEXT:
   - Explain what this meant to a 1st century Jew or early Christian
   - Reference historical events, customs, or beliefs that inform the meaning
   - Show what modern readers miss without this context

6. DEEPER MEANING:
   - Synthesize everything to show the fuller, richer meaning
   - Be specific about what traditional translations miss or obscure
   - Ground everything in scholarship, not speculation

Be rigorous. Be specific. Cite sources. Show the truth.`
      },
      {
        role: 'user',
        content: `Analyze this passage: ${reference}`
      }
    ]);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[bible-study/analyze] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze passage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
