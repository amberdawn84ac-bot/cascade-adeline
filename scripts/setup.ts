#!/usr/bin/env npx tsx
/**
 * Dear Adeline — Setup Script
 *
 * Run with: npm run setup
 *
 * Checks environment, pushes DB schema, seeds knowledge graph.
 */

import { existsSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');
const ENV_FILE = resolve(ROOT, '.env');
const ENV_EXAMPLE = resolve(ROOT, '.env.example');

function log(msg: string) { console.log(`\n  ✅ ${msg}`); }
function warn(msg: string) { console.log(`\n  ⚠️  ${msg}`); }
function fail(msg: string) { console.error(`\n  ❌ ${msg}`); }

function run(cmd: string) {
  console.log(`\n  → ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  console.log('\n🌾 Dear Adeline — Setup\n');

  // Step 1: Check .env
  if (!existsSync(ENV_FILE)) {
    if (existsSync(ENV_EXAMPLE)) {
      copyFileSync(ENV_EXAMPLE, ENV_FILE);
      warn('.env not found — copied from .env.example. Please fill in your API keys.');
      console.log(`\n  Open ${ENV_FILE} and add your keys before continuing.`);
      process.exit(0);
    } else {
      fail('No .env or .env.example found. Create a .env file with your API keys.');
      process.exit(1);
    }
  }
  log('.env file found');

  // Step 2: Check required env vars
  // Load .env manually
  const dotenv = await import('dotenv');
  dotenv.config({ path: ENV_FILE });

  const required = ['OPENAI_API_KEY', 'DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'UPSTASH_REDIS_REST_URL'];
  const missing = required.filter((key) => !process.env[key] || process.env[key]?.startsWith('sk-...') || process.env[key]?.includes('YOUR_'));

  if (missing.length > 0) {
    warn(`Missing or placeholder env vars: ${missing.join(', ')}`);
    console.log('  Please fill these in before running the app.');
  } else {
    log('All required env vars set');
  }

  // Step 3: Push DB schema
  console.log('\n📦 Pushing database schema...');
  try {
    run('npx prisma db push');
    log('Database schema synced');
  } catch {
    fail('prisma db push failed. Check your DATABASE_URL.');
    process.exit(1);
  }

  // Step 4: Generate Prisma client
  console.log('\n🔧 Generating Prisma client...');
  try {
    run('npx prisma generate');
    log('Prisma client generated');
  } catch {
    fail('prisma generate failed.');
    process.exit(1);
  }

  // Step 5: Seed knowledge graph
  console.log('\n🌳 Seeding knowledge graph...');
  try {
    run('npx tsx prisma/seed-knowledge-graph.ts');
    log('Knowledge graph seeded (19 concepts + 19 prerequisite links)');
  } catch {
    warn('Knowledge graph seed failed (may already be seeded, which is fine).');
  }

  // Done
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 Setup complete!\n');
  console.log('  Next steps:');
  console.log('    npm run dev          Start the dev server');
  console.log('    open localhost:3000   Open in browser');
  console.log('');

  if (missing.length > 0) {
    console.log('  ⚠️  Remember to fill in missing env vars first:');
    missing.forEach((key) => console.log(`     - ${key}`));
    console.log('');
  }
}

main().catch((err) => {
  fail(`Setup failed: ${err.message}`);
  process.exit(1);
});
