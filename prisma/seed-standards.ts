/**
 * Seed State Standards — Oklahoma + Common Core
 *
 * Ported from old dear-adeline. Adapted for Prisma.
 * Run with: npx tsx prisma/seed-standards.ts
 */

import prisma from '../src/lib/db';

const OKLAHOMA_STANDARDS = [
  // Mathematics K-2
  { code: 'OK.MATH.K.N.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Count to 100 by ones and by tens.' },
  { code: 'OK.MATH.K.N.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Count forward beginning from a given number within the known sequence.' },
  { code: 'OK.MATH.1.N.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Extend the counting sequence to 120.' },
  { code: 'OK.MATH.1.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Use addition and subtraction within 20 to solve word problems.' },
  { code: 'OK.MATH.2.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Use addition and subtraction within 100 to solve one- and two-step word problems.' },
  { code: 'OK.MATH.2.NBT.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones.' },

  // Mathematics 3-5
  { code: 'OK.MATH.3.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Interpret products of whole numbers as the total number of objects in groups.' },
  { code: 'OK.MATH.3.NF.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.' },
  { code: 'OK.MATH.4.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Interpret a multiplication equation as a comparison.' },
  { code: 'OK.MATH.4.NF.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b).' },
  { code: 'OK.MATH.5.NF.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Add and subtract fractions with unlike denominators.' },
  { code: 'OK.MATH.5.MD.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Convert among different-sized standard measurement units within a given measurement system.' },

  // Mathematics 6-8
  { code: 'OK.MATH.6.RP.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.' },
  { code: 'OK.MATH.6.EE.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Write and evaluate numerical expressions involving whole-number exponents.' },
  { code: 'OK.MATH.7.RP.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Compute unit rates associated with ratios of fractions.' },
  { code: 'OK.MATH.7.EE.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Apply properties of operations to add, subtract, factor, and expand linear expressions with rational coefficients.' },
  { code: 'OK.MATH.8.EE.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Know and apply the properties of integer exponents to generate equivalent numerical expressions.' },
  { code: 'OK.MATH.8.F.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Understand that a function is a rule that assigns to each input exactly one output.' },

  // ELA K-5
  { code: 'OK.ELA.K.RF.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: 'K', statement: 'Demonstrate understanding of the organization and basic features of print.' },
  { code: 'OK.ELA.1.RF.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '1', statement: 'Know and apply grade-level phonics and word analysis skills in decoding words.' },
  { code: 'OK.ELA.2.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '2', statement: 'Ask and answer such questions as who, what, where, when, why, and how to demonstrate understanding of key details in a text.' },
  { code: 'OK.ELA.3.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for the answers.' },
  { code: 'OK.ELA.4.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Write opinion pieces on topics or texts, supporting a point of view with reasons and information.' },
  { code: 'OK.ELA.5.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '5', statement: 'Quote accurately from a text when explaining what the text says explicitly and when drawing inferences from the text.' },

  // Science K-8
  { code: 'OK.SCI.K.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: 'K', statement: 'Use observations to describe patterns of what plants and animals need to survive.' },
  { code: 'OK.SCI.2.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '2', statement: 'Plan and conduct an investigation to describe and classify different kinds of materials by their observable properties.' },
  { code: 'OK.SCI.4.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '4', statement: 'Identify evidence from patterns in rock formations and fossils in rock layers to support an explanation for changes in a landscape over time.' },
  { code: 'OK.SCI.5.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '5', statement: 'Support an argument that the gravitational force exerted by Earth on objects is directed down.' },
  { code: 'OK.SCI.7.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '7', statement: 'Develop a model to describe the cycling of matter and flow of energy among living and nonliving parts of an ecosystem.' },
  { code: 'OK.SCI.8.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '8', statement: 'Develop models to describe the atomic composition of simple molecules and extended structures.' },

  // Social Studies
  { code: 'OK.SS.3.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '3', statement: 'Describe the significance of national holidays and the heroism and achievements of the people associated with them.' },
  { code: 'OK.SS.5.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '5', statement: 'Describe the causes and effects of the American Revolution.' },
  { code: 'OK.SS.7.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '7', statement: 'Use maps, globes, and geospatial technologies to locate and describe physical and human features of places.' },
  { code: 'OK.SS.8.C.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '8', statement: 'Analyze the foundations, structures, and functions of the U.S. government.' },
];

async function main() {
  console.log('🌱 Seeding Oklahoma state standards...\n');

  let created = 0;
  let skipped = 0;

  for (const s of OKLAHOMA_STANDARDS) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: s.code,
            jurisdiction: s.jurisdiction,
          },
        },
        update: {
          statementText: s.statement,
          subject: s.subject,
          gradeLevel: s.grade,
        },
        create: {
          standardCode: s.code,
          jurisdiction: s.jurisdiction,
          subject: s.subject,
          gradeLevel: s.grade,
          statementText: s.statement,
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${s.code}`, err);
      skipped++;
    }
  }

  console.log(`\n✅ Seeded ${created} standards (${skipped} skipped)`);
  console.log('   Subjects: Mathematics, ELA, Science, Social Studies');
  console.log('   Grades: K-8');
  console.log('   Jurisdiction: Oklahoma');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
