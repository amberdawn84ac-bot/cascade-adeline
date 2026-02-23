import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';

const GenerateRequestSchema = z.object({
  type: z.enum(['recipe', 'pattern']),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  interest: z.string().min(5, "Interest must be at least 5 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, skillLevel, interest } = GenerateRequestSchema.parse(body);

    // Safety checks
    const maskedContent = maskPII(interest);
    const moderationResult = await moderateContent(maskedContent.masked);
    
    if (moderationResult.severity === 'blocked') {
      return NextResponse.json({ error: 'Content violates safety guidelines' }, { status: 400 });
    }

    // Create initial state for LangGraph
    const initialState = {
      messages: [new HumanMessage(`Generate a ${type} for ${skillLevel} level. Here are my interests: "${maskedContent.masked}". Please provide structured output with: title, materials list, step-by-step instructions, and helpful tips. Return as JSON.`)],
      userId: user.userId,
      intent: 'BRAINSTORM' as const, // Use the project brainstormer agent
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: {
        timestamp: new Date().toISOString(),
        user_role: user.role,
        request_type: 'domestic_arts_generation',
        projectType: type,
        skillLevel,
      },
    };

    // Run the LangGraph
    const result = await adelineBrainRunnable.invoke(initialState);

    // Parse the response to extract project data
    const responseContent = result.response_content;
    
    // Try to extract structured data from the response
    let project;
    try {
      // Look for JSON structure in the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        project = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a basic structure from the text
        const lines = responseContent.split('\n').filter(line => line.trim());
        project = {
          id: `project_${Date.now()}`,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Project`,
          type,
          materials: lines.slice(0, 5).map(line => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
          instructions: lines.slice(5, 10).map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean),
          tips: lines.slice(10, 15).map(line => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
          createdAt: new Date(),
        };
      }
    } catch (error) {
      // If parsing fails, return a basic structure
      project = {
        id: `project_${Date.now()}`,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Project`,
        type,
        materials: ['Basic materials needed'],
        instructions: ['Step 1: Prepare your workspace', 'Step 2: Follow the instructions carefully'],
        tips: ['Take your time and enjoy the process'],
        createdAt: new Date(),
      };
    }

    // Ensure required fields
    if (!project.materials || project.materials.length === 0) {
      project.materials = ['Materials will be specified based on your project'];
    }
    if (!project.instructions || project.instructions.length === 0) {
      project.instructions = ['Detailed instructions will be provided'];
    }
    if (!project.tips || project.tips.length === 0) {
      project.tips = ['Helpful tips will be included'];
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Domestic arts generation API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
