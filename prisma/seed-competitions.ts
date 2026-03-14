import prisma from '../src/lib/db';

/**
 * ⚠️ DEPRECATED: Static Competition Seeding
 * 
 * This file is deprecated in favor of the dynamic competition discovery system.
 * 
 * NEW SYSTEM: Competitions are now dynamically discovered via AI web search at:
 * - API: /api/competitions/discover
 * - Automatically triggered when opportunity matching finds no recent competitions
 * - Filters by student age, grade, and interests in real-time
 * - Caches results for 7 days to avoid excessive API calls
 * 
 * This seed file is kept for backward compatibility and initial database setup only.
 * The dynamic system will replace these static entries as students use the platform.
 * 
 * To manually trigger competition discovery for a student:
 * POST /api/competitions/discover
 * Body: { studentAge: 15, studentGrade: "9", interests: ["science", "robotics"] }
 */

const competitions = [
  {
    name: 'Regeneron International Science and Engineering Fair (ISEF)',
    organization: 'Society for Science',
    type: 'SCIENCE_FAIR' as const,
    description: 'The world\'s largest pre-college STEM competition. Students present original research projects to earn prizes and scholarships.',
    deadline: new Date('2026-05-10'),
    eligibilityRules: {
      grades: ['9', '10', '11', '12'],
      ageMin: 13,
      ageMax: 20,
      researchDurationMonths: 12,
      requiresSchoolFairWin: true,
      notes: 'Must win a regional/affiliated fair first. Research must be conducted over at least 12 months. Students must follow the ISEF Ethics Statement — AI tools cannot be used to write research papers or generate data.',
      prohibitions: ['AI-generated research', 'AI-written reports', 'purchased data'],
    },
    themes: ['biology', 'chemistry', 'physics', 'environmental science', 'engineering', 'computer science', 'medicine', 'earth science', 'energy', 'materials science'],
    ageRange: '13-20',
    gradeRange: '9-12',
    url: 'https://www.societyforscience.org/isef/',
    year: 2026,
  },
  {
    name: 'Regeneron Science Talent Search (STS)',
    organization: 'Society for Science',
    type: 'RESEARCH_PAPER' as const,
    description: 'The nation\'s most prestigious pre-college science competition. High school seniors submit original research papers for a chance at $1.8M in prizes.',
    deadline: new Date('2026-02-04'),
    eligibilityRules: {
      grades: ['12'],
      ageMin: 16,
      ageMax: 19,
      requiresSeniorYear: true,
      notes: 'Open to high school seniors only. Must submit original independent research. AI cannot be used to write or generate the research paper.',
      prohibitions: ['AI-written papers', 'plagiarism', 'duplicate submission'],
    },
    themes: ['life sciences', 'physical sciences', 'mathematics', 'computer science', 'behavioral science', 'engineering', 'environmental science'],
    ageRange: '17-18',
    gradeRange: '12',
    url: 'https://www.societyforscience.org/regeneron-sts/',
    year: 2026,
  },
  {
    name: 'National STEM Festival Student Showcase',
    organization: 'National STEM Festival',
    type: 'STEM_CHALLENGE' as const,
    description: 'Annual showcase celebrating student STEM projects. The 2026 theme is "Future Food" — sustainable agriculture, food science, and nutrition.',
    deadline: new Date('2026-11-12'),
    eligibilityRules: {
      grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      ageMin: 5,
      ageMax: 18,
      notes: 'Open to all K-12 students. Projects should relate to the annual theme: Future Food (2026).',
      prohibitions: [],
    },
    themes: ['future food', 'sustainable agriculture', 'food science', 'nutrition', 'vertical farming', 'food waste', 'urban farming', 'soil health', 'water conservation'],
    ageRange: '5-18',
    gradeRange: 'K-12',
    url: 'https://www.nationalstemfestival.com/',
    year: 2026,
  },
  {
    name: 'Google Science Fair',
    organization: 'Google',
    type: 'SCIENCE_FAIR' as const,
    description: 'Global online science and technology competition for students ages 13-18. Students submit projects and compete for scholarships and prizes.',
    deadline: new Date('2026-04-30'),
    eligibilityRules: {
      grades: ['7', '8', '9', '10', '11', '12'],
      ageMin: 13,
      ageMax: 18,
      notes: 'Open globally to individuals or teams of up to 3. Projects submitted online. Strong focus on original research with real-world impact.',
      prohibitions: ['AI-generated research data'],
    },
    themes: ['technology', 'environment', 'health', 'engineering', 'social impact', 'machine learning', 'sustainability', 'clean energy', 'ocean science'],
    ageRange: '13-18',
    gradeRange: '7-12',
    url: 'https://sciencefair.withgoogle.com/',
    year: 2026,
  },
  {
    name: 'Broadcom MASTERS',
    organization: 'Society for Science',
    type: 'SCIENCE_FAIR' as const,
    description: 'Top middle school science fair students compete in team STEM challenges and present their original research to expert judges.',
    deadline: new Date('2026-06-01'),
    eligibilityRules: {
      grades: ['6', '7', '8'],
      ageMin: 10,
      ageMax: 14,
      requiresSchoolFairWin: true,
      notes: 'Must place in top 10% at an affiliated middle school science fair. Invitation only after qualifying.',
      prohibitions: [],
    },
    themes: ['biology', 'chemistry', 'physics', 'engineering', 'environmental science', 'computer science', 'earth science'],
    ageRange: '10-14',
    gradeRange: '6-8',
    url: 'https://www.societyforscience.org/broadcom-masters/',
    year: 2026,
  },
  {
    name: 'Junior Science and Humanities Symposia (JSHS)',
    organization: 'US Army, Navy, Air Force',
    type: 'RESEARCH_PAPER' as const,
    description: 'Students present original research in a symposia format to science professionals. Winners advance to national competition with scholarship awards.',
    deadline: new Date('2026-02-28'),
    eligibilityRules: {
      grades: ['9', '10', '11', '12'],
      ageMin: 14,
      ageMax: 19,
      notes: 'Students must conduct original research and prepare a written paper and oral presentation. Sponsored by the US Armed Forces.',
      prohibitions: ['AI-written papers'],
    },
    themes: ['STEM research', 'biology', 'chemistry', 'physics', 'engineering', 'computer science', 'mathematics', 'environmental science', 'behavioral science'],
    ageRange: '14-19',
    gradeRange: '9-12',
    url: 'https://www.jshs.us/',
    year: 2026,
  },
  {
    name: 'Conrad Challenge',
    organization: 'Conrad Foundation',
    type: 'INNOVATION' as const,
    description: 'Multi-phase innovation and entrepreneurship competition. Teams develop sustainable solutions to real-world problems using science, technology, and business.',
    deadline: new Date('2026-03-15'),
    eligibilityRules: {
      grades: ['9', '10', '11', '12'],
      ageMin: 13,
      ageMax: 18,
      teamSize: { min: 2, max: 5 },
      notes: 'Teams of 2-5 students. Must develop a viable product or service. Judged on innovation, sustainability, and business viability.',
      prohibitions: [],
    },
    themes: ['aerospace', 'energy', 'health', 'cyber-technology', 'social entrepreneurship', 'sustainability', 'innovation', 'clean technology'],
    ageRange: '13-18',
    gradeRange: '9-12',
    url: 'https://conradchallenge.org/',
    year: 2026,
  },
  {
    name: 'Lexus Eco Challenge',
    organization: 'Lexus & National Wildlife Federation',
    type: 'ENVIRONMENTAL' as const,
    description: 'Students research an environmental issue, design a solution, and implement it in their community. One of the largest environmental STEM competitions for high schoolers.',
    deadline: new Date('2026-01-15'),
    eligibilityRules: {
      grades: ['9', '10', '11', '12'],
      ageMin: 14,
      ageMax: 19,
      teamSize: { min: 3, max: 6 },
      notes: 'Teams of 3-6 students. Must complete all 3 phases: research, design, and community action. Project must address a local environmental issue.',
      prohibitions: [],
    },
    themes: ['water quality', 'air quality', 'biodiversity', 'soil health', 'climate change', 'sustainable agriculture', 'wildlife habitat', 'pollution', 'renewable energy', 'environmental justice'],
    ageRange: '14-19',
    gradeRange: '9-12',
    url: 'https://www.lexusecochallenges.com/',
    year: 2026,
  },
];

async function seedCompetitions() {
  console.log('🏆 Seeding competition database...');

  for (const comp of competitions) {
    const existing = await prisma.competition.findFirst({ where: { name: comp.name } });
    if (existing) {
      await prisma.competition.update({
        where: { id: existing.id },
        data: {
          description: comp.description,
          deadline: comp.deadline,
          eligibilityRules: comp.eligibilityRules as any,
          themes: comp.themes,
          isActive: true,
        },
      });
      console.log(`  ↺ Updated: ${comp.name}`);
    } else {
      await prisma.competition.create({ data: { ...comp, eligibilityRules: comp.eligibilityRules as any } });
      console.log(`  ✓ Created: ${comp.name}`);
    }
  }

  console.log(`\n✅ Seeded ${competitions.length} competitions.`);
}

seedCompetitions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
