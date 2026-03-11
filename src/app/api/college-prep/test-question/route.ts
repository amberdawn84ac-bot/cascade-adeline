import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';

const TestPrepRequestSchema = z.object({
  subject: z.enum(['Math', 'English', 'Science']),
});

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subject } = TestPrepRequestSchema.parse(body);

    // Create initial state for LangGraph
    const initialState = {
      messages: [new HumanMessage(`Generate a college entrance exam practice question for ${subject}. Include 4 multiple choice options, the correct answer index, and a detailed explanation.`)],
      userId: user.userId,
      intent: 'CHAT' as const,
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: {
        timestamp: new Date().toISOString(),
        user_role: user.role,
        request_type: 'test_question',
        subject,
      },
    };

    // Run the LangGraph
    const result = await adelineBrainRunnable.invoke(initialState);

    // Parse the response to extract question data
    const responseContent = result.response_content;
    
    // Try to extract structured data from the response
    let questionData;
    try {
      // Look for JSON-like structure in the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a basic structure from the text
        questionData = {
          question: responseContent.split('\n')[0] || "Generated question",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: 0,
          explanation: responseContent,
        };
      }
    } catch (error) {
      // If parsing fails, return a basic structure
      questionData = {
        question: responseContent || "Generated question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
        explanation: responseContent,
      };
    }

    // Return the question data
    return NextResponse.json({ question: questionData });

  } catch (error) {
    console.error('Test prep API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

