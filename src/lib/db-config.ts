/**
 * Database Connection Pooling Configuration
 *
 * Supabase provides Supavisor as a built-in connection pooler.
 * For serverless environments (Vercel), use the Transaction Pooler URL (port 6543)
 * instead of the direct connection (port 5432).
 *
 * Connection string formats:
 * - Direct:      postgresql://user:pass@db.xxx.supabase.co:5432/postgres
 * - Pooler:      postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true
 *
 * For 100k users:
 * - Use Transaction Pooler for all serverless API routes
 * - Use Direct connection only for migrations and long-running scripts
 * - Set pool_mode=transaction in Supabase dashboard
 * - Monitor connections via Supabase dashboard > Database > Connection Pooling
 *
 * Environment variables:
 * - DATABASE_URL: Transaction Pooler URL (for app)
 * - DIRECT_DATABASE_URL: Direct connection (for migrations only)
 */

export const DB_POOL_CONFIG = {
  // Max connections per serverless instance
  // Supabase free tier: 15 direct connections, pooler handles more
  // Supabase Pro: 60 direct, pooler handles 200+
  maxConnections: 5,

  // Connection timeout in ms
  connectionTimeout: 10_000,

  // Idle timeout — close connections after this many ms of inactivity
  idleTimeout: 30_000,

  // Statement timeout — kill queries running longer than this
  statementTimeout: 30_000,
} as const;

/**
 * Get the appropriate database URL based on context.
 * - Migrations/seeding: use direct URL
 * - App runtime: use pooler URL
 */
export function getDatabaseUrl(context: 'app' | 'migration' = 'app'): string {
  if (context === 'migration') {
    return process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';
  }
  return process.env.DATABASE_URL || '';
}

/**
 * Check if the current DATABASE_URL is using the connection pooler.
 */
export function isUsingPooler(): boolean {
  const url = process.env.DATABASE_URL || '';
  return url.includes(':6543') || url.includes('pgbouncer=true');
}
