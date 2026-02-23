import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';

const BookCurationRequestSchema = z.object({
  readingLevel: z.enum(['Early Reader', 'Middle Grade', 'Young Adult', 'Classic Literature']),
  interestInput: z.string().min(5, "Interest input must be at least 5 characters"),
});

const BookRecommendationSchema = z.object({
  title: z.string(),
  author: z.string(),
  description: z.string(),
  themes: z.array(z.string()),
  discussionQuestions: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { readingLevel, interestInput } = BookCurationRequestSchema.parse(body);

    // Safety checks
    const maskedContent = maskPII(interestInput);
    const moderationResult = await moderateContent(maskedContent.masked);
    
    if (moderationResult.severity === 'blocked') {
      return NextResponse.json({ error: 'Content violates safety guidelines' }, { status: 400 });
    }

    // Create initial state for LangGraph
    const initialState = {
      messages: [new HumanMessage(`I'm looking for book recommendations at the ${readingLevel} level. Here are my interests: "${maskedContent.masked}". Please suggest 3-5 books that would be a good fit. For each book, provide: title, author, description, themes, and 3 discussion questions for a book club discussion. Return the results in a structured JSON format.`)],
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
        request_type: 'book_curation',
        readingLevel,
      },
    };

    // Run the LangGraph
    console.log('Starting LangGraph invocation for book curation...');
    const result = await adelineBrainRunnable.invoke(initialState);
    console.log('LangGraph completed successfully');

    // Parse the response to extract book recommendations
    const responseContent = result.response_content;
    
    // Try to extract structured data from the response
    let books;
    try {
      // Look for JSON array structure in the response
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        books = JSON.parse(jsonMatch[0]);
        // Ensure all books have required fields
        books = books.map((book: any) => ({
          title: book.title || "Untitled Book",
          author: book.author || "Unknown Author",
          description: book.description || "A fascinating book worth exploring.",
          themes: Array.isArray(book.themes) ? book.themes : ["Literature", "Adventure"],
          discussionQuestions: Array.isArray(book.discussionQuestions) 
            ? book.discussionQuestions 
            : [
                "What did you find most interesting about this book?",
                "How would you describe the main character's journey?",
                "What themes or messages stood out to you?"
              ]
        }));
      } else {
        // Fallback: parse line by line for book information
        const lines = responseContent.split('\n').filter(line => line.trim());
        books = lines.slice(0, 5).map((line, index) => ({
          title: `Book Recommendation ${index + 1}`,
          author: "Various Authors",
          description: line.substring(0, 200) + "...",
          themes: ["General", "Literature"],
          discussionQuestions: [
            "What did you find most interesting about this book?",
            "How would you describe the main character's journey?",
            "What themes or messages stood out to you?"
          ]
        }));
      }
    } catch (error) {
      console.error('Error parsing book recommendations:', error);
      // If parsing fails, return fallback recommendations
      books = [
        {
          title: "The Magic Tree House",
          author: "Mary Pope Osborne",
          description: "Join Jack and Annie on their magical adventures through time in this beloved early chapter book series.",
          themes: ["Adventure", "History", "Magic", "Friendship"],
          discussionQuestions: [
            "If you could travel to any time period, where would you go and why?",
            "How do Jack and Annie work together as a team?",
            "What would you pack in your magic tree house adventure bag?"
          ]
        }
      ];
    }

    // Validate the response
    const validatedBooks = books.map((book: any) => BookRecommendationSchema.parse(book));

    return NextResponse.json({ books: validatedBooks });
  } catch (error) {
    console.error('Book curation API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
