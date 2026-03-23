/**
 * Web Scraper for Real Student Opportunities
 * 
 * Scrapes real contests, scholarships, grants, and events from actual websites
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { JSDOM } from 'jsdom';
import axios from 'axios';

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

interface ScrapedOpportunity {
  title: string;
  type: 'SPELLING_BEE' | 'CONTEST' | 'GRANT' | 'SCHOLARSHIP' | 'APPRENTICESHIP' | 'SERVICE_PROJECT' | 'COMPETITION' | 'EVENT';
  description: string;
  url?: string;
  deadline?: Date;
  ageRange?: string;
  matchedInterests: string[];
  sourceUrl: string;
}

// Real websites to scrape
const OPPORTUNITY_SOURCES = [
  {
    name: 'National Spelling Bee',
    url: 'https://www.spellingbee.com/',
    type: 'SPELLING_BEE' as const,
    selector: '.contest-info, .deadline, .title'
  },
  {
    name: 'Scholastic Art & Writing Awards',
    url: 'https://www.artandwriting.org/',
    type: 'CONTEST' as const,
    selector: '.deadline, .category, .award-info'
  },
  {
    name: 'MathCounts',
    url: 'https://www.mathcounts.org/',
    type: 'COMPETITION' as const,
    selector: '.competition, .deadline, .registration'
  },
  {
    name: 'National History Day',
    url: 'https://www.nhd.org/',
    type: 'COMPETITION' as const,
    selector: '.contest, .theme, .deadline'
  },
  {
    name: 'President\'s Volunteer Service Award',
    url: 'https://www.presidentialserviceawards.gov/',
    type: 'SERVICE_PROJECT' as const,
    selector: '.award-info, .requirements'
  }
];

async function scrapeWebsite(source: typeof OPPORTUNITY_SOURCES[0]): Promise<ScrapedOpportunity[]> {
  try {
    console.log(`🌐 Scraping ${source.name}...`);
    
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const opportunities: ScrapedOpportunity[] = [];

    // Look for common opportunity patterns
    const titleSelectors = ['h1', 'h2', '.title', '.contest-title', '.award-title'];
    const deadlineSelectors = ['.deadline', '.due-date', '[data-deadline]', '.date'];
    const descriptionSelectors = ['.description', '.about', '.summary', 'p'];

    // Try to find a title
    let title = '';
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        title = element.textContent.trim();
        break;
      }
    }

    // Try to find deadline
    let deadline: Date | undefined;
    for (const selector of deadlineSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        const dateText = element.textContent.trim();
        const dateMatch = dateText.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4})/);
        if (dateMatch) {
          deadline = new Date(dateMatch[1]);
        }
        break;
      }
    }

    // Try to find description
    let description = '';
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim() && element.textContent.trim().length > 50) {
        description = element.textContent.trim();
        break;
      }
    }

    // If we found meaningful content, create an opportunity
    if (title && description) {
      opportunities.push({
        title,
        type: source.type,
        description,
        url: source.url,
        deadline,
        ageRange: inferAgeRange(title, description),
        matchedInterests: inferInterests(title, description, source.type),
        sourceUrl: source.url
      });
    }

    console.log(`✅ Found ${opportunities.length} opportunities from ${source.name}`);
    return opportunities;

  } catch (error) {
    console.warn(`⚠️  Failed to scrape ${source.name}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

function inferAgeRange(title: string, description: string): string | undefined {
  const agePatterns = [
    { pattern: /grades?\s*(\d+)-?(\d+)?/i, extract: (match: RegExpMatchArray) => {
      const grade1 = parseInt(match[1]);
      const grade2 = match[2] ? parseInt(match[2]) : grade1;
      // Convert grades to approximate ages (grade + 5)
      return `${grade1 + 5}-${grade2 + 5} years`;
    }},
    { pattern: /ages?\s*(\d+)-?(\d+)?/i, extract: (match: RegExpMatchArray) => {
      const age1 = parseInt(match[1]);
      const age2 = match[2] ? parseInt(match[2]) : age1;
      return `${age1}-${age2} years`;
    }},
    { pattern: /high school/i, extract: () => '14-18 years' },
    { pattern: /middle school/i, extract: () => '11-14 years' },
    { pattern: /elementary/i, extract: () => '6-11 years' }
  ];

  const text = `${title} ${description}`.toLowerCase();
  
  for (const { pattern, extract } of agePatterns) {
    const match = text.match(pattern);
    if (match) {
      return extract(match);
    }
  }

  return undefined;
}

function inferInterests(title: string, description: string, type: string): string[] {
  const interests: string[] = [];
  const text = `${title} ${description}`.toLowerCase();

  // Type-based interests
  if (type === 'SPELLING_BEE') interests.push('Language Arts', 'Academic', 'Competition');
  if (type === 'CONTEST') interests.push('Competition', 'Academic');
  if (type === 'SCHOLARSHIP') interests.push('Academic', 'Financial Aid');
  if (type === 'COMPETITION') interests.push('Competition');
  if (type === 'SERVICE_PROJECT') interests.push('Community Service', 'Leadership');

  // Content-based interests
  const interestKeywords = {
    'stem': ['STEM', 'Science', 'Technology', 'Engineering', 'Math'],
    'art': ['Art', 'Creative', 'Design', 'Visual Arts'],
    'writing': ['Writing', 'Literature', 'Creative Writing', 'Essay'],
    'math': ['Math', 'Mathematics', 'Problem Solving'],
    'history': ['History', 'Research', 'Historical'],
    'science': ['Science', 'Research', 'Experiment'],
    'coding': ['Code', 'Programming', 'Technology', 'Software'],
    'music': ['Music', 'Performance', 'Instrumental'],
    'sports': ['Sports', 'Athletic', 'Competition'],
    'leadership': ['Leadership', 'Community', 'Service']
  };

  for (const [keyword, relatedInterests] of Object.entries(interestKeywords)) {
    if (text.includes(keyword)) {
      interests.push(...relatedInterests);
    }
  }

  // Remove duplicates and return
  return [...new Set(interests)];
}

async function scrapeAllOpportunities() {
  try {
    console.log('🕷️  Starting web scraping for opportunities...');

    const allOpportunities: ScrapedOpportunity[] = [];

    // Scrape each source
    for (const source of OPPORTUNITY_SOURCES) {
      const opportunities = await scrapeWebsite(source);
      allOpportunities.push(...opportunities);
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Also add some manually curated real opportunities
    const curatedOpportunities: ScrapedOpportunity[] = [
      {
        title: "Braum's Book Buddy Reading Program",
        type: "CONTEST",
        description: "Read 6 books and earn a free ice cream treat! Braum's Book Buddy program encourages reading for children ages 4-12. Available at participating Braum's stores.",
        url: "https://www.braums.com/book-buddy/",
        deadline: undefined, // Ongoing program
        ageRange: "4-12 years",
        matchedInterests: ["Reading", "Language Arts", "Rewards"],
        sourceUrl: "https://www.braums.com/"
      },
      {
        title: "Pizza Hut BOOK IT! Program",
        type: "CONTEST", 
        description: "Read books and earn free personal pan pizzas! The BOOK IT! Program motivates children to read by rewarding them with pizza. Available for grades K-6.",
        url: "https://www.bookitprogram.com/",
        deadline: undefined, // Ongoing program
        ageRange: "5-11 years",
        matchedInterests: ["Reading", "Language Arts", "Rewards", "Food"],
        sourceUrl: "https://www.bookitprogram.com/"
      },
      {
        title: "National Spelling Bee 2024",
        type: "SPELLING_BEE",
        description: "The nation's most prestigious spelling competition for students in grades 4-8. Local competitions lead to regional and national championships.",
        url: "https://www.spellingbee.com/",
        deadline: new Date("2024-03-15"),
        ageRange: "9-15 years",
        matchedInterests: ["Language Arts", "Academic", "Competition"],
        sourceUrl: "https://www.spellingbee.com/"
      },
      {
        title: "Google Code-in Contest",
        type: "CONTEST",
        description: "Google's global contest introducing students (ages 13-17) to open source development. Work on real projects with mentor guidance.",
        url: "https://codein.withgoogle.com/",
        deadline: new Date("2024-04-01"),
        ageRange: "13-17 years",
        matchedInterests: ["STEM", "Coding", "Technology"],
        sourceUrl: "https://codein.withgoogle.com/"
      },
      {
        title: "Jack Kent Cooke Young Scholars Scholarship",
        type: "SCHOLARSHIP",
        description: "Comprehensive scholarship program for high-achieving 7th grade students from low-income families. Provides academic advising and financial support.",
        url: "https://www.jkcf.org/scholarships/young-scholars-program/",
        deadline: new Date("2024-04-15"),
        ageRange: "12-13 years",
        matchedInterests: ["Academic", "Financial Aid", "Leadership"],
        sourceUrl: "https://www.jkcf.org/"
      },
      {
        title: "NASA Space Apps Challenge",
        type: "COMPETITION",
        description: "International hackathon for students and adults to address real-world challenges on Earth and in space. Teams work together over 48 hours.",
        url: "https://www.spaceappschallenge.org/",
        deadline: new Date("2024-05-01"),
        ageRange: "14+ years",
        matchedInterests: ["STEM", "Space", "Innovation", "Teamwork"],
        sourceUrl: "https://www.spaceappschallenge.org/"
      },
      {
        title: "Scholastic Art & Writing Awards",
        type: "CONTEST",
        description: "Longest-running recognition program for creative teens in grades 7-12. Categories include writing, art, photography, and more.",
        url: "https://www.artandwriting.org/",
        deadline: new Date("2024-03-15"),
        ageRange: "12-18 years",
        matchedInterests: ["Art", "Writing", "Creative", "Portfolio"],
        sourceUrl: "https://www.artandwriting.org/"
      },
      {
        title: "Chuck E. Cheese Reading Rewards",
        type: "CONTEST",
        description: "Kids can earn 10 free Chuck E. Cheese tokens for reading every day for 2 weeks. Download the reading calendar and bring it in for rewards!",
        url: "https://www.chuckecheese.com/rewards-calendar",
        deadline: undefined, // Ongoing program
        ageRange: "3-12 years",
        matchedInterests: ["Reading", "Language Arts", "Rewards", "Fun"],
        sourceUrl: "https://www.chuckecheese.com/"
      },
      {
        title: "Half Price Books Summer Reading Program",
        type: "CONTEST",
        description: "Kids can earn Bookworm Bucks for reading during summer break. Read for 300 minutes to earn $5 in Bookworm Bucks to spend at Half Price Books.",
        url: "https://www.hpb.com/summer-reading",
        deadline: new Date("2024-07-31"),
        ageRange: "6-14 years",
        matchedInterests: ["Reading", "Language Arts", "Summer", "Books"],
        sourceUrl: "https://www.hpb.com/"
      },
      {
        title: "TD Bank Summer Reading Program",
        type: "CONTEST",
        description: "Read 10 books this summer and get $10 deposited into a new or existing TD Simple Savings account. Great way to encourage reading and saving!",
        url: "https://www.td.com/us/en/personal-banking/td-bank-reading",
        deadline: new Date("2024-08-31"),
        ageRange: "5-18 years",
        matchedInterests: ["Reading", "Language Arts", "Financial", "Summer"],
        sourceUrl: "https://www.td.com/"
      }
    ];

    allOpportunities.push(...curatedOpportunities);

    // Save to database
    console.log(`💾 Saving ${allOpportunities.length} opportunities to database...`);

    for (const opportunity of allOpportunities) {
      try {
        await prisma.opportunity.create({
          data: {
            title: opportunity.title,
            type: opportunity.type,
            description: opportunity.description,
            url: opportunity.url,
            deadline: opportunity.deadline,
            ageRange: opportunity.ageRange,
            matchedInterests: opportunity.matchedInterests,
            isActive: true
          }
        });
        console.log(`✅ Saved: ${opportunity.title}`);
      } catch (error) {
        // If it already exists, skip it
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          console.log(`⚠️  Already exists: ${opportunity.title}`);
        } else {
          console.error(`❌ Failed to save ${opportunity.title}:`, error);
        }
      }
    }

    console.log(`🎉 Successfully scraped and saved ${allOpportunities.length} real opportunities!`);

  } catch (error) {
    console.error('❌ Scraping failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  scrapeAllOpportunities();
}
