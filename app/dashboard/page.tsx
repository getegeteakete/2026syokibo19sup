import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import CountdownSection from '@/components/CountdownSection'
import Link from 'next/link'
import { STAGES, REQUIRED_DOCUMENTS, SCHEDULE } from '@/lib/constants'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      hearingData: true,
      applicationStatus: true,
      tokenUsage: { select: { inputTokens: true, outputTokens: true } },
    }
  })

  const settings = await prisma.systemSettings.findFirst()
  const totalTokens = user?.tokenUsage.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0) || 0
  const tokenLimit = settings?.perUserTokenLimit || 50000
  const tokenPercent = Math.min((totalTokens / tokenLimit) * 100, 100)

  const stage = user?.applicationStatus?.stage || 'requirement_check'
  const stageIndex = STAGES.findIndex(s => s.id === stage)
  const completionRate = user?.hearingData?.completionRate || 0

  const now = new Date()
  const daysToDeadline = Math.ceil((SCHEDULE.applicationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            こんにちは、{user?.companyName || session.username}さん 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            申請締切まであと <strong className={daysToDeadline < 14 ? 'text-red-500' : 'text-primary-600'}>{daysToDeadline}日</strong> です
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-400">現在のステージ</p>
          <p className="text-sm font-semibold text-primary-600">
            {STAGES[stageIndex]?.icon} {STAGES[stageIndex]?.label}
          </p>
        </div>
      </div>

      {/* Countdown */}
      <CountdownSection />

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">申請進捗状況</h2>

        {/* Stage progress */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">ステップ {stageIndex + 1} / {STAGES.length}</span>
            <span className="text-xs font-medium text-primary-600">{STAGES[stageIndex]?.label}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full progress-fill"
              style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Stage dots */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                i < stageIndex ? 'bg-green-500 border-green-500 text-white' :
                i === stageIndex ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30' :
                'bg-white border-slate-200 text-slate-400'
              }`}>
                {i < stageIndex ? '✓' : s.icon}
              </div>
              <span className="text-xs text-slate-500 max-w-[56px] text-center leading-tight">{s.label.slice(0, 6)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: '/dashboard/chat', icon: '💬', label: 'AIに質問', desc: '何でも聞いてください', color: 'bg-primary-50 border-primary-100 hover:bg-primary-100' },
          { href: '/dashboard/hearing', icon: '📝', label: `ヒアリング ${completionRate}%`, desc: '事業情報を入力', color: 'bg-green-50 border-green-100 hover:bg-green-100' },
          { href: '/dashboard/documents', icon: '📂', label: '必要書類', desc: 'チェックリスト', color: 'bg-amber-50 border-amber-100 hover:bg-amber-100' },
          { href: '/dashboard/chat?section=document', icon: '✏️', label: '申請書作成', desc: 'AIで下書き作成', color: 'bg-purple-50 border-purple-100 hover:bg-purple-100' },
          { href: '/dashboard/chat?section=guide', icon: '🖥️', label: '電子申請ガイド', desc: '画面操作を案内', color: 'bg-sky-50 border-sky-100 hover:bg-sky-100' },
          { href: '/dashboard/reports', icon: '📊', label: '実績報告', desc: '採択後の手続き', color: 'bg-rose-50 border-rose-100 hover:bg-rose-100' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col gap-2 p-4 rounded-2xl border ${item.color} transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm`}
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Token usage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-700">🔢 AI利用量</h3>
          <span className="text-xs text-slate-500">{totalTokens.toLocaleString()} / {tokenLimit.toLocaleString()} トークン</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full progress-fill ${tokenPercent > 80 ? 'bg-red-400' : tokenPercent > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
            style={{ width: `${tokenPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          残り {(tokenLimit - totalTokens).toLocaleString()} トークン使用可能
        </p>
      </div>

      {/* Schedule summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-3">📅 重要スケジュール</h2>
        <div className="space-y-2">
          {[
            { date: '2026年3月6日', label: '申請受付開始', done: now > SCHEDULE.applicationStart },
            { date: '2026年4月16日', label: '様式4（商工会議所）発行受付締切', done: now > SCHEDULE.shokoukaideadline, urgent: true },
            { date: '2026年4月30日 17:00', label: '電子申請締切', done: now > SCHEDULE.applicationDeadline, urgent: true },
            { date: '2026年7月頃', label: '採択発表', done: now > SCHEDULE.adoptionAnnouncement },
            { date: '2027年6月30日', label: '補助事業実施期間終了', done: false },
            { date: '2027年7月10日', label: '実績報告書提出期限', done: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${item.done ? 'bg-green-50' : item.urgent ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <span className="text-base">{item.done ? '✅' : item.urgent ? '⚠️' : '🔵'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? 'text-green-700 line-through' : item.urgent ? 'text-amber-800' : 'text-slate-700'}`}>
                  {item.label}
                </p>
              </div>
              <span className={`text-xs shrink-0 ${item.done ? 'text-green-600' : item.urgent ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
