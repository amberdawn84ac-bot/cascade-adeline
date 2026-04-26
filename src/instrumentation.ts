export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env-validator');
    try {
      validateEnv();
    } catch (err) {
      // Log the error but don't crash the server — let individual routes fail
      // with actionable messages rather than a cold-start SIGTERM.
      console.error('[Instrumentation] Environment validation failed:', err);
    }
  }
}
