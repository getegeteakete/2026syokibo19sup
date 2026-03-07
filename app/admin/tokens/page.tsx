'use client'
import { useState, useEffect } from 'react'

interface UserTokenData {
  userId: string
  username: string
  companyName: string | null
  totalInput: number
  totalOutput: number
  total: number
}

interface Settings {
  perUserTokenLimit: number
  globalTokenLimit: number
}

export default function TokensPage() {
  const [data, setData] = useState<{ users: UserTokenData[]; globalTotal: number; settings: Settings } | null>(null)
  const [settings, setSettings] = useState<Settings>({ perUserTokenLimit: 50000, globalTokenLimit: 1000000 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = async () => {
    const res = await fetch('/api/tokens')
    const d = await res.json()
    setData(d)
    if (d.settings) setSettings(d.settings)
  }

  useEffect(() => { load() }, [])

  const saveSettings = async () => {
    setSaving(true)
    await fetch('/api/tokens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    load()
  }

  const resetUser = async (userId: string, name: string) => {
    if (!confirm(`${name} のトークン使用量をリセットしますか？`)) return
    await fetch('/api/tokens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetUserId: userId }),
    })
    load()
  }

  if (!data) return <div className="p-6 text-slate-500">読み込み中...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">🔢 トークン使用量管理</h1>
        <p className="text-slate-500 text-sm mt-0.5">AI利用量の監視と制限設定</p>
      </div>

      {/* Global stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">グローバル合計</p>
          <p className="text-2xl font-bold text-slate-800">{data.globalTotal.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">全顧客の合計使用量</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">1人あたりの制限</p>
          <p className="text-2xl font-bold text-primary-600">{settings.perUserTokenLimit.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">トークン / ユーザー</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">グローバル制限</p>
          <p className="text-2xl font-bold text-slate-700">{settings.globalTokenLimit.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">全体の最大使用量</p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">制限設定</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">1人あたりの上限トークン数</label>
            <input
              type="number"
              value={settings.perUserTokenLimit}
              onChange={e => setSettings(p => ({ ...p, perUserTokenLimit: parseInt(e.target.value) || 0 }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">グローバル上限トークン数</label>
            <input
              type="number"
              value={settings.globalTokenLimit}
              onChange={e => setSettings(p => ({ ...p, globalTokenLimit: parseInt(e.target.value) || 0 }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
            />
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-400 text-white shadow-md'
          }`}
        >
          {saving ? '保存中...' : saved ? '✅ 保存済み' : '設定を保存'}
        </button>
      </div>

      {/* Per-user usage */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-700">顧客別使用量</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {data.users.length === 0 && <p className="p-6 text-slate-400 text-sm text-center">顧客データなし</p>}
          {data.users.map(user => {
            const pct = Math.min((user.total / settings.perUserTokenLimit) * 100, 100)
            return (
              <div key={user.userId} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{user.companyName || user.username}</p>
                    <span className={`text-sm font-bold ${pct > 80 ? 'text-red-600' : pct > 50 ? 'text-amber-600' : 'text-green-600'}`}>
                      {user.total.toLocaleString()} / {settings.perUserTokenLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">入力: {user.totalInput.toLocaleString()} / 出力: {user.totalOutput.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => resetUser(user.userId, user.companyName || user.username)}
                  className="shrink-0 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  リセット
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
