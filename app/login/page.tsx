'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        if (data.user.role === 'admin') router.push('/admin')
        else router.push('/dashboard')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4 border border-white/20">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">補助金サポートシステム</h1>
          <p className="text-primary-200 text-sm mt-1">小規模事業者持続化補助金 第19回</p>
          <div className="mt-2 inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse"></span>
            <span className="text-accent-300 text-xs font-medium">申請受付中 〜 2026年4月30日</span>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">ログイン</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-primary-200 text-sm mb-1.5 font-medium">ユーザーID</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ユーザーIDを入力"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-400/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-primary-200 text-sm mb-1.5 font-medium">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-400/30 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-200 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-400 disabled:bg-primary-700 text-white font-semibold rounded-xl py-3.5 transition-all duration-200 shadow-lg shadow-primary-600/30 hover:shadow-primary-400/40 hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : 'ログイン'}
            </button>
          </form>

          <p className="text-primary-300/60 text-xs text-center mt-6">
            アカウントをお持ちでない方は担当者にご連絡ください
          </p>
        </div>

        {/* Info footer */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', label: 'セキュア' },
            { icon: '🤖', label: 'AI支援' },
            { icon: '📱', label: 'スマホ対応' },
          ].map(item => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl py-3">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-primary-300 text-xs">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
