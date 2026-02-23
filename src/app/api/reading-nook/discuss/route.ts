import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Get the last assistant message to extract book info
    const welcomeMessage = messages.find((m: any) => m.role === 'assistant');
    let bookTitle = 'Unknown Book';
    let bookAuthor = 'Unknown Author';
    
    if (welcomeMessage && welcomeMessage.content) {
      // Handle both string and array content formats
      const content = typeof welcomeMessage.content === 'string' 
        ? welcomeMessage.content 
        : welcomeMessage.content.map((c: any) => c.text || '').join('');
      
      const match = content.match(/Welcome to the discussion circle for \*(.*?)\* by (.*?)\./);
      if (match) {
        bookTitle = match[1];
        bookAuthor = match[2];
      }
    }

    // Build the system prompt with Socratic approach
    const systemPrompt = `You are facilitating a casual book club discussion on "${bookTitle}" by ${bookAuthor}. 

Your role is to guide the student using Socratic questioning. Do NOT just summarize the book or give plot details. Instead:
- Ask thought-provoking questions that make the student think critically
- Help them connect the book to their own experiences
- Encourage them to analyze characters' motivations and themes
- Be warm, encouraging, and conversational
- Keep responses relatively short (2-3 sentences max)
- Always end with a question to keep the discussion going

Respond as the book club facilitator, not as an AI assistant.`;

    const result = await streamText({
      model: openai('gpt-4'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.filter((m: any) => m.role !== 'system')
      ],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Discussion API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
