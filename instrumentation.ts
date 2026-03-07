export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 非同期で実行（ブロックしない）
    import('./lib/auto-setup').then(({ autoSetup }) => {
      autoSetup().catch(e => console.error('[instrumentation] autoSetup failed:', e))
    }).catch(e => console.error('[instrumentation] import failed:', e))
  }
}
