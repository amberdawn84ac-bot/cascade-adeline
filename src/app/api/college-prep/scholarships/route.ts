import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ScholarshipRequestSchema = z.object({
  profileInput: z.string().min(10, "Profile input must be at least 10 characters"),
});

const ScholarshipResponseSchema = z.object({
  scholarships: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    requirements: z.string(),
    category: z.string(),
    deadline: z.string(),
  }))
});

// Sample scholarships database
const scholarshipDatabase = [
  {
    name: "National Merit Scholarship",
    amount: "$2,500",
    requirements: "Top 1% on PSAT/NMSQT, strong academic record, leadership experience",
    category: "Academic Merit",
    deadline: "December 1"
  },
  {
    name: "Gates Millennium Scholars",
    amount: "Full Ride",
    requirements: "Minority student, 3.3+ GPA, leadership, community service, Pell Grant eligible",
    category: "Need-Based",
    deadline: "September 15"
  },
  {
    name: "Coca-Cola Scholars Program",
    amount: "$20,000",
    requirements: "3.0+ GPA, leadership, community service, US citizen or permanent resident",
    category: "Leadership",
    deadline: "October 31"
  },
  {
    name: "STEM Scholars Award",
    amount: "$10,000",
    requirements: "Pursuing STEM degree, 3.5+ GPA in math/science, research experience preferred",
    category: "STEM",
    deadline: "March 1"
  },
  {
    name: "First Generation Scholarship",
    amount: "$5,000",
    requirements: "Neither parent has 4-year degree, 2.5+ GPA, personal essay required",
    category: "First Generation",
    deadline: "April 15"
  },
  {
    name: "Community Service Scholarship",
    amount: "$3,000",
    requirements: "100+ volunteer hours, essay on service experience, 2.7+ GPA",
    category: "Community Service",
    deadline: "February 28"
  },
  {
    name: "Women in Tech Scholarship",
    amount: "$8,000",
    requirements: "Female student pursuing computer science or related field, 3.2+ GPA",
    category: "Women in Tech",
    deadline: "January 20"
  },
  {
    name: "Arts Excellence Award",
    amount: "$4,000",
    requirements: "Portfolio submission, 3.0+ GPA, planning to major in visual or performing arts",
    category: "Arts",
    deadline: "December 15"
  }
];

function filterScholarships(profileInput: string) {
  const input = profileInput.toLowerCase();
  const matchedScholarships: any[] = [];

  // Simple keyword matching logic
  scholarshipDatabase.forEach(scholarship => {
    let score = 0;
    
    // Check for matching keywords
    if (input.includes('stem') || input.includes('science') || input.includes('math') || input.includes('engineering')) {
      if (scholarship.category === 'STEM') score += 3;
    }
    
    if (input.includes('first generation') || input.includes('first-gen')) {
      if (scholarship.category === 'First Generation') score += 3;
    }
    
    if (input.includes('woman') || input.includes('female') || input.includes('girl')) {
      if (scholarship.category === 'Women in Tech') score += 3;
    }
    
    if (input.includes('art') || input.includes('music') || input.includes('dance') || input.includes('theater')) {
      if (scholarship.category === 'Arts') score += 3;
    }
    
    if (input.includes('volunteer') || input.includes('community') || input.includes('service')) {
      if (scholarship.category === 'Community Service') score += 3;
    }
    
    if (input.includes('leader') || input.includes('leadership') || input.includes('president') || input.includes('captain')) {
      if (scholarship.category === 'Leadership') score += 3;
    }
    
    if (input.includes('minority') || input.includes('black') || input.includes('hispanic') || input.includes('native')) {
      if (scholarship.category === 'Need-Based') score += 2;
    }
    
    // Always include some general scholarships
    if (scholarship.category === 'Academic Merit' && (input.includes('good grades') || input.includes('honor') || input.includes('top'))) {
      score += 2;
    }
    
    // Add scholarships with at least some relevance
    if (score >= 2 || scholarship.category === 'Academic Merit') {
      matchedScholarships.push({ ...scholarship, relevanceScore: score });
    }
  });

  // Sort by relevance score and return top 6
  return matchedScholarships
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6)
    .map(({ relevanceScore, ...scholarship }) => scholarship);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileInput } = ScholarshipRequestSchema.parse(body);

    // Filter and return relevant scholarships
    const scholarships = filterScholarships(profileInput);

    const response = ScholarshipResponseSchema.parse({ scholarships });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scholarship API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
