import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

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

// Sample book database with different levels and themes
const bookDatabase = {
  'Early Reader': [
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
    },
    {
      title: "Charlotte's Web",
      author: "E.B. White",
      description: "A heartwarming tale of friendship between a pig named Wilbur and a spider named Charlotte.",
      themes: ["Friendship", "Animals", "Life and Death", "Loyalty"],
      discussionQuestions: [
        "Why does Charlotte help Wilbur even though it's hard for her?",
        "What makes someone a true friend?",
        "How does Wilbur change throughout the story?"
      ]
    }
  ],
  'Middle Grade': [
    {
      title: "Percy Jackson & The Lightning Thief",
      author: "Rick Riordan",
      description: "A modern-day demigod discovers his divine heritage and must prevent a war among the gods.",
      themes: ["Mythology", "Adventure", "Friendship", "Identity"],
      discussionQuestions: [
        "How does Percy feel about learning he's a demigod?",
        "What makes Percy different from other heroes?",
        "Would you want to be a demigod? Why or why not?"
      ]
    },
    {
      title: "Holes",
      author: "Louis Sachar",
      description: "A boy wrongly accused of theft is sent to a detention camp where he uncovers family secrets.",
      themes: ["Justice", "Friendship", "Family History", "Survival"],
      discussionQuestions: [
        "How does the past connect with the present in this story?",
        "What does Stanley learn about himself at Camp Green Lake?",
        "Is the ending fair? Why or why not?"
      ]
    }
  ],
  'Young Adult': [
    {
      title: "The Hunger Games",
      author: "Suzanne Collins",
      description: "In a dystopian future, a teenage girl must fight to survive in a televised death match.",
      themes: ["Survival", "Government Control", "Sacrifice", "Love"],
      discussionQuestions: [
        "How does Katniss feel about the Capitol and the Games?",
        "What would you do to survive in the arena?",
        "How does the story comment on our own society?"
      ]
    },
    {
      title: "The Fault in Our Stars",
      author: "John Green",
      description: "Two teenagers with cancer fall in love and confront life's biggest questions together.",
      themes: ["Love", "Mortality", "Meaning of Life", "Friendship"],
      discussionQuestions: [
        "How do Hazel and Augustus support each other?",
        "What does this book teach us about living with illness?",
        "What does 'infinity' mean to the characters?"
      ]
    }
  ],
  'Classic Literature': [
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      description: "A young girl's perspective on racial injustice and moral growth in the American South.",
      themes: ["Justice", "Racism", "Moral Growth", "Empathy"],
      discussionQuestions: [
        "Why does Atticus defend Tom Robinson?",
        "How does Scout's understanding of the world change?",
        "What does the mockingbird symbolize?"
      ]
    },
    {
      title: "1984",
      author: "George Orwell",
      description: "A dystopian novel about totalitarian control and the struggle for individual freedom.",
      themes: ["Freedom", "Government Control", "Truth", "Power"],
      discussionQuestions: [
        "How does the Party control people's thoughts?",
        "What does Winston learn about truth and reality?",
        "Could this happen in our society today?"
      ]
    }
  ]
};

function filterBooksByInterests(readingLevel: string, interestInput: string) {
  const input = interestInput.toLowerCase();
  const books = bookDatabase[readingLevel as keyof typeof bookDatabase] || [];
  
  // Simple keyword matching
  const scoredBooks = books.map(book => {
    let score = 0;
    const bookText = `${book.title} ${book.description} ${book.themes.join(' ')}`.toLowerCase();
    
    // Check for keyword matches
    if (input.includes('magic') && bookText.includes('magic')) score += 3;
    if (input.includes('adventure') && bookText.includes('adventure')) score += 3;
    if (input.includes('friend') && bookText.includes('friend')) score += 3;
    if (input.includes('history') && bookText.includes('history')) score += 3;
    if (input.includes('myth') && bookText.includes('myth')) score += 3;
    if (input.includes('dystopia') || input.includes('future') && bookText.includes('dystopia')) score += 3;
    if (input.includes('love') && bookText.includes('love')) score += 3;
    if (input.includes('justice') && bookText.includes('justice')) score += 3;
    if (input.includes('animal') && bookText.includes('animal')) score += 3;
    
    return { ...book, relevanceScore: score };
  });
  
  // Sort by relevance and return top 6
  return scoredBooks
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6)
    .map(({ relevanceScore, ...book }) => book);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readingLevel, interestInput } = BookCurationRequestSchema.parse(body);

    // Filter books based on interests
    const recommendedBooks = filterBooksByInterests(readingLevel, interestInput);

    // Validate the response
    const validatedBooks = recommendedBooks.map(book => BookRecommendationSchema.parse(book));

    return NextResponse.json({ books: validatedBooks });
  } catch (error) {
    console.error('Book curation API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
