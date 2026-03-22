import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Generate a zero vector string for pgvector (dimension 1536)
const ZERO_VECTOR = `[${new Array(1536).fill(0).join(',')}]`;

async function main() {
  const client = await pool.connect();
  console.log('Seeding Knowledge Graph...');

  try {
    // 1. Define Concepts — 75+ nodes spanning K-12 + Life Skills
    const concepts = [
      // ── ELA: K-2 ───────────────────────────────────────────────────────────────
      { name: 'Phonemic Awareness',    subject: 'English Language Arts', grade: 'K-2',  desc: 'Identifying and manipulating individual sounds in spoken words' },
      { name: 'Phonics',               subject: 'English Language Arts', grade: 'K-2',  desc: 'Mapping letters to sounds; decoding printed words' },
      { name: 'Sight Words',           subject: 'English Language Arts', grade: 'K-2',  desc: 'High-frequency words recognized instantly without decoding' },
      { name: 'Reading Fluency',       subject: 'English Language Arts', grade: 'K-2',  desc: 'Reading with accuracy, speed, and expression' },
      // ── ELA: 3-5 ───────────────────────────────────────────────────────────────
      { name: 'Reading Comprehension', subject: 'English Language Arts', grade: '3-5',  desc: 'Understanding and interpreting texts at a literal and inferential level' },
      { name: 'Vocabulary Development',subject: 'English Language Arts', grade: '3-5',  desc: 'Building word knowledge through context and word study' },
      { name: 'Literary Elements',     subject: 'English Language Arts', grade: '3-5',  desc: 'Plot, character, setting, conflict, and point of view' },
      { name: 'Grammar & Mechanics',   subject: 'English Language Arts', grade: '3-5',  desc: 'Parts of speech, punctuation, sentence structure' },
      { name: 'Paragraph Writing',     subject: 'English Language Arts', grade: '3-5',  desc: 'Topic sentence, supporting details, concluding sentence' },
      // ── ELA: 6-8 ───────────────────────────────────────────────────────────────
      { name: 'Theme Analysis',        subject: 'English Language Arts', grade: '6-8',  desc: 'Identifying central messages and universal truths in literature' },
      { name: 'Syntax & Style',        subject: 'English Language Arts', grade: '6-8',  desc: 'Sentence variety, tone, and voice in writing' },
      { name: 'Essay Writing',         subject: 'English Language Arts', grade: '6-8',  desc: 'Five-paragraph and multi-paragraph argumentative and expository essays' },
      { name: 'Research Writing',      subject: 'English Language Arts', grade: '6-8',  desc: 'Synthesizing sources, citations, and academic documentation' },
      { name: 'Figurative Language',   subject: 'English Language Arts', grade: '6-8',  desc: 'Metaphor, simile, allusion, irony, and symbolism' },
      // ── ELA: 9-12 ──────────────────────────────────────────────────────────────
      { name: 'Rhetoric & Persuasion', subject: 'English Language Arts', grade: '9-12', desc: 'Ethos, pathos, logos; constructing and deconstructing arguments' },
      { name: 'Literary Analysis',     subject: 'English Language Arts', grade: '9-12', desc: 'Close reading, textual evidence, critical interpretation' },
      { name: 'AP Language & Composition', subject: 'English Language Arts', grade: '9-12', desc: 'College-level rhetoric, synthesis, and argumentative writing' },

      // ── MATH: K-2 ──────────────────────────────────────────────────────────────
      { name: 'Counting',              subject: 'Mathematics', grade: 'K-2',  desc: 'Counting whole numbers, number sense, and place value' },
      { name: 'Addition',              subject: 'Mathematics', grade: 'K-2',  desc: 'Adding whole numbers' },
      { name: 'Subtraction',           subject: 'Mathematics', grade: 'K-2',  desc: 'Subtracting whole numbers' },
      { name: 'Measurement',           subject: 'Mathematics', grade: 'K-2',  desc: 'Length, weight, time using standard and non-standard units' },
      // ── MATH: 3-5 ──────────────────────────────────────────────────────────────
      { name: 'Multiplication',        subject: 'Mathematics', grade: '3-5',  desc: 'Multiplying whole numbers; multiplication facts' },
      { name: 'Division',              subject: 'Mathematics', grade: '3-5',  desc: 'Dividing whole numbers; long division' },
      { name: 'Fractions',             subject: 'Mathematics', grade: '3-5',  desc: 'Understanding parts of a whole; equivalent fractions' },
      { name: 'Decimals',              subject: 'Mathematics', grade: '3-5',  desc: 'Decimal place value; converting between fractions and decimals' },
      { name: 'Geometry Basics',       subject: 'Mathematics', grade: '3-5',  desc: 'Shapes, angles, perimeter, area' },
      { name: 'Data & Graphing',       subject: 'Mathematics', grade: '3-5',  desc: 'Bar graphs, line plots, interpreting data' },
      // ── MATH: 6-8 ──────────────────────────────────────────────────────────────
      { name: 'Ratios & Proportions',  subject: 'Mathematics', grade: '6-8',  desc: 'Comparing quantities; proportional relationships' },
      { name: 'Percentages',           subject: 'Mathematics', grade: '6-8',  desc: 'Parts per 100; percent change, tax, tip, discount' },
      { name: 'Integers & Number Line',subject: 'Mathematics', grade: '6-8',  desc: 'Negative numbers, absolute value, and the coordinate plane' },
      { name: 'Pre-Algebra',           subject: 'Mathematics', grade: '6-8',  desc: 'Variables, expressions, equations, and inequalities' },
      { name: 'Statistics & Probability', subject: 'Mathematics', grade: '6-8', desc: 'Mean, median, mode, range; basic probability' },
      // ── MATH: 9-12 ─────────────────────────────────────────────────────────────
      { name: 'Algebra 1',             subject: 'Mathematics', grade: '9-12', desc: 'Linear equations, systems of equations, quadratic foundations' },
      { name: 'Geometry',              subject: 'Mathematics', grade: '9-12', desc: 'Proofs, congruence, similarity, trigonometry basics' },
      { name: 'Algebra 2',             subject: 'Mathematics', grade: '9-12', desc: 'Polynomials, rational functions, exponential and logarithmic functions' },
      { name: 'Pre-Calculus',          subject: 'Mathematics', grade: '9-12', desc: 'Trigonometry, vectors, limits, and function analysis' },
      { name: 'Calculus',              subject: 'Mathematics', grade: '9-12', desc: 'Derivatives, integrals, and the fundamental theorem of calculus' },

      // ── SCIENCE: K-2 ───────────────────────────────────────────────────────────
      { name: 'Observation Skills',    subject: 'Science', grade: 'K-2',  desc: 'Using the five senses to explore and describe the world' },
      { name: 'States of Matter',      subject: 'Science', grade: 'K-2',  desc: 'Solid, liquid, gas — properties and changes' },
      { name: 'Plant Life Cycles',     subject: 'Science', grade: 'K-2',  desc: 'Seed, germination, growth, reproduction' },
      { name: 'Animal Classification', subject: 'Science', grade: 'K-2',  desc: 'Vertebrates, invertebrates, habitats, and adaptations' },
      // ── SCIENCE: 3-5 ───────────────────────────────────────────────────────────
      { name: 'Earth Science',         subject: 'Science', grade: '3-5',  desc: 'Rocks, soil, weathering, layers of the Earth' },
      { name: 'Weather & Climate',     subject: 'Science', grade: '3-5',  desc: 'Weather patterns, water cycle, climate zones' },
      { name: 'Ecosystems',            subject: 'Science', grade: '3-5',  desc: 'Food chains, food webs, biomes, and interdependence' },
      { name: 'Mixtures & Solutions',  subject: 'Science', grade: '3-5',  desc: 'Physical vs. chemical changes; separating mixtures' },
      // ── SCIENCE: 6-8 ───────────────────────────────────────────────────────────
      { name: 'Cell Biology',          subject: 'Science', grade: '6-8',  desc: 'Cell structure, organelles, mitosis, and cell theory' },
      { name: 'Genetics',              subject: 'Science', grade: '6-8',  desc: 'DNA, heredity, Punnett squares, and traits' },
      { name: 'Chemistry Foundations', subject: 'Science', grade: '6-8',  desc: 'Atoms, elements, periodic table, and bonding basics' },
      { name: 'Physics: Forces & Motion', subject: 'Science', grade: '6-8', desc: 'Newton\'s laws, velocity, acceleration, gravity' },
      // ── SCIENCE: 9-12 ──────────────────────────────────────────────────────────
      { name: 'Chemistry: Reactions',  subject: 'Science', grade: '9-12', desc: 'Stoichiometry, reaction types, balancing equations' },
      { name: 'Physics: Energy',       subject: 'Science', grade: '9-12', desc: 'Work, energy, thermodynamics, waves, and electromagnetism' },
      { name: 'Environmental Science', subject: 'Science', grade: '9-12', desc: 'Sustainability, human impact, climate science, and ecological systems' },
      { name: 'Fermentation & Biochemistry', subject: 'Science', grade: '9-12', desc: 'Metabolic pathways, fermentation, and applied biochemistry' },

      // ── HISTORY / CIVICS: K-5 ──────────────────────────────────────────────────
      { name: 'Community & Citizenship', subject: 'Social Studies', grade: 'K-2', desc: 'Roles, rules, and responsibilities in communities' },
      { name: 'Map Skills',            subject: 'Social Studies', grade: 'K-2',  desc: 'Directions, map keys, continents, and oceans' },
      { name: 'US History Foundations',subject: 'Social Studies', grade: '3-5',  desc: 'Colonial era, founding documents, and early American history' },
      { name: 'World Cultures',        subject: 'Social Studies', grade: '3-5',  desc: 'Cultural geography, world religions, and global traditions' },
      // ── HISTORY / CIVICS: 6-8 ──────────────────────────────────────────────────
      { name: 'Primary Source Analysis', subject: 'Social Studies', grade: '6-8', desc: 'Evaluating diaries, letters, and original documents for historical truth' },
      { name: 'Civil War & Reconstruction', subject: 'Social Studies', grade: '6-8', desc: 'Causes, events, and consequences of the Civil War from primary accounts' },
      { name: 'US Constitution',       subject: 'Social Studies', grade: '6-8',  desc: 'Structure of government, Bill of Rights, amendments' },
      { name: 'Economics Basics',      subject: 'Social Studies', grade: '6-8',  desc: 'Supply and demand, markets, scarcity, and economic systems' },
      // ── HISTORY / CIVICS: 9-12 ─────────────────────────────────────────────────
      { name: 'World History',         subject: 'Social Studies', grade: '9-12', desc: 'Global events, empires, revolutions, and modern geopolitics' },
      { name: 'US Government',         subject: 'Social Studies', grade: '9-12', desc: 'Branches of government, legislation, elections, and policy' },
      { name: 'Civic Literacy',        subject: 'Social Studies', grade: '9-12', desc: 'Critical evaluation of power structures, civic participation, and justice' },

      // ── LIFE SKILLS / HOMESTEADING / PRACTICAL ARTS ────────────────────────────
      { name: 'Kitchen Safety',        subject: 'Practical Arts', grade: 'K-5',  desc: 'Food handling, knife safety, kitchen hygiene' },
      { name: 'Measuring Ingredients', subject: 'Practical Arts', grade: 'K-5',  desc: 'Accurate measurement of dry and liquid ingredients' },
      { name: 'Cooking Techniques',    subject: 'Practical Arts', grade: '3-8',  desc: 'Sautéing, boiling, roasting, and baking fundamentals' },
      { name: 'Food Preservation',     subject: 'Practical Arts', grade: '6-12', desc: 'Canning, fermenting, dehydrating, and root cellaring' },
      { name: 'Garden Planning',       subject: 'Practical Arts', grade: '3-8',  desc: 'Soil health, planting schedules, crop rotation, and companion planting' },
      { name: 'Agriculture & Yields',  subject: 'Practical Arts', grade: '6-12', desc: 'Calculating harvest yields, seed saving, sustainable farming practices' },
      { name: 'Animal Husbandry',      subject: 'Practical Arts', grade: '6-12', desc: 'Raising livestock and poultry; feeding, health, and breeding' },
      { name: 'Domestic Arts',         subject: 'Practical Arts', grade: 'K-12', desc: 'Sewing, fiber arts, home management, and traditional crafts' },
      { name: 'Budgeting Basics',      subject: 'Practical Arts', grade: '6-9',  desc: 'Income, expenses, saving, and basic personal financial planning' },
      { name: 'Business Accounting',   subject: 'Practical Arts', grade: '9-12', desc: 'Profit/loss, ledgers, invoices, and small business financial records' },
      { name: 'Entrepreneurship',      subject: 'Practical Arts', grade: '9-12', desc: 'Business planning, marketing, pricing, and operating a micro-business' },
    ];

    const conceptMap = new Map<string, string>();

    for (const c of concepts) {
      // Check if exists
      const existing = await client.query(
        `SELECT id FROM "Concept" WHERE name = $1 LIMIT 1`,
        [c.name]
      );

      if (existing.rows.length > 0) {
        conceptMap.set(c.name, existing.rows[0].id);
        console.log(`  Found existing: ${c.name}`);
      } else {
        const result = await client.query(
          `INSERT INTO "Concept" (id, name, description, subject_area, grade_band, embedding, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW(), NOW())
           RETURNING id`,
          [c.name, c.desc, c.subject, c.grade, ZERO_VECTOR]
        );
        conceptMap.set(c.name, result.rows[0].id);
        console.log(`  Created: ${c.name}`);
      }
    }

    // 2. Define Prerequisites — logically ordered K→12
    const dependencies = [
      // ── ELA chain ────────────────────────────────────────────────────────────
      { from: 'Phonemic Awareness',    to: 'Phonics' },
      { from: 'Phonics',               to: 'Sight Words' },
      { from: 'Phonics',               to: 'Reading Fluency' },
      { from: 'Sight Words',           to: 'Reading Fluency' },
      { from: 'Reading Fluency',       to: 'Reading Comprehension' },
      { from: 'Reading Comprehension', to: 'Vocabulary Development' },
      { from: 'Reading Comprehension', to: 'Literary Elements' },
      { from: 'Grammar & Mechanics',   to: 'Paragraph Writing' },
      { from: 'Vocabulary Development',to: 'Paragraph Writing' },
      { from: 'Literary Elements',     to: 'Theme Analysis' },
      { from: 'Paragraph Writing',     to: 'Essay Writing' },
      { from: 'Essay Writing',         to: 'Research Writing' },
      { from: 'Theme Analysis',        to: 'Literary Analysis' },
      { from: 'Figurative Language',   to: 'Literary Analysis' },
      { from: 'Research Writing',      to: 'Rhetoric & Persuasion' },
      { from: 'Syntax & Style',        to: 'Rhetoric & Persuasion' },
      { from: 'Literary Analysis',     to: 'AP Language & Composition' },
      { from: 'Rhetoric & Persuasion', to: 'AP Language & Composition' },

      // ── Math chain ───────────────────────────────────────────────────────────
      { from: 'Counting',              to: 'Addition' },
      { from: 'Counting',              to: 'Measurement' },
      { from: 'Addition',              to: 'Subtraction' },
      { from: 'Addition',              to: 'Multiplication' },
      { from: 'Subtraction',           to: 'Multiplication' },
      { from: 'Multiplication',        to: 'Division' },
      { from: 'Division',              to: 'Fractions' },
      { from: 'Fractions',             to: 'Decimals' },
      { from: 'Multiplication',        to: 'Geometry Basics' },
      { from: 'Multiplication',        to: 'Data & Graphing' },
      { from: 'Decimals',              to: 'Ratios & Proportions' },
      { from: 'Fractions',             to: 'Ratios & Proportions' },
      { from: 'Ratios & Proportions',  to: 'Percentages' },
      { from: 'Subtraction',           to: 'Integers & Number Line' },
      { from: 'Ratios & Proportions',  to: 'Pre-Algebra' },
      { from: 'Integers & Number Line',to: 'Pre-Algebra' },
      { from: 'Data & Graphing',       to: 'Statistics & Probability' },
      { from: 'Pre-Algebra',           to: 'Algebra 1' },
      { from: 'Geometry Basics',       to: 'Geometry' },
      { from: 'Algebra 1',             to: 'Geometry' },
      { from: 'Algebra 1',             to: 'Algebra 2' },
      { from: 'Geometry',              to: 'Algebra 2' },
      { from: 'Algebra 2',             to: 'Pre-Calculus' },
      { from: 'Statistics & Probability', to: 'Pre-Calculus' },
      { from: 'Pre-Calculus',          to: 'Calculus' },

      // ── Science chain ────────────────────────────────────────────────────────
      { from: 'Observation Skills',    to: 'States of Matter' },
      { from: 'Observation Skills',    to: 'Plant Life Cycles' },
      { from: 'Observation Skills',    to: 'Animal Classification' },
      { from: 'States of Matter',      to: 'Earth Science' },
      { from: 'States of Matter',      to: 'Weather & Climate' },
      { from: 'Plant Life Cycles',     to: 'Ecosystems' },
      { from: 'Animal Classification', to: 'Ecosystems' },
      { from: 'States of Matter',      to: 'Mixtures & Solutions' },
      { from: 'Mixtures & Solutions',  to: 'Cell Biology' },
      { from: 'Cell Biology',          to: 'Genetics' },
      { from: 'Mixtures & Solutions',  to: 'Chemistry Foundations' },
      { from: 'Chemistry Foundations', to: 'Chemistry: Reactions' },
      { from: 'Physics: Forces & Motion', to: 'Physics: Energy' },
      { from: 'Ecosystems',            to: 'Environmental Science' },
      { from: 'Chemistry: Reactions',  to: 'Fermentation & Biochemistry' },
      { from: 'Genetics',              to: 'Fermentation & Biochemistry' },

      // ── History / Civics chain ───────────────────────────────────────────────
      { from: 'Community & Citizenship', to: 'Map Skills' },
      { from: 'Map Skills',            to: 'US History Foundations' },
      { from: 'Map Skills',            to: 'World Cultures' },
      { from: 'US History Foundations',to: 'Primary Source Analysis' },
      { from: 'Primary Source Analysis', to: 'Civil War & Reconstruction' },
      { from: 'US History Foundations',to: 'US Constitution' },
      { from: 'US Constitution',       to: 'US Government' },
      { from: 'World Cultures',        to: 'World History' },
      { from: 'Economics Basics',      to: 'US Government' },
      { from: 'Civil War & Reconstruction', to: 'Civic Literacy' },
      { from: 'US Government',         to: 'Civic Literacy' },
      { from: 'World History',         to: 'Civic Literacy' },

      // ── Practical Arts / Homesteading chain ─────────────────────────────────
      { from: 'Kitchen Safety',        to: 'Measuring Ingredients' },
      { from: 'Measuring Ingredients', to: 'Cooking Techniques' },
      { from: 'Cooking Techniques',    to: 'Food Preservation' },
      { from: 'Plant Life Cycles',     to: 'Garden Planning' },
      { from: 'Garden Planning',       to: 'Agriculture & Yields' },
      { from: 'Animal Classification', to: 'Animal Husbandry' },
      { from: 'Agriculture & Yields',  to: 'Animal Husbandry' },
      { from: 'Budgeting Basics',      to: 'Business Accounting' },
      { from: 'Business Accounting',   to: 'Entrepreneurship' },
      { from: 'Agriculture & Yields',  to: 'Entrepreneurship' },

      // ── Cross-domain ─────────────────────────────────────────────────────────
      { from: 'Fractions',             to: 'Measuring Ingredients' },
      { from: 'Measurement',           to: 'Measuring Ingredients' },
      { from: 'Ratios & Proportions',  to: 'Agriculture & Yields' },
      { from: 'Economics Basics',      to: 'Budgeting Basics' },
      { from: 'Chemistry: Reactions',  to: 'Food Preservation' },
    ];

    for (const dep of dependencies) {
      const prereqId = conceptMap.get(dep.from);
      const dependentId = conceptMap.get(dep.to);
      if (!prereqId || !dependentId) continue;

      const exists = await client.query(
        `SELECT 1 FROM "ConceptPrerequisite" WHERE "conceptId" = $1 AND "prerequisiteId" = $2`,
        [dependentId, prereqId]
      );

      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO "ConceptPrerequisite" ("conceptId", "prerequisiteId") VALUES ($1, $2)`,
          [dependentId, prereqId]
        );
        console.log(`  Linked: ${dep.from} -> ${dep.to}`);
      }
    }

    console.log('\nKnowledge Graph seeded successfully!');
    console.log(`  ${concepts.length} concepts, ${dependencies.length} prerequisite links`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
