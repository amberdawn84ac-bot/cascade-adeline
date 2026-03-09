import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import redis from '@/lib/redis';

export async function GET() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cacheKey = `daily-bread:${today}`;

  // Return cached version if available
  try {
    const cached = await redis.get<object>(cacheKey);
    if (cached) return NextResponse.json(cached);
  } catch (_) {}

  // Generate with Claude
  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: `You are a biblical scholar with deep expertise in ancient Hebrew and Greek texts. 
You help modern readers understand scripture more richly by surfacing what the original languages reveal.`,
      prompt: `Today's date is ${today}. Choose a meaningful, uplifting Bible verse appropriate for today.

Return ONLY valid JSON — no markdown, no code fences, no explanation before or after:
{
  "verse": "The verse text in clear modern English",
  "reference": "Book Chapter:Verse (e.g. Proverbs 3:5-6)",
  "original": "The key Hebrew or Greek word(s) with transliteration in parentheses",
  "originalMeaning": "What that word literally means — its full depth in the original language",
  "translationNote": "One sentence describing what nuance or meaning is lost or changed in common English translations. Use null if the translation is faithful.",
  "context": "One sentence of historical or cultural context that makes this verse richer"
}`,
    });

    const data = JSON.parse(text.trim());

    // Cache for 24 hours
    try {
      await redis.set(cacheKey, data, { ex: 86400 });
    } catch (_) {}

    return NextResponse.json(data);
  } catch (error) {
    console.error('[DailyBread] Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate daily bread' }, { status: 500 });
  }
}
