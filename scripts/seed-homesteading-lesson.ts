/**
 * Seed Homesteading Lesson
 * 
 * Creates a sample homesteading lesson to test the lesson system.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { LessonBlock } from '../src/types/lesson';

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

const homesteadingLesson: LessonBlock[] = [
  {
    id: 'scripture-foundation',
    type: 'scripture',
    title: 'Biblical Foundation of Homesteading',
    content: 'The LORD God planted a garden in Eden, and there he put the man whom he had formed. And the LORD God took the man and put him in the Garden of Eden to work it and keep it.',
    interactive: {
      reference: 'Genesis 2:8, 15',
      translation: 'ESV',
      wordStudies: {
        'work': { hebrew: 'abad', meaning: 'to serve, work, cultivate' },
        'keep': { hebrew: 'shamar', meaning: 'to guard, watch over, preserve' }
      }
    },
    metadata: {
      estimatedTime: 5
    }
  },
  {
    id: 'homesteading-intro',
    type: 'text',
    title: 'What is Homesteading?',
    content: `Homesteading is the practice of living a self-sufficient lifestyle through growing your own food, preserving harvests, raising animals, and developing practical skills.

In our modern world of convenience, homesteading connects us to:
- God's original design for humanity to steward the earth
- The satisfaction of providing for ourselves and others
- Healthier food and a more sustainable way of life
- Practical wisdom passed down through generations

Whether you have a large farm or a small apartment balcony, homesteading is about mindset and skills, not just land size.`,
    metadata: {
      estimatedTime: 3
    }
  },
  {
    id: 'soil-health',
    type: 'primary_source',
    title: 'Understanding Your Soil',
    content: `Soil Composition Analysis:

Healthy garden soil should contain:
• 45% Minerals (sand, silt, clay)
• 25% Water
• 25% Air
• 5% Organic matter

The Magic of Organic Matter:
- Feeds beneficial microorganisms
- Improves water retention
- Provides slow-release nutrients
- Creates soil structure

Simple Soil Test:
1. Fill a jar 1/3 full with soil
2. Add water to 2/3 full
3. Shake vigorously for 3 minutes
4. Let settle for 24 hours
5. Read the layers: sand (bottom), silt (middle), clay (top)

Ideal ratio: 40% sand, 40% silt, 20% clay`,
    interactive: {
      narrativeRole: 'official_claim',
      investigationPrompts: [
        'What kind of soil do you have in your area?',
        'How could you improve your soil structure?',
        'Why is organic matter so important?'
      ]
    },
    metadata: {
      creator: 'Extension Service Guide',
      date: '2023',
      collection: 'Agricultural Extension',
      estimatedTime: 10
    }
  },
  {
    id: 'garden-planning',
    type: 'investigation',
    title: 'Plan Your Garden Space',
    content: 'Every homestead starts with a garden plan. Let\'s investigate what works for YOUR space.',
    interactive: {
      investigationType: 'space-planning',
      guidingQuestions: [
        'How much sunlight does your space get? (6+ hours = full sun, 4-6 = part sun, <4 = shade)',
        'What growing zone are you in? (Check USDA plant hardiness map)',
        'What vegetables does your family actually eat?',
        'How much time can you realistically spend gardening?',
        'What resources do you have available? (tools, soil, seeds)'
      ],
      whoBenefits: 'You benefit by creating a realistic garden plan that matches your actual conditions and lifestyle.'
    },
    metadata: {
      estimatedTime: 15
    }
  },
  {
    id: 'easy-start-crops',
    type: 'primary_source',
    title: 'Beginner-Friendly Crops',
    content: `Top 5 Easiest Vegetables for Beginners:

1. LETTUCE & GREENS
• Plant: Every 2 weeks for continuous harvest
• Harvest: 30-60 days from seed
• Space: 4-6 inches apart
• Tips: Cut outer leaves, plant will keep growing

2. RADISHES
• Plant: Early spring or fall
• Harvest: 20-30 days from seed
• Space: 2 inches apart
• Tips: Great for kids - fast results!

3. GREEN BEANS
• Plant: After last frost
• Harvest: 50-65 days from seed
• Space: 4 inches apart, 18 inches between rows
• Tips: Bush varieties need no support

4. ZUCCHINI
• Plant: After last frost
• Harvest: 40-50 days from seed
• Space: 3-4 feet apart (they get big!)
• Tips: Harvest when 6-8 inches for best flavor

5. TOMATOES
• Plant: After last frost
• Harvest: 60-80 days from transplant
• Space: 2-3 feet apart
• Tips: Start with small varieties like cherry tomatoes

Success Formula:
Start small + Choose easy crops + Consistent care = Garden success!`,
    interactive: {
      narrativeRole: 'official_claim',
      investigationPrompts: [
        'Which of these crops would work best for your space?',
        'How would you arrange them in your garden plan?',
        'What supplies would you need to get started?'
      ]
    },
    metadata: {
      estimatedTime: 8
    }
  },
  {
    id: 'composting-basics',
    type: 'hands-on',
    title: 'Start Your First Compost Pile',
    content: `Compost is "black gold" for your garden - it's free fertilizer and soil builder!

What You Can Compost:
GREENS (Nitrogen-rich):
- Fruit and vegetable scraps
- Coffee grounds and tea bags
- Grass clippings
- Eggshells

BROWNS (Carbon-rich):
- Dry leaves and straw
- Newspaper and cardboard
- Wood chips and sawdust
- Egg cartons

Simple Compost Method:
1. Find a shady spot 3x3 feet
2. Start with 6 inches of browns
3. Add 3 inches of greens
4. Add 3 inches of browns
5. Water until damp like a wrung sponge
6. Turn with a shovel every 1-2 weeks
7. Ready in 3-6 months (dark, crumbly, earthy smell)

Composting is God's recycling system - turning waste into life!`,
    metadata: {
      estimatedTime: 30,
      difficulty: 'beginner'
    }
  },
  {
    id: 'preserving-harvest',
    type: 'text',
    title: 'Preserving Your Harvest',
    content: `The homesteading mindset includes preserving abundance for winter months.

Simple Preservation Methods:

FREEZING:
- Blanch vegetables first (boil 2-3 minutes, ice bath)
- Package in freezer bags or containers
- Lasts 6-12 months

DRYING:
- Herbs: Hang in bunches in dark, airy place
- Tomatoes: Slice, salt, dehydrate at 135°F for 6-8 hours
- Apples: Slice 1/4 inch, dip in lemon juice, dehydrate

CANNING (start with easy):
- Jams and jellies (high acid, safe for beginners)
- Pickles (vinegar makes them safe)
- Tomatoes (acidic, can water-bath can)

The Bible talks about storing up in summer and gathering in harvest season. This wisdom applies to modern homesteading too!`,
    metadata: {
      estimatedTime: 5
    }
  },
  {
    id: 'scripture-stewardship',
    type: 'scripture',
    title: 'Biblical Stewardship',
    content: `A faithful man will abound with blessings, but whoever hastens to be rich will not go unpunished.

The soul of the sluggard craves and gets nothing, while the soul of the diligent is richly supplied.`,
    interactive: {
      reference: 'Proverbs 28:20, 13:4',
      translation: 'ESV',
      wordStudies: {
        'faithful': { hebrew: 'aman', meaning: 'to trust, believe, be reliable' },
        'diligent': { hebrew: 'charuts', meaning: 'sharp, decisive, industrious' }
      }
    },
    metadata: {
      estimatedTime: 5
    }
  },
  {
    id: 'first-steps-quiz',
    type: 'quiz',
    title: 'Your Homesteading First Steps',
    content: 'What\'s the most important factor for successful homesteading?',
    interactive: {
      options: [
        'Having lots of land and expensive equipment',
        'Starting small with what you have and being consistent',
        'Growing only rare and unusual vegetables',
        'Following complicated permaculture designs'
      ],
      correctIndex: 1,
      explanation: 'Successful homesteading starts small and builds consistency. Even a windowsill herb garden teaches the same principles as a large farm.'
    },
    metadata: {
      estimatedTime: 3
    }
  }
];

async function seedHomesteadingLesson() {
  try {
    console.log('🌱 Seeding Homesteading lesson...');

    // Create the lesson
    const lesson = await prisma.lesson.upsert({
      where: { lessonId: 'homesteading-basics-2024' },
      update: {},
      create: {
        lessonId: 'homesteading-basics-2024',
        title: 'Homesteading Basics: From Garden to Table',
        subject: 'Life Skills',
        gradeLevel: '5th',
        lessonJson: homesteadingLesson as any,
        standardsCodes: [
          'CCSS.ELA-LITERACY.RST.6-8.3',
          'CCSS.ELA-LITERACY.RST.6-8.7',
          'OAS.SS.5.4.3',
          'OAS.SS.5.4.4'
        ],
        estimatedDuration: 84, // Total minutes
        isActive: true
      }
    });

    console.log('✅ Homesteading lesson created:', lesson.lessonId);

    console.log('\n🎉 Homesteading lesson seeded successfully!');
    console.log('\nTo test the lesson:');
    console.log('1. Start the dev server');
    console.log('2. Ask Adeline: "teach me about homesteading"');
    console.log('3. The lesson should load with field notes styling');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedHomesteadingLesson();
}
