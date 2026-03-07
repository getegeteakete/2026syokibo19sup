export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { autoSetup } = await import('./lib/auto-setup')
      await autoSetup()
    } catch (e) {
      console.error('[instrumentation] autoSetup failed:', e)
    }
  }
}
