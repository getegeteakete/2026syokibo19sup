import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { STAGES } from '@/lib/constants'

export default async function DataPage() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { hearingData: true, applicationStatus: true }
  })

  const hearing = user?.hearingData
  const status = user?.applicationStatus
  const stageIndex = STAGES.findIndex(s => s.id === (status?.stage || 'requirement_check'))

  return (
    <div className="dash-page space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1b3a28]">🔍 登録データ確認</h1>
        <p className="text-[#7a8f80] text-sm mt-0.5">入力済みの情報を確認できます</p>
      </div>

      {/* Basic info */}
      <div className="bg-white dash-card p-5">
        <h2 className="font-semibold text-[#1b3a28] mb-4">👤 基本情報</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: 'ユーザーID', value: session.username },
            { label: '会社名・屋号', value: user?.companyName },
            { label: '担当者名', value: user?.contactName },
            { label: 'メールアドレス', value: user?.email },
            { label: '電話番号', value: user?.phone },
          ].map(item => item.value && (
            <div key={item.label} className="bg-[#f6fbf7] rounded-xl p-3">
              <p className="text-xs text-[#7a8f80]">{item.label}</p>
              <p className="text-sm font-medium text-[#1b3a28] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Application status */}
      <div className="bg-white dash-card p-5">
        <h2 className="font-semibold text-[#1b3a28] mb-4">📋 申請ステータス</h2>
        <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl mb-4">
          <span className="text-2xl">{STAGES[stageIndex]?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-primary-800">{STAGES[stageIndex]?.label}</p>
            <p className="text-xs text-primary-600">ステップ {stageIndex + 1} / {STAGES.length}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: '申請要件確認', done: status?.requirementCheckDone },
            { label: '補助額確認', done: status?.amountCheckDone },
            { label: 'ヒアリング完了', done: status?.hearingDone },
            { label: '商工会議所 様式4', done: status?.shokoukaiFiled },
            { label: '電子申請', done: status?.electronicFiled },
            { label: '採択', done: status?.adopted },
            { label: '実績報告', done: status?.reportFiled },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg ${item.done ? 'bg-green-50' : 'bg-[#f6fbf7]'}`}>
              <span>{item.done ? '✅' : '⭕'}</span>
              <span className={item.done ? 'text-green-700' : 'text-[#3d5c47]'}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hearing data */}
      {hearing && (
        <div className="bg-white dash-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1b3a28]">📝 ヒアリングデータ</h2>
            <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              記入率 {hearing.completionRate}%
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: '会社名・屋号', value: hearing.companyName },
              { label: '代表者名', value: hearing.representativeName },
              { label: '業種', value: hearing.businessType },
              { label: '従業員数', value: hearing.employeeCount },
              { label: '現在の事業内容', value: hearing.currentBusiness },
              { label: '主な商品・サービス', value: hearing.mainProducts },
              { label: '主なターゲット顧客', value: hearing.targetCustomers },
              { label: '補助金で実現したいこと', value: hearing.subsidyPurpose },
              { label: '具体的な取組内容', value: hearing.plannedActivities },
              { label: '申請希望額', value: hearing.requestedAmount },
            ].filter(item => item.value).map(item => (
              <div key={item.label} className="bg-[#f6fbf7] rounded-xl p-3">
                <p className="text-xs text-[#7a8f80] mb-1">{item.label}</p>
                <p className="text-sm text-[#1b3a28] whitespace-pre-wrap">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9aab9f] mt-4">最終更新: {new Date(hearing.updatedAt).toLocaleString('ja-JP')}</p>
        </div>
      )}
    </div>
  )
}
