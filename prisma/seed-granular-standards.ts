/**
 * Seed Granular Learning Standards for Standards-Based Microcredit System
 * 
 * This creates detailed, granular standards that can be mapped to specific activities.
 * Each standard gets a microcredit value based on what % of the total subject it represents.
 * 
 * Run with: npx tsx prisma/seed-granular-standards.ts
 */

import prisma from '../src/lib/db';

// ELA Vocabulary Standards - 200 grade-level words
// Each word = 1/200 of ELA vocabulary standards = 0.005 credits (assuming 1 credit for vocab)
const ELA_VOCABULARY_STANDARDS = [
  // Grade 3-5 Vocabulary (Sample - would expand to 200)
  { code: 'ELA.VOCAB.3-5.001', word: 'abandon', grade: '3-5', definition: 'to leave behind or give up' },
  { code: 'ELA.VOCAB.3-5.002', word: 'abundant', grade: '3-5', definition: 'existing in large quantities; plentiful' },
  { code: 'ELA.VOCAB.3-5.003', word: 'accurate', grade: '3-5', definition: 'correct in all details; exact' },
  { code: 'ELA.VOCAB.3-5.004', word: 'achieve', grade: '3-5', definition: 'to successfully reach a goal' },
  { code: 'ELA.VOCAB.3-5.005', word: 'ancient', grade: '3-5', definition: 'very old; from long ago' },
  { code: 'ELA.VOCAB.3-5.006', word: 'approach', grade: '3-5', definition: 'to come near or closer to' },
  { code: 'ELA.VOCAB.3-5.007', word: 'arrange', grade: '3-5', definition: 'to put in a particular order' },
  { code: 'ELA.VOCAB.3-5.008', word: 'attempt', grade: '3-5', definition: 'to try to do something' },
  { code: 'ELA.VOCAB.3-5.009', word: 'avoid', grade: '3-5', definition: 'to keep away from' },
  { code: 'ELA.VOCAB.3-5.010', word: 'brief', grade: '3-5', definition: 'lasting only a short time' },
  // ... would continue to 200 words
];

// Grade 6-8 Vocabulary
const ELA_VOCABULARY_6_8 = [
  { code: 'ELA.VOCAB.6-8.001', word: 'abstract', grade: '6-8', definition: 'existing in thought or as an idea but not having a physical existence' },
  { code: 'ELA.VOCAB.6-8.002', word: 'advocate', grade: '6-8', definition: 'to publicly support or recommend' },
  { code: 'ELA.VOCAB.6-8.003', word: 'analyze', grade: '6-8', definition: 'to examine in detail to understand' },
  { code: 'ELA.VOCAB.6-8.004', word: 'anticipate', grade: '6-8', definition: 'to expect or predict' },
  { code: 'ELA.VOCAB.6-8.005', word: 'articulate', grade: '6-8', definition: 'to express clearly in words' },
  // ... would continue to 200 words
];

// Grade 9-12 Vocabulary
const ELA_VOCABULARY_9_12 = [
  { code: 'ELA.VOCAB.9-12.001', word: 'ambiguous', grade: '9-12', definition: 'open to more than one interpretation' },
  { code: 'ELA.VOCAB.9-12.002', word: 'arbitrary', grade: '9-12', definition: 'based on random choice rather than reason' },
  { code: 'ELA.VOCAB.9-12.003', word: 'benevolent', grade: '9-12', definition: 'well-meaning and kindly' },
  { code: 'ELA.VOCAB.9-12.004', word: 'comprehensive', grade: '9-12', definition: 'complete; including all elements' },
  { code: 'ELA.VOCAB.9-12.005', word: 'contemplate', grade: '9-12', definition: 'to think about carefully' },
  // ... would continue to 200 words
];

// Technology/Keyboarding Standards
const TECHNOLOGY_STANDARDS = [
  {
    code: 'TECH.KEYBOARDING.K-5.WPM',
    jurisdiction: 'Common',
    subject: 'Technology',
    grade: 'K-5',
    statement: 'Demonstrate keyboarding proficiency at 15-25 WPM with 90% accuracy',
    microcredit: 0.01, // Each typing session = 1/100 of tech credit
  },
  {
    code: 'TECH.KEYBOARDING.6-8.WPM',
    jurisdiction: 'Common',
    subject: 'Technology',
    grade: '6-8',
    statement: 'Demonstrate keyboarding proficiency at 30-40 WPM with 92% accuracy',
    microcredit: 0.01,
  },
  {
    code: 'TECH.KEYBOARDING.9-12.WPM',
    jurisdiction: 'Common',
    subject: 'Technology',
    grade: '9-12',
    statement: 'Demonstrate keyboarding proficiency at 45+ WPM with 95% accuracy',
    microcredit: 0.01,
  },
];

// Computer Science Concept Standards - 50 core concepts
const CS_CONCEPT_STANDARDS = [
  { code: 'CS.CONCEPTS.001', concept: 'Variables', statement: 'Understand how to declare and use variables to store data', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.002', concept: 'Data Types', statement: 'Understand different data types (strings, numbers, booleans)', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.003', concept: 'Conditionals', statement: 'Use if/else statements to make decisions in code', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.004', concept: 'Loops', statement: 'Use loops (for, while) to repeat code execution', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.005', concept: 'Functions', statement: 'Define and call functions to organize code', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.006', concept: 'Arrays', statement: 'Use arrays to store collections of data', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.007', concept: 'Objects', statement: 'Create and use objects to group related data', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.008', concept: 'String Manipulation', statement: 'Perform operations on text strings', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.009', concept: 'Math Operations', statement: 'Use arithmetic operators and math functions', microcredit: 0.02 },
  { code: 'CS.CONCEPTS.010', concept: 'Comparison Operators', statement: 'Use comparison operators to evaluate conditions', microcredit: 0.02 },
  // ... would continue to 50 concepts
];

async function main() {
  console.log('🌱 Seeding granular learning standards...\n');

  let created = 0;
  let skipped = 0;

  // Seed ELA Vocabulary Standards (3-5)
  console.log('📚 Seeding ELA Vocabulary (Grade 3-5)...');
  for (const vocab of ELA_VOCABULARY_STANDARDS) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: vocab.code,
            jurisdiction: 'Common',
          },
        },
        update: {
          statementText: `Master the word "${vocab.word}": ${vocab.definition}`,
          subject: 'English Language Arts',
          gradeLevel: vocab.grade,
          typicalMicrocreditValue: 0.005, // 1/200 of vocabulary standards
          masteryIndicators: {
            correctSpelling: true,
            understandDefinition: true,
            useInContext: true,
          },
        },
        create: {
          standardCode: vocab.code,
          jurisdiction: 'Common',
          subject: 'English Language Arts',
          gradeLevel: vocab.grade,
          statementText: `Master the word "${vocab.word}": ${vocab.definition}`,
          typicalMicrocreditValue: 0.005,
          masteryIndicators: {
            correctSpelling: true,
            understandDefinition: true,
            useInContext: true,
          },
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${vocab.code}`, err);
      skipped++;
    }
  }

  // Seed ELA Vocabulary Standards (6-8)
  console.log('📚 Seeding ELA Vocabulary (Grade 6-8)...');
  for (const vocab of ELA_VOCABULARY_6_8) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: vocab.code,
            jurisdiction: 'Common',
          },
        },
        update: {
          statementText: `Master the word "${vocab.word}": ${vocab.definition}`,
          subject: 'English Language Arts',
          gradeLevel: vocab.grade,
          typicalMicrocreditValue: 0.005,
          masteryIndicators: {
            correctSpelling: true,
            understandDefinition: true,
            useInContext: true,
          },
        },
        create: {
          standardCode: vocab.code,
          jurisdiction: 'Common',
          subject: 'English Language Arts',
          gradeLevel: vocab.grade,
          statementText: `Master the word "${vocab.word}": ${vocab.definition}`,
          typicalMicrocreditValue: 0.005,
          masteryIndicators: {
            correctSpelling: true,
            understandDefinition: true,
            useInContext: true,
          },
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${vocab.code}`, err);
      skipped++;
    }
  }

  // Seed ELA Vocabulary Standards (9-12)
  console.log('📚 Seeding ELA Vocabulary (Grade 9-12)...');
  for (const vocab of ELA_VOCABULARY_9_12) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: vocab.code,
            jurisdiction: 'Common',
          },
        },
        update: {
          statementText: `Master the word "${vocab.word}": ${vocab.definition}`,
          subject: 'English Language Arts',
          gradeLevel: vocab.grade,
          typicalMicrocreditValue: 0.005,
          masteryIndicators: {
            correctSpelling: true,
            understandDefinition: true,
            useInContext: true,
          },
        },
        create: {
          standardCode: vocab.code,
          jurisdiction: 'Common',
          subject: 'English Language Arts',
          gradeLevel: vocab.grade,
          statementText: `Master the word "${vocab.word}": ${vocab.definition}`,
          typicalMicrocreditValue: 0.005,
          masteryIndicators: {
            correctSpelling: true,
            understandDefinition: true,
            useInContext: true,
          },
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${vocab.code}`, err);
      skipped++;
    }
  }

  // Seed Technology/Keyboarding Standards
  console.log('⌨️  Seeding Technology/Keyboarding Standards...');
  for (const tech of TECHNOLOGY_STANDARDS) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: tech.code,
            jurisdiction: tech.jurisdiction,
          },
        },
        update: {
          statementText: tech.statement,
          subject: tech.subject,
          gradeLevel: tech.grade,
          typicalMicrocreditValue: tech.microcredit,
          masteryIndicators: {
            wpmBenchmark: true,
            accuracyBenchmark: true,
            properTechnique: true,
          },
        },
        create: {
          standardCode: tech.code,
          jurisdiction: tech.jurisdiction,
          subject: tech.subject,
          gradeLevel: tech.grade,
          statementText: tech.statement,
          typicalMicrocreditValue: tech.microcredit,
          masteryIndicators: {
            wpmBenchmark: true,
            accuracyBenchmark: true,
            properTechnique: true,
          },
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${tech.code}`, err);
      skipped++;
    }
  }

  // Seed Computer Science Concept Standards
  console.log('💻 Seeding Computer Science Concept Standards...');
  for (const cs of CS_CONCEPT_STANDARDS) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: cs.code,
            jurisdiction: 'Common',
          },
        },
        update: {
          statementText: cs.statement,
          subject: 'Computer Science',
          gradeLevel: '6-12',
          typicalMicrocreditValue: cs.microcredit,
          masteryIndicators: {
            readCode: true,
            predictBehavior: true,
            explainConcept: true,
          },
        },
        create: {
          standardCode: cs.code,
          jurisdiction: 'Common',
          subject: 'Computer Science',
          gradeLevel: '6-12',
          statementText: cs.statement,
          typicalMicrocreditValue: cs.microcredit,
          masteryIndicators: {
            readCode: true,
            predictBehavior: true,
            explainConcept: true,
          },
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${cs.code}`, err);
      skipped++;
    }
  }

  console.log(`\n✅ Seeded ${created} granular standards (${skipped} skipped)`);
  console.log('   - ELA Vocabulary: 20 words (sample - expand to 200)');
  console.log('   - Technology/Keyboarding: 3 grade bands');
  console.log('   - Computer Science: 10 concepts (sample - expand to 50)');
  console.log('\n💡 Next steps:');
  console.log('   1. Expand vocabulary lists to 200 words per grade band');
  console.log('   2. Add Math concept standards (150 objectives)');
  console.log('   3. Add Science investigation standards (100 objectives)');
  console.log('   4. Create learning plans that reference these standards');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
