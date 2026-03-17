import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';

const expeditionSchema = z.object({
  location: z.string().describe("The full name of the location"),
  coordinates: z.string().describe("Approximate coordinates e.g. '36°N, 112°W'"),
  geology: z.object({
    formation: z.string().describe("How the land was geologically formed"),
    rocks: z.array(z.string()).describe("Key rock types found at this location"),
  }),
  archaeology: z.object({
    era: z.string().describe("The primary historical era of interest"),
    remnants: z.string().describe("Key ruins, artifacts, or archaeological finds"),
  }),
  sociology: z.object({
    culture: z.string().describe("How the land shaped the people who lived there"),
    connection: z.string().describe("The explicit link between geology and sociology"),
  }),
  characterFocus: z.string().describe("The specific virtue or character trait being developed (e.g., Diligence, Empathy, Stewardship)"),
  communityImpact: z.string().describe("How this specific project or knowledge can be directly used to serve a neighbor, family member, or the local community"),
  stewardshipAction: z.object({
    environmentalThreat: z.string().describe("Current threat to this location (development, pollution, invasive species, climate impact, resource extraction) - be specific"),
    affectedCommunity: z.string().describe("Who depends on this land/resource (indigenous communities, local farmers, wildlife, water users) - name specific groups"),
    actionSteps: z.array(z.string()).describe("Concrete steps to protect or restore this place (3-5 specific actions)"),
    deliveryTarget: z.string().describe("Specific neighbor or community member who needs help related to this location (e.g., 'Elderly neighbor Mrs. Johnson who needs firewood from this forest', 'Local family who needs water quality data from this creek')")
  }).describe("Concrete stewardship mission connecting this expedition to environmental protection and serving neighbors"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { location } = await req.json();
    if (!location) return NextResponse.json({ error: 'Missing location' }, { status: 400 });

    const userData = await prisma.user.findUnique({ where: { id: user.userId }, select: { gradeLevel: true } });
    const gradeBracket = getGradeBracket(userData?.gradeLevel ?? '');
    const topicKey = location.toLowerCase().trim();

    // Cache check - return instantly if cached
    const cached = await getCachedContent('expedition', topicKey, gradeBracket);
    if (cached) return NextResponse.json({ ...cached, cached: true });

    // Not cached - stream the generation
    const studentContext = await buildStudentContextPrompt(user.userId);
    const config = loadConfig();

    const result = await streamObject({
      model: openai(config.models.default || 'gpt-4o'),
      schema: expeditionSchema,
      prompt: `You are Adeline, a classical field naturalist and geographer.${studentContext} The student is planning a virtual expedition to a real-world location. Generate a rich, educational survey covering the geology, archaeology, and human geography of this place. Adapt the language complexity to match the student's grade level.

You must strictly frame this activity around serving others. Expeditions should involve stewardship or helping neighbors. Frame the expedition as an opportunity to learn about this place so the student can teach others, protect the environment, or serve their community through this knowledge. Never generate selfish or purely consumer-driven examples.

CRITICAL STEWARDSHIP ACTION DIRECTIVE: For EVERY expedition, generate a concrete stewardshipAction that connects the location study to environmental protection AND serving a specific neighbor:
1. Identify the REAL current threat to this location (be specific - name the development project, pollution source, invasive species, etc.)
2. Name who depends on this place (specific indigenous communities, local groups, wildlife species)
3. Provide 3-5 actionable steps (e.g., "Draft letter to County Planning Commission opposing [specific development]", "Map invasive species locations and share with [local conservation group]", "Test water quality and deliver results to [specific neighbor]")
4. Name a SPECIFIC neighbor or community member to serve (e.g., "Mrs. Johnson at 123 Oak Street who needs firewood", "The Martinez family who drinks from this creek")

The deliveryTarget must be concrete enough that the student could actually find and serve this person. No generic placeholders.

Survey location: ${location}`,
      temperature: 0.7,
      onFinish: async ({ object }) => {
        // Save to cache when complete
        await saveToCache('expedition', topicKey, gradeBracket, object as unknown as Record<string, unknown>);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Expedition generation error:', error);
    return NextResponse.json({ error: 'Failed to generate expedition report' }, { status: 500 });
  }
}

