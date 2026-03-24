import { z } from 'zod';

const envSchema = z.object({
  // Required - Core Services
  OPENAI_API_KEY: z.string().min(20, 'OPENAI_API_KEY must be set'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').includes('pgbouncer=true', { message: 'DATABASE_URL must use transaction pooler (port 6543) with pgbouncer=true' }),
  DIRECT_DATABASE_URL: z.string().url('DIRECT_DATABASE_URL must be a valid URL'),
  
  // Required - Supabase Auth
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY must be set'),
  
  // Required - Redis Cache
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(20, 'UPSTASH_REDIS_REST_TOKEN must be set'),
  
  // Required - App Secrets
  APP_ENCRYPTION_KEY: z.string().length(48, 'APP_ENCRYPTION_KEY must be 48 characters (24 bytes hex)').regex(/^[0-9a-f]{48}$/i, 'APP_ENCRYPTION_KEY must be hex'),
  SESSION_SECRET: z.string().length(48, 'SESSION_SECRET must be 48 characters (24 bytes hex)').regex(/^[0-9a-f]{48}$/i, 'SESSION_SECRET must be hex'),
  CRON_SECRET: z.string().length(48, 'CRON_SECRET must be 48 characters (24 bytes hex)').regex(/^[0-9a-f]{48}$/i, 'CRON_SECRET must be hex'),
  USER_PROVISION_SECRET: z.string().length(48, 'USER_PROVISION_SECRET must be 48 characters (24 bytes hex)').regex(/^[0-9a-f]{48}$/i, 'USER_PROVISION_SECRET must be hex'),
  
  // Optional - Enhanced Features
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  
  // Optional - Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Optional - Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Optional - Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // Optional - Deployment
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validates environment variables on startup
 * Throws detailed error if validation fails
 */
export function validateEnv(): ValidatedEnv {
  try {
    const validated = envSchema.parse(process.env);
    console.log('[ENV] ✅ Environment validation passed');
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[ENV] ❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      const missingVars = error.errors
        .filter(e => e.message.includes('Required') || e.message.includes('must be set'))
        .map(e => e.path[0]);
      
      if (missingVars.length > 0) {
        console.error('\n[ENV] Missing required environment variables:');
        missingVars.forEach(v => console.error(`  - ${v}`));
        console.error('\n[ENV] Copy .env.example to .env and fill in your values.');
      }
      
      throw new Error('Environment validation failed. Check logs above for details.');
    }
    throw error;
  }
}

/**
 * Validates environment without throwing - returns validation result
 * Useful for health checks and diagnostics
 */
export function checkEnv(): { valid: boolean; errors: string[] } {
  try {
    envSchema.parse(process.env);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}
