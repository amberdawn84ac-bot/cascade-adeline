import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import redis from '@/lib/redis';
import { loadConfig } from '@/lib/config';

export async function GET() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cacheKey = `daily-bread:${today}`;

  // Return cached version if available
  try {
    const cached = await redis.get<object>(cacheKey);
    if (cached) return NextResponse.json(cached);
  } catch (_) {}

  // Generate with OpenAI
  try {
    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.7 });

    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a biblical scholar with deep expertise in ancient Hebrew and Greek texts. 
You help modern readers understand scripture more richly by surfacing what the original languages reveal.
You MUST respond with ONLY valid JSON — no markdown, no code fences, no explanation before or after.`,
      },
      {
        role: 'user',
        content: `Today's date is ${today}. Choose a meaningful, uplifting Bible verse appropriate for today.

Return ONLY this JSON object with no other text:
{
  "verse": "The verse text in clear modern English",
  "reference": "Book Chapter:Verse (e.g. Proverbs 3:5-6)",
  "original": "The key Hebrew or Greek word(s) with transliteration in parentheses",
  "originalMeaning": "What that word literally means — its full depth in the original language",
  "translationNote": "One sentence describing what nuance or meaning is lost or changed in common English translations. Use null if the translation is faithful.",
  "context": "One sentence of historical or cultural context that makes this verse richer"
}`,
      },
    ]);

    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
    let data;
    try {
      data = JSON.parse(text.trim());
    } catch (parseError) {
      console.error('[DailyBread] JSON parse error:', parseError);
      console.error('[DailyBread] Raw response:', text.substring(0, 200));
      
      // Fallback to a meaningful default verse
      data = {
        verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        reference: "Proverbs 3:5-6",
        original: "בָּטַח (batach) - to trust, to be confident",
        originalMeaning: "To lean on, to feel safe and secure, to have confidence in",
        translationNote: "The Hebrew conveys a sense of throwing your full weight onto something, complete reliance rather than partial trust",
        context: "Written by Solomon as wisdom for living, emphasizing complete dependence on God rather than human wisdom"
      };
    }

    // Cache for 24 hours
    try {
      await redis.set(cacheKey, data, { ex: 86400 });
    } catch (_) {}

    return NextResponse.json(data);
  } catch (error) {
    console.error('[DailyBread] Generation error:', error);
    
    // Return fallback verse instead of error
    return NextResponse.json({
      verse: "This is the day that the Lord has made; let us rejoice and be glad in it.",
      reference: "Psalm 118:24",
      original: "יוֹם (yom) - day, time, period",
      originalMeaning: "A specific point in time, this present moment",
      translationNote: null,
      context: "Part of the Hallel psalms sung during Jewish festivals, celebrating God's faithfulness"
    });
  }
}

