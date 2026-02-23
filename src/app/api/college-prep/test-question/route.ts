import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TestPrepRequestSchema = z.object({
  subject: z.enum(['Math', 'English', 'Science']),
});

const TestPrepResponseSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

// Sample test questions database
const testQuestions = {
  Math: [
    {
      question: "If f(x) = 3x + 2, what is f(5)?",
      options: ["15", "17", "13", "20"],
      correctIndex: 1,
      explanation: "Substitute x = 5 into the function: f(5) = 3(5) + 2 = 15 + 2 = 17"
    },
    {
      question: "What is the slope of the line passing through points (2, 3) and (4, 7)?",
      options: ["1", "2", "3", "4"],
      correctIndex: 1,
      explanation: "Slope = (7-3)/(4-2) = 4/2 = 2"
    },
    {
      question: "Solve for x: 2x + 8 = 20",
      options: ["4", "6", "8", "10"],
      correctIndex: 1,
      explanation: "2x = 20 - 8 = 12, so x = 12/2 = 6"
    }
  ],
  English: [
    {
      question: "Which of the following is a compound sentence?",
      options: [
        "The sun is shining brightly today.",
        "She went to the store, but she forgot her wallet.",
        "Because it was raining, we stayed inside.",
        "Running quickly, she caught the bus."
      ],
      correctIndex: 1,
      explanation: "A compound sentence contains two independent clauses joined by a conjunction. 'She went to the store, but she forgot her wallet' has two independent clauses joined by 'but'."
    },
    {
      question: "What is the theme of this passage: 'The early bird catches the worm, but the second mouse gets the cheese.'?",
      options: ["Always be first", "Patience has its rewards", "Competition is fierce", "Early success is best"],
      correctIndex: 1,
      explanation: "The passage suggests that while being first has advantages, there are also benefits to waiting or being second, implying that patience and timing can be rewarding."
    }
  ],
  Science: [
    {
      question: "What is the chemical formula for water?",
      options: ["H2O", "CO2", "O2", "NaCl"],
      correctIndex: 0,
      explanation: "Water is composed of two hydrogen atoms and one oxygen atom, giving the formula H2O."
    },
    {
      question: "Which process do plants use to convert sunlight into energy?",
      options: ["Respiration", "Photosynthesis", "Transpiration", "Germination"],
      correctIndex: 1,
      explanation: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen."
    },
    {
      question: "What is the force that opposes motion between two surfaces in contact?",
      options: ["Gravity", "Magnetism", "Friction", "Inertia"],
      correctIndex: 2,
      explanation: "Friction is the force that opposes relative motion between surfaces in contact."
    }
  ]
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject } = TestPrepRequestSchema.parse(body);

    // Get a random question for the subject
    const questions = testQuestions[subject];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    // Validate the response
    const validatedResponse = TestPrepResponseSchema.parse(randomQuestion);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Test prep API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
