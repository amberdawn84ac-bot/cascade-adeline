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
    // 1. Define Concepts
    const concepts = [
      { name: 'Counting', subject: 'Math', grade: 'K-2', desc: 'Counting whole numbers' },
      { name: 'Addition', subject: 'Math', grade: 'K-2', desc: 'Adding whole numbers' },
      { name: 'Subtraction', subject: 'Math', grade: 'K-2', desc: 'Subtracting whole numbers' },
      { name: 'Multiplication', subject: 'Math', grade: '3-5', desc: 'Multiplying whole numbers' },
      { name: 'Division', subject: 'Math', grade: '3-5', desc: 'Dividing whole numbers' },
      { name: 'Fractions', subject: 'Math', grade: '3-5', desc: 'Understanding parts of a whole' },
      { name: 'Ratios', subject: 'Math', grade: '6-8', desc: 'Comparing two quantities' },
      { name: 'Percentages', subject: 'Math', grade: '6-8', desc: 'Parts per 100' },
      { name: 'Measurement Units', subject: 'Math', grade: '3-5', desc: 'Standard units of measure' },
      { name: 'Volume', subject: 'Math', grade: '3-5', desc: 'Measuring 3D space' },
      { name: 'States of Matter', subject: 'Science', grade: 'K-2', desc: 'Solid, Liquid, Gas' },
      { name: 'Mixtures', subject: 'Science', grade: '3-5', desc: 'Combining substances' },
      { name: 'Chemical Reactions', subject: 'Science', grade: '6-8', desc: 'Process transforming substances' },
      { name: 'Fermentation', subject: 'Science', grade: '9-12', desc: 'Metabolic process producing chemical changes' },
      { name: 'Measuring Ingredients', subject: 'Culinary', grade: 'K-12', desc: 'Accurate measurement' },
      { name: 'Mixing Techniques', subject: 'Culinary', grade: 'K-12', desc: 'Folding, whisking, beating' },
      { name: 'Dough Development', subject: 'Culinary', grade: 'K-12', desc: 'Gluten formation' },
      { name: 'Proofing', subject: 'Culinary', grade: 'K-12', desc: 'Allowing dough to rise' },
      { name: 'Baking', subject: 'Culinary', grade: 'K-12', desc: 'Heat application' },
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

    // 2. Define Prerequisites (Dependency Graph)
    const dependencies = [
      // Math Hierarchy
      { from: 'Counting', to: 'Addition' },
      { from: 'Addition', to: 'Multiplication' },
      { from: 'Subtraction', to: 'Division' },
      { from: 'Multiplication', to: 'Division' },
      { from: 'Division', to: 'Fractions' },
      { from: 'Fractions', to: 'Ratios' },
      { from: 'Ratios', to: 'Percentages' },
      // Measurement Hierarchy
      { from: 'Counting', to: 'Measurement Units' },
      { from: 'Measurement Units', to: 'Volume' },
      { from: 'Multiplication', to: 'Volume' },
      // Science Hierarchy
      { from: 'States of Matter', to: 'Mixtures' },
      { from: 'Mixtures', to: 'Chemical Reactions' },
      { from: 'Chemical Reactions', to: 'Fermentation' },
      // Cross-Domain (Baking)
      { from: 'Volume', to: 'Measuring Ingredients' },
      { from: 'Fractions', to: 'Measuring Ingredients' },
      { from: 'Mixtures', to: 'Mixing Techniques' },
      { from: 'Chemical Reactions', to: 'Dough Development' },
      { from: 'Fermentation', to: 'Proofing' },
      { from: 'States of Matter', to: 'Baking' },
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
