import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const projectId = formData.get('projectId') as string;

    if (!photo || !projectId) {
      return NextResponse.json({ error: 'Photo and projectId are required' }, { status: 400 });
    }

    // Convert photo to base64 for vision analysis
    const bytes = await photo.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${photo.type};base64,${base64}`;

    // Create initial state for LangGraph with vision analysis
    const initialState = {
      messages: [
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: 'Analyze this domestic arts project photo and provide details about what was created, skills demonstrated, and suggested fractional credits to award.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        })
      ],
      userId: user.userId,
      intent: 'IMAGE_LOG' as const, // Use the vision analyzer
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: {
        timestamp: new Date().toISOString(),
        user_role: user.role,
        request_type: 'domestic_arts_photo_analysis',
        projectId,
      },
    } as any;

    // Run the LangGraph for vision analysis
    const result = await adelineBrainRunnable.invoke(initialState);

    // Extract credits from the vision analysis
    let creditsAwarded = 0.25; // Default fractional credit for domestic arts
    const analysisText = result.response_content;
    
    // Try to extract credit amount from the response
    const creditMatch = analysisText.match(/(\d+\.?\d*)\s*credit/i);
    if (creditMatch) {
      creditsAwarded = Math.min(parseFloat(creditMatch[1]), 1.0); // Cap at 1 credit
    }

    // Update the transcript entry with credits and photo reference
    await prisma.transcriptEntry.update({
      where: { id: projectId },
      data: {
        creditsEarned: creditsAwarded,
        notes: (await prisma.transcriptEntry.findUnique({
          where: { id: projectId },
          select: { notes: true }
        }))?.notes + `\n\nPhoto Analysis: ${analysisText}\nCredits Awarded: ${creditsAwarded}`,
      },
    });

    // Trigger reflection coach for the completed activity
    const reflectionState = {
      messages: [new HumanMessage(`I completed a domestic arts project and earned ${creditsAwarded} credits. Help me reflect on what I learned and accomplished.`)],
      userId: user.userId,
      intent: 'REFLECT' as const,
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: {
        timestamp: new Date().toISOString(),
        user_role: user.role,
        request_type: 'domestic_arts_reflection',
        creditsEarned: creditsAwarded,
      },
    };

    // Run reflection coach asynchronously (fire and forget)
    adelineBrainRunnable.invoke(reflectionState).catch(error => {
      console.error('Reflection coach error:', error);
    });

    return NextResponse.json({
      success: true,
      creditsAwarded,
      analysis: analysisText,
      message: `Photo analyzed and ${creditsAwarded} credits awarded!`
    });

  } catch (error) {
    console.error('Photo upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

