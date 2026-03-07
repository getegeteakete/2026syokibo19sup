import { prisma } from '@/lib/db'
import { STAGES } from '@/lib/constants'
import Link from 'next/link'

export default async function AdminPage() {
  const users = await prisma.user.findMany({
    where: { role: 'customer' },
    include: {
      hearingData: { select: { completionRate: true } },
      applicationStatus: { select: { stage: true, adopted: true, electronicFiled: true } },
      tokenUsage: { select: { inputTokens: true, outputTokens: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const settings = await prisma.systemSettings.findFirst()
  const totalTokens = users.reduce((sum, u) => sum + u.tokenUsage.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0), 0)

  const stats = {
    total: users.length,
    hearing: users.filter(u => (u.hearingData?.completionRate || 0) > 50).length,
    electronic: users.filter(u => u.applicationStatus?.electronicFiled).length,
    adopted: users.filter(u => u.applicationStatus?.adopted).length,
    tokens: totalTokens,
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
        <p className="text-slate-500 text-sm mt-0.5">小規模事業者持続化補助金 第19回</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '登録顧客数', value: stats.total, icon: '👥', color: 'bg-primary-50 text-primary-700', border: 'border-primary-200' },
          { label: 'ヒアリング50%+', value: stats.hearing, icon: '📝', color: 'bg-green-50 text-green-700', border: 'border-green-200' },
          { label: '電子申請済み', value: stats.electronic, icon: '✅', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
          { label: '採択済み', value: stats.adopted, icon: '🎉', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white rounded-2xl border ${stat.border} p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</span>
            </div>
            <p className="text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Token overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">🔢 トークン使用状況</h2>
          <Link href="/admin/tokens" className="text-xs text-primary-600 font-medium hover:underline">詳細 →</Link>
        </div>
        <p className="text-3xl font-bold text-slate-800">{totalTokens.toLocaleString()}<span className="text-sm text-slate-500 font-normal ml-1">トークン使用済み</span></p>
        <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
            style={{ width: `${Math.min((totalTokens / (settings?.globalTokenLimit || 1000000)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">グローバル上限: {(settings?.globalTokenLimit || 1000000).toLocaleString()}</p>
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">👥 顧客一覧</h2>
          <Link href="/admin/users" className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary-400 transition-colors">
            + 新規追加
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {users.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-3xl mb-2">👥</p>
              <p>まだ顧客が登録されていません</p>
            </div>
          )}
          {users.map(user => {
            const stage = user.applicationStatus?.stage || 'requirement_check'
            const stageObj = STAGES.find(s => s.id === stage)
            const tokens = user.tokenUsage.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)

            return (
              <Link
                key={user.id}
                href={`/admin/customer/${user.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                  {(user.companyName || user.username).slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{user.companyName || user.username}</p>
                  <p className="text-xs text-slate-500">{user.username}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">記入率</p>
                    <p className={`text-sm font-bold ${(user.hearingData?.completionRate || 0) >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                      {user.hearingData?.completionRate || 0}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">トークン</p>
                    <p className="text-sm font-medium text-slate-700">{tokens.toLocaleString()}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                  user.applicationStatus?.adopted ? 'bg-green-100 text-green-700' :
                  user.applicationStatus?.electronicFiled ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {stageObj?.icon} {stageObj?.label.slice(0, 6)}
                </span>
                <span className="text-slate-300">›</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
