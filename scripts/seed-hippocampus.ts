#!/usr/bin/env npx tsx
/**
 * Hippocampus Seed Script
 * Seeds the primary source knowledge store with public domain historical documents.
 * Run with: npx tsx --env-file=.env.local scripts/seed-hippocampus.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { seedHippocampus } from '../src/lib/hippocampus/seed';

async function main() {
  console.log('\n🧠 Seeding The Hippocampus...\n');
  await seedHippocampus();
  console.log('\n✅ Done.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
