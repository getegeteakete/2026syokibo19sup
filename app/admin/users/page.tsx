'use client'
import { useState, useEffect } from 'react'
import { STAGES } from '@/lib/constants'

interface User {
  id: string
  username: string
  companyName: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  createdAt: string
  hearingData: { completionRate: number } | null
  applicationStatus: { stage: string } | null
  totalTokens: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', companyName: '', contactName: '', email: '', phone: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users || [])
  }

  useEffect(() => { loadUsers() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setSuccess(`✅ ${form.companyName || form.username} を作成しました`)
        setForm({ username: '', password: '', companyName: '', contactName: '', email: '', phone: '' })
        setShowCreate(false)
        loadUsers()
        setTimeout(() => setSuccess(''), 3000)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`${name} を削除しますか？この操作は取り消せません。`)) return
    await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' })
    loadUsers()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👥 顧客管理</h1>
          <p className="text-slate-500 text-sm mt-0.5">顧客の登録・管理ができます</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl shadow-md shadow-primary-500/20 transition-all"
        >
          <span className="text-lg">+</span>
          新規顧客登録
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm">{success}</div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">新規顧客登録</h2>
          <form onSubmit={handleCreate}>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {[
                { key: 'username', label: 'ユーザーID', required: true, type: 'text', placeholder: '半角英数字' },
                { key: 'password', label: 'パスワード', required: true, type: 'password', placeholder: '8文字以上推奨' },
                { key: 'companyName', label: '会社名・屋号', required: false, type: 'text', placeholder: '株式会社○○' },
                { key: 'contactName', label: '担当者名', required: false, type: 'text', placeholder: '山田 太郎' },
                { key: 'email', label: 'メールアドレス', required: false, type: 'email', placeholder: 'example@email.com' },
                { key: 'phone', label: '電話番号', required: false, type: 'text', placeholder: '090-0000-0000' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-4">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={creating}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-all disabled:opacity-50">
                {creating ? '作成中...' : '登録する'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-600 font-medium">登録顧客: {users.length}件</p>
        </div>
        <div className="divide-y divide-slate-100">
          {users.length === 0 && (
            <div className="p-8 text-center text-slate-400">顧客がまだ登録されていません</div>
          )}
          {users.map(user => {
            const stage = user.applicationStatus?.stage || 'requirement_check'
            const stageObj = STAGES.find(s => s.id === stage)

            return (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold shrink-0">
                  {(user.companyName || user.username).slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{user.companyName || '(会社名未設定)'}</p>
                  <p className="text-xs text-slate-500">ID: {user.username} | {user.email || 'メール未設定'}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">記入率</p>
                    <p className={`font-bold ${(user.hearingData?.completionRate || 0) >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                      {user.hearingData?.completionRate || 0}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">トークン</p>
                    <p className="font-medium text-slate-700">{user.totalTokens.toLocaleString()}</p>
                  </div>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                    {stageObj?.icon} {stageObj?.label.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/admin/customer/${user.id}`}
                    className="px-3 py-1.5 text-xs bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                  >
                    詳細
                  </a>
                  <button
                    onClick={() => handleDelete(user.id, user.companyName || user.username)}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
