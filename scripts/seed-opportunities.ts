/**
 * Seed Sample Opportunities
 * 
 * Creates sample real-world opportunities for testing the Community Board
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createClient(): PrismaClient {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pgPool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const prisma = createClient();

const sampleOpportunities = [
  {
    title: "National Spelling Bee 2024",
    type: "SPELLING_BEE" as const,
    description: "The nation's most prestigious spelling competition for students in grades 4-8. Winners advance to the national championship in Washington, D.C.",
    url: "https://www.spellingbee.com/",
    deadline: new Date("2024-03-15"),
    ageRange: "9-15 years",
    matchedInterests: ["Language Arts", "Academic", "Competition"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "Google Code-in Contest",
    type: "CONTEST" as const,
    description: "A global, online contest introducing students (ages 13-17) to open source development. Work on real projects with mentor guidance.",
    url: "https://codein.withgoogle.com/",
    deadline: new Date("2024-04-01"),
    ageRange: "13-17 years",
    matchedInterests: ["STEM", "Coding", "Technology"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "Jack Kent Cooke Young Scholars Scholarship",
    type: "SCHOLARSHIP" as const,
    description: "Comprehensive scholarship program for high-achieving 7th grade students from low-income families. Provides academic advising, summer programs, and financial support.",
    url: "https://www.jkcf.org/scholarships/young-scholars-program/",
    deadline: new Date("2024-04-15"),
    ageRange: "12-13 years",
    matchedInterests: ["Academic", "Financial Aid", "Leadership"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "NASA Space Apps Challenge",
    type: "COMPETITION" as const,
    description: "International hackathon for students and adults to address real-world challenges on Earth and in space. Teams work together over 48 hours.",
    url: "https://www.spaceappschallenge.org/",
    deadline: new Date("2024-05-01"),
    ageRange: "14+ years",
    matchedInterests: ["STEM", "Space", "Innovation", "Teamwork"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "Youth Service America Grant",
    type: "GRANT" as const,
    description: "Grants of up to $1,000 for youth-led service projects. Students aged 12-25 can apply for funding to create community impact projects.",
    url: "https://ysa.org/grants/",
    deadline: new Date("2024-06-01"),
    ageRange: "12-25 years",
    matchedInterests: ["Community Service", "Leadership", "Social Impact"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "Smithsonian Teen Apprenticeship Program",
    type: "APPRENTICESHIP" as const,
    description: "Hands-on learning experiences at Smithsonian museums. Students work alongside museum professionals in various departments.",
    url: "https://smithsonianinstitution.com/apprenticeships",
    deadline: new Date("2024-03-30"),
    ageRange: "15-18 years",
    matchedInterests: ["History", "Museums", "Cultural", "Research"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "National History Day Competition",
    type: "CONTEST" as const,
    description: "Academic competition focused on historical research for students in grades 6-12. Students create documentaries, exhibits, papers, performances, or websites.",
    url: "https://www.nhd.org/",
    deadline: new Date("2024-02-28"),
    ageRange: "11-18 years",
    matchedInterests: ["History", "Research", "Academic"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "President's Volunteer Service Award",
    type: "SERVICE_PROJECT" as const,
    description: "Recognizes students who volunteer significant hours serving their communities. Awards available for different age groups and service levels.",
    url: "https://www.presidentialserviceawards.gov/",
    deadline: null, // Ongoing
    ageRange: "5-25 years",
    matchedInterests: ["Community Service", "Volunteering", "Recognition"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "MathCounts Competition Series",
    type: "COMPETITION" as const,
    description: "National mathematics competition for middle school students. Progress from school to chapter, state, and national levels.",
    url: "https://www.mathcounts.org/",
    deadline: new Date("2024-03-01"),
    ageRange: "11-14 years",
    matchedInterests: ["Mathematics", "STEM", "Competition"],
    createdById: "00000000-0000-0000-0000-000000000001"
  },
  {
    title: "Scholastic Art & Writing Awards",
    type: "CONTEST" as const,
    description: "Longest-running, most prestigious recognition program for creative teens in grades 7-12. Categories include writing, art, photography, and more.",
    url: "https://www.artandwriting.org/",
    deadline: new Date("2024-03-15"),
    ageRange: "12-18 years",
    matchedInterests: ["Art", "Writing", "Creative", "Portfolio"],
    createdById: "00000000-0000-0000-0000-000000000001"
  }
];

async function seedOpportunities() {
  try {
    console.log('🌱 Seeding sample opportunities...');

    for (const opportunity of sampleOpportunities) {
      await prisma.opportunity.create({
        data: opportunity
      });
    }

    console.log('✅ Sample opportunities seeded successfully!');
    console.log('\nOpportunities created:');
    sampleOpportunities.forEach(opp => {
      console.log(`- ${opp.title} (${opp.type})`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedOpportunities();
}
