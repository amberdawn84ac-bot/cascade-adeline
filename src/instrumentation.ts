export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkEnv } = await import('@/lib/env-validator');
    const envCheck = checkEnv();
    
    if (!envCheck.valid) {
      // Log warnings but don't crash - env vars may be loaded at request time
      console.warn('[Instrumentation] Environment check warnings:', envCheck.errors.join(', '));
      console.warn('[Instrumentation] Some features may be unavailable until env vars are configured');
    } else {
      console.log('[Instrumentation] ✅ Environment check passed');
    }
  }
}
