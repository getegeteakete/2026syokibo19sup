// Next.js instrumentation — サーバー起動時に1回だけ実行される
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { autoSetup } = await import('./lib/auto-setup')
    await autoSetup()
  }
}
