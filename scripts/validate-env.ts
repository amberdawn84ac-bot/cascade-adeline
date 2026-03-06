#!/usr/bin/env npx tsx
/**
 * Environment Validation Script
 * 
 * Validates that all required services are properly configured and reachable.
 * Run this before deployment to ensure everything works correctly.
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

interface ValidationResult {
  service: string;
  status: 'pass' | 'fail';
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];

function pass(service: string, message: string, details?: string) {
  results.push({ service, status: 'pass', message, details });
  console.log(`  ✅ ${service}: ${message}`);
}

function fail(service: string, message: string, details?: string) {
  results.push({ service, status: 'fail', message, details });
  console.error(`  ❌ ${service}: ${message}`);
  if (details) console.error(`     ${details}`);
}

async function validateEnvVars(): Promise<boolean> {
  console.log('\n📋 Validating Environment Variables...\n');
  
  const required = {
    'OPENAI_API_KEY': 'OpenAI API access',
    'DATABASE_URL': 'Database connection (pooler)',
    'DIRECT_DATABASE_URL': 'Database connection (direct)',
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
    'UPSTASH_REDIS_REST_URL': 'Redis cache URL',
    'UPSTASH_REDIS_REST_TOKEN': 'Redis cache token',
    'CRON_SECRET': 'Cron job authentication',
  };

  let allPresent = true;

  for (const [key, description] of Object.entries(required)) {
    const value = process.env[key];
    
    if (!value) {
      fail(key, `Missing (${description})`);
      allPresent = false;
    } else if (value.includes('YOUR_') || value.includes('replace-with') || value.startsWith('sk-...')) {
      fail(key, `Placeholder value detected (${description})`);
      allPresent = false;
    } else {
      pass(key, `Set (${description})`);
    }
  }

  return allPresent;
}

async function validateOpenAI(): Promise<boolean> {
  console.log('\n🤖 Validating OpenAI Connection...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    fail('OpenAI', 'API key not set');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      pass('OpenAI', `Connected successfully (${data.data?.length || 0} models available)`);
      return true;
    } else {
      const error = await response.text();
      fail('OpenAI', `API request failed (${response.status})`, error.substring(0, 200));
      return false;
    }
  } catch (error) {
    fail('OpenAI', 'Connection failed', String(error));
    return false;
  }
}

async function validateSupabase(): Promise<boolean> {
  console.log('\n🔐 Validating Supabase Connection...\n');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    fail('Supabase', 'Missing credentials');
    return false;
  }

  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('session_not_found')) {
      fail('Supabase Auth', 'Connection failed', error.message);
      return false;
    }
    
    pass('Supabase Auth', 'Connected successfully');
    return true;
  } catch (error) {
    fail('Supabase', 'Connection failed', String(error));
    return false;
  }
}

async function validateRedis(): Promise<boolean> {
  console.log('\n💾 Validating Redis Connection...\n');
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    fail('Redis', 'Missing credentials');
    return false;
  }

  try {
    const redis = new Redis({ url, token });
    const testKey = `health-check-${Date.now()}`;
    
    await redis.set(testKey, 'test', { ex: 10 });
    const value = await redis.get(testKey);
    await redis.del(testKey);
    
    if (value === 'test') {
      pass('Redis', 'Connected successfully (read/write verified)');
      return true;
    } else {
      fail('Redis', 'Read/write verification failed');
      return false;
    }
  } catch (error) {
    fail('Redis', 'Connection failed', String(error));
    return false;
  }
}

async function validateDatabase(): Promise<boolean> {
  console.log('\n🗄️  Validating Database Connection...\n');
  
  const poolerUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_DATABASE_URL;

  if (!poolerUrl || !directUrl) {
    fail('Database', 'Missing connection URLs');
    return false;
  }

  // Validate pooler URL format
  if (!poolerUrl.includes(':6543') && !poolerUrl.includes('pgbouncer=true')) {
    fail('DATABASE_URL', 'Should use transaction pooler (port 6543 or pgbouncer=true)');
    return false;
  }

  // Validate direct URL format
  if (directUrl.includes(':6543') || directUrl.includes('pgbouncer=true')) {
    fail('DIRECT_DATABASE_URL', 'Should use direct connection (port 5432, no pgbouncer)');
    return false;
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: poolerUrl });
    
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    
    if (result.rows.length > 0) {
      pass('Database (Pooler)', 'Connected successfully');
      return true;
    } else {
      fail('Database', 'Query returned no results');
      return false;
    }
  } catch (error) {
    fail('Database', 'Connection failed', String(error));
    return false;
  }
}

async function validateCronSecret(): Promise<boolean> {
  console.log('\n⏰ Validating Cron Configuration...\n');
  
  const secret = process.env.CRON_SECRET;
  
  if (!secret) {
    fail('CRON_SECRET', 'Not set');
    return false;
  }

  if (secret.length < 32) {
    fail('CRON_SECRET', 'Too short (should be at least 32 characters for security)');
    return false;
  }

  pass('CRON_SECRET', `Set (${secret.length} characters)`);
  return true;
}

async function main() {
  console.log('\n🔍 Dear Adeline — Production Environment Validation\n');
  console.log('='.repeat(60));

  // Load environment variables
  const dotenv = await import('dotenv');
  dotenv.config();

  const checks = [
    validateEnvVars,
    validateOpenAI,
    validateSupabase,
    validateRedis,
    validateDatabase,
    validateCronSecret,
  ];

  const checkResults = await Promise.all(checks.map(check => check().catch(() => false)));
  const allPassed = checkResults.every(result => result === true);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Validation Summary\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);

  if (allPassed) {
    console.log('\n🎉 All validations passed! Your environment is production-ready.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed. Please fix the issues above before deploying.\n');
    console.log('💡 Tips:');
    console.log('   - Check your .env file has all required values');
    console.log('   - Verify your Supabase project is active');
    console.log('   - Ensure your Upstash Redis database is created');
    console.log('   - Confirm your OpenAI API key has credits\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Validation script failed:', error);
  process.exit(1);
});
