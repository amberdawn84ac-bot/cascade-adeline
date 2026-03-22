/**
 * Seed Example Lesson
 * 
 * Creates a sample Dawes Act lesson to test the lesson system.
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

const dawesActLesson: LessonBlock[] = [
  {
    id: 'scripture-intro',
    type: 'scripture',
    title: 'Biblical Foundation',
    content: 'The land shall not be sold in perpetuity, for the land is mine. For you are strangers and sojourners with me.',
    interactive: {
      reference: 'Leviticus 25:23',
      translation: 'ESV',
      wordStudies: {
        'land': { hebrew: 'eretz', meaning: 'the earth, land' },
        'perpetuity': { meaning: 'forever, permanently' }
      }
    },
    metadata: {
      estimatedTime: 5
    }
  },
  {
    id: 'context-text',
    type: 'text',
    title: 'Historical Context',
    content: `In the late 1800s, the U.S. government faced a "problem": Native American tribes held millions of acres of land in communal ownership. This didn't fit the American model of individual land ownership.

The solution? The Dawes Act of 1887.

This law aimed to "assimilate" Native Americans by breaking up tribal lands into individual allotments. Any "surplus" land would be sold to non-Native settlers.

But what does this have to do with Leviticus 25:23? Let's investigate...`,
    metadata: {
      estimatedTime: 3
    }
  },
  {
    id: 'dawes-act-document',
    type: 'primary_source',
    title: 'The Dawes Act - Primary Document',
    content: `An Act to provide for the allotment of lands in Indian Reservations.

SEC. 1. Be it enacted by the Senate and House of Representatives of the United States of America in Congress assembled, That in all cases where any tribe or band of Indians has been or shall be located upon any reservation created for their use... the President of the United States is hereby authorized to cause all such lands to be surveyed...

SEC. 5. That upon the approval of the allotments... the United States shall declare to the Indian to whom such allotments have been made that the United States does and will hold the land thus allotted, for the period of twenty-five years, in trust for the sole use and benefit of the Indian to whom such allotment shall have been made...`,
    interactive: {
      narrativeRole: 'official_claim',
      investigationPrompts: [
        'What does "allotment" mean in this context?',
        'Why does the government hold the land "in trust" for 25 years?',
        'Who benefits from this arrangement?'
      ]
    },
    metadata: {
      creator: 'U.S. Congress',
      date: '1887-02-08',
      collection: 'National Archives',
      rights: 'public_domain',
      estimatedTime: 10
    }
  },
  {
    id: 'cherokee-testimony',
    type: 'primary_source',
    title: 'Cherokee Perspective',
    content: `We have lived on this land for generations. Our ancestors are buried here. The corn we plant grows in soil nourished by their bones.

Now the government sends men with papers and maps. They say we must each choose a small piece of land, and the rest will be taken from us.

How can we choose? The land belongs to all of us, not to one person. The river flows through all our lands. The deer roam freely. The wind knows no boundaries.

They speak of "progress" and "civilization." We ask: Whose civilization? Whose progress?`,
    interactive: {
      narrativeRole: 'eyewitness',
      investigationPrompts: [
        'How does this view of land differ from the Dawes Act?',
        'What relationship to land is described here?',
        'What values are being contrasted?'
      ]
    },
    metadata: {
      creator: 'Cherokee Elder',
      date: '1889',
      collection: 'Oral History Collection',
      rights: 'public_domain',
      estimatedTime: 8
    }
  },
  {
    id: 'investigation',
    type: 'investigation',
    title: 'Follow the Money Investigation',
    content: 'Who benefited from the Dawes Act?',
    interactive: {
      investigationType: 'follow-the-money',
      guidingQuestions: [
        'What happened to the "surplus" land after allotments?',
        'Who bought this land and at what price?',
        'How much land was "surplus" compared to what was allotted?',
        'What industries benefited from opening up Indian Territory?'
      ],
      whoBenefits: 'The real beneficiaries were railroad companies, oil speculators, and land developers who acquired millions of acres of "surplus" land for pennies on the dollar.'
    },
    metadata: {
      estimatedTime: 15
    }
  },
  {
    id: 'land-loss-data',
    type: 'primary_source',
    title: 'The Numbers Tell a Story',
    content: `Land Loss Statistics (1887-1934):

• Total tribal land in 1887: 138 million acres
• Total tribal land by 1934: 48 million acres
• Land lost: 90 million acres (65% of original territory)

Cherokee Nation Example:
• Original territory: 7 million acres
• After allotment: 2.5 million acres
• "Surplus" sold: 4.5 million acres
• Price paid to settlers: $1.25 - $2.50 per acre
• Market value: $10 - $50+ per acre

Railroad Land Grants:
• Attributed to Dawes Act enforcement: 40+ million acres
• Given to railroad companies: Often free or at nominal cost
• Sold by railroads: $5 - $100+ per acre`,
    interactive: {
      narrativeRole: 'official_claim',
      investigationPrompts: [
        'What story do these numbers tell?',
        'Who profited from the difference in land prices?',
        'How did railroad companies benefit?'
      ]
    },
    metadata: {
      estimatedTime: 10
    }
  },
  {
    id: 'scripture-reflection',
    type: 'scripture',
    title: 'Biblical Reflection',
    content: `You shall not oppress your neighbor or rob him.
The wages of a hired worker shall not remain with you all night until the morning.

You shall not curse the deaf or put a stumbling block before the blind,
but you shall fear your God: I am the LORD.`,
    interactive: {
      reference: 'Leviticus 19:13-14',
      translation: 'ESV',
      wordStudies: {
        'oppress': { hebrew: 'ashak', meaning: 'to wrong, defraud, oppress' },
        'stumbling block': { hebrew: 'mikshol', meaning: 'an obstacle or trap' }
      }
    },
    metadata: {
      estimatedTime: 5
    }
  },
  {
    id: 'quiz',
    type: 'quiz',
    title: 'Check Your Understanding',
    content: 'What was the primary purpose of the Dawes Act according to the government?',
    interactive: {
      options: [
        'To protect Native American land rights',
        'To assimilate Native Americans through individual land ownership',
        'To compensate Native Americans for previous injustices',
        'To help Native Americans become farmers'
      ],
      correctIndex: 1,
      explanation: 'The stated purpose was assimilation - breaking up communal land ownership to force Native Americans into individual farming and American-style land ownership.'
    },
    metadata: {
      estimatedTime: 3
    }
  },
  {
    id: 'hands-on',
    type: 'hands_on',
    title: 'Land Mapping Activity',
    content: `Create a map showing land loss:

1. Draw a rectangle representing 100 acres
2. Color 35% - this is what remained after the Dawes Act
3. Label the "surplus" 65% that was taken
4. Research: Find out who owns that land today
5. Reflect: What does this map show about justice?`,
    metadata: {
      estimatedTime: 20,
      difficulty: 'intermediate'
    }
  }
];

async function seedLesson() {
  try {
    console.log('🌱 Seeding Dawes Act lesson...');

    // Create the lesson
    const lesson = await prisma.lesson.upsert({
      where: { lessonId: 'dawes-act-1887' },
      update: {},
      create: {
        lessonId: 'dawes-act-1887',
        title: 'The Dawes Act: Land, Power, and Biblical Justice',
        subject: 'US History',
        gradeLevel: '5th',
        lessonJson: dawesActLesson as any,
        standardsCodes: [
          'CCSS.ELA-LITERACY.RH.6-8.1',
          'CCSS.ELA-LITERACY.RH.6-8.2',
          'CCSS.ELA-LITERACY.RH.6-8.6',
          'OAS.SS.5.4.3',
          'OAS.SS.5.4.4'
        ],
        estimatedDuration: 79, // Total minutes
        isActive: true
      }
    });

    console.log('✅ Lesson created:', lesson.lessonId);

    // Create some primary source records
    const primarySources = [
      {
        sourceId: 'dawes-act-text-1887',
        title: 'Dawes Act of 1887 - Full Text',
        creator: 'U.S. Congress',
        date: '1887-02-08',
        sourceType: 'document',
        content: dawesActLesson[2].content as string,
        url: 'https://www.archives.gov/historical-docs/dawes-act',
        collection: 'National Archives',
        rights: 'public_domain',
        metadata: {
          era: 'late-19th-century',
          subjects: ['Native American', 'Land Policy', 'US Government'],
          context: 'Primary legislation that enabled the breakup of tribal lands'
        },
        isActive: true
      },
      {
        sourceId: 'cherokee-testimony-1889',
        title: 'Cherokee Response to Allotment',
        creator: 'Cherokee Nation Oral History',
        date: '1889',
        sourceType: 'document',
        content: dawesActLesson[3].content as string,
        collection: 'Cherokee Heritage Center',
        rights: 'public_domain',
        metadata: {
          era: 'late-19th-century',
          subjects: ['Cherokee', 'Land Rights', 'Indigenous Perspective'],
          context: 'Native American perspective on communal land ownership'
        },
        isActive: true
      }
    ];

    for (const source of primarySources) {
      await prisma.primarySource.upsert({
        where: { sourceId: source.sourceId },
        update: {},
        create: source
      });
    }

    console.log('✅ Primary sources created');

    console.log('\n🎉 Lesson system seeded successfully!');
    console.log('\nTo test the lesson:');
    console.log('1. Start the dev server');
    console.log('2. Ask Adeline: "teach me about the Dawes Act"');
    console.log('3. The lesson should load with field notes styling');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedLesson();
}
