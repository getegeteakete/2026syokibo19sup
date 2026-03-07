import { STAGES, SCHEDULE } from '@/lib/constants'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) return null

  const status = await prisma.applicationStatus.findUnique({
    where: { userId: session.id }
  })

  const stage = status?.stage || 'requirement_check'
  const stageIndex = STAGES.findIndex(s => s.id === stage)

  const milestones = [
    {
      date: '2026年1月28日',
      label: '公募要領公開',
      done: true,
      type: 'official',
    },
    {
      date: '2026年3月6日',
      label: '申請受付開始',
      done: new Date() > SCHEDULE.applicationStart,
      type: 'official',
    },
    {
      date: '2026年4月16日',
      label: '様式4（商工会議所）発行受付締切',
      done: status?.shokoukaiFiled || false,
      type: 'urgent',
      note: '商工会議所での面談・様式4入手が必要',
    },
    {
      date: '2026年4月30日 17:00',
      label: '電子申請締切',
      done: status?.electronicFiled || false,
      type: 'urgent',
      note: 'Jグランツにて電子申請',
    },
    {
      date: '2026年7月頃',
      label: '採択発表',
      done: status?.adopted || false,
      type: 'official',
      note: '採択された場合、採択通知書が届く',
    },
    {
      date: '採択後1〜2ヶ月',
      label: '交付決定',
      done: false,
      type: 'official',
      note: '見積書等の提出が必要',
    },
    {
      date: '交付決定日〜2027年6月30日',
      label: '補助事業実施期間',
      done: false,
      type: 'action',
      note: '交付決定日から補助事業開始。経費支出はこの期間内のみ対象',
    },
    {
      date: '2027年7月10日',
      label: '実績報告書提出期限',
      done: status?.reportFiled || false,
      type: 'urgent',
      note: '補助事業終了後30日以内または上記期限のいずれか早い日',
    },
    {
      date: '実績報告後',
      label: '補助金額確定・請求・交付',
      done: false,
      type: 'action',
    },
    {
      date: '事業終了から1年後',
      label: '事業効果報告書提出',
      done: false,
      type: 'official',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">📅 スケジュール管理</h1>
        <p className="text-slate-500 text-sm mt-0.5">申請から実績報告までの全体スケジュール</p>
      </div>

      {/* Current stage */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-5 text-white shadow-lg shadow-primary-500/20">
        <p className="text-primary-200 text-sm mb-1">現在のステージ</p>
        <p className="text-2xl font-bold">{STAGES[stageIndex]?.icon} {STAGES[stageIndex]?.label}</p>
        <p className="text-primary-200 text-sm mt-2">ステップ {stageIndex + 1} / {STAGES.length}</p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">全体スケジュール</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={i} className="relative flex gap-4 pl-12">
                {/* Dot */}
                <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 -translate-x-0.5 mt-1.5 ${
                  m.done
                    ? 'bg-green-500 border-green-500'
                    : m.type === 'urgent'
                    ? 'bg-white border-red-400'
                    : 'bg-white border-slate-300'
                }`} />

                <div className={`flex-1 p-3 rounded-xl ${
                  m.done ? 'bg-green-50 border border-green-100' :
                  m.type === 'urgent' ? 'bg-red-50 border border-red-100' :
                  'bg-slate-50 border border-slate-100'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${m.done ? 'text-green-800 line-through' : 'text-slate-800'}`}>
                      {m.done ? '✅ ' : ''}{m.label}
                    </p>
                    <span className={`text-xs shrink-0 font-medium ${
                      m.type === 'urgent' ? 'text-red-600' : 'text-slate-500'
                    }`}>{m.date}</span>
                  </div>
                  {m.note && <p className="text-xs text-slate-500 mt-1">{m.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GbizID callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h3 className="font-semibold text-amber-800 mb-2">💡 今すぐやること</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            GビズIDプライムを申請する（2〜3週間かかります）
          </div>
          <div className="flex items-center gap-2 text-amber-800">
            <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            最寄りの商工会議所に連絡し面談を予約する
          </div>
          <div className="flex items-center gap-2 text-amber-800">
            <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            ヒアリングを入力して申請書の準備を進める
          </div>
        </div>
      </div>
    </div>
  )
}
