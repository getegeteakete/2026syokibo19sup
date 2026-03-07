'use client'
import { useState } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

interface Props {
  user: {
    id: string
    username: string
    companyName: string | null
    contactName: string | null
    email: string | null
    phone: string | null
    hearingData: Record<string, unknown> | null
    applicationStatus: {
      stage: string
      requirementCheckDone: boolean
      amountCheckDone: boolean
      hearingDone: boolean
      shokoukaiFiled: boolean
      electronicFiled: boolean
      adopted: boolean
      reportFiled: boolean
      notes: string | null
    } | null
    totalTokens: number
    chatMessages: Array<{ id: string; role: string; content: string; section: string; createdAt: Date }>
  }
  stages: Array<{ id: string; label: string; icon: string }>
  stageIndex: number
}

export default function AdminCustomerClient({ user, stages, stageIndex }: Props) {
  const [activeTab, setActiveTab] = useState<'data' | 'chat' | 'status'>('data')
  const [status, setStatus] = useState(user.applicationStatus || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleStatusChange = (field: string, value: unknown) => {
    setStatus(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const saveStatus = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...status }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const hearing = user.hearingData as Record<string, string> | null

  const hearingFields = [
    { label: '会社名・屋号', key: 'companyName' },
    { label: '代表者名', key: 'representativeName' },
    { label: '業種', key: 'businessType' },
    { label: '従業員数', key: 'employeeCount' },
    { label: '年間売上高', key: 'annualSales' },
    { label: '現在の事業内容', key: 'currentBusiness' },
    { label: '主な商品・サービス', key: 'mainProducts' },
    { label: '主なターゲット顧客', key: 'targetCustomers' },
    { label: '販売チャネル', key: 'salesChannels' },
    { label: '強み・特徴', key: 'strengths' },
    { label: '課題・悩み', key: 'challenges' },
    { label: '補助金で実現したいこと', key: 'subsidyPurpose' },
    { label: '取組内容', key: 'plannedActivities' },
    { label: '期待される効果', key: 'expectedEffects' },
    { label: '申請希望額', key: 'requestedAmount' },
    { label: '実施スケジュール', key: 'implementationPlan' },
  ]

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xs text-slate-500 mb-1">ヒアリング記入率</p>
          <p className={`text-2xl font-bold ${((hearing?.completionRate as unknown as number) || 0) >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
            {(hearing as Record<string, unknown>)?.completionRate as number || 0}%
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xs text-slate-500 mb-1">トークン使用量</p>
          <p className="text-2xl font-bold text-primary-600">{user.totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xs text-slate-500 mb-1">現在ステージ</p>
          <p className="text-lg font-bold text-slate-700">{stages[stageIndex]?.icon}</p>
          <p className="text-xs text-slate-600 truncate">{stages[stageIndex]?.label}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-200 p-1 mb-4">
        {[
          { id: 'data', label: 'ヒアリングデータ', icon: '📝' },
          { id: 'status', label: '申請ステータス管理', icon: '⚙️' },
          { id: 'chat', label: 'チャット履歴', icon: '💬' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Data tab */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">📝 ヒアリングデータ</h3>
          {!hearing && <p className="text-slate-400 text-sm">まだヒアリングデータがありません</p>}
          {hearing && (
            <div className="grid sm:grid-cols-2 gap-3">
              {hearingFields.filter(f => hearing[f.key]).map(field => (
                <div key={field.key} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{field.label}</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{hearing[field.key]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status tab */}
      {activeTab === 'status' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">⚙️ 申請ステータス管理</h3>
            <button
              onClick={saveStatus}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                saved ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-400 text-white shadow-md'
              }`}
            >
              {saving ? '保存中...' : saved ? '✅ 保存済み' : '保存'}
            </button>
          </div>

          {/* Stage select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">現在のステージ</label>
            <select
              value={(status as Record<string, unknown>).stage as string || 'requirement_check'}
              onChange={e => handleStatusChange('stage', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
            >
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'requirementCheckDone', label: '申請要件確認済み' },
              { key: 'amountCheckDone', label: '補助額確認済み' },
              { key: 'hearingDone', label: 'ヒアリング完了' },
              { key: 'shokoukaiFiled', label: '商工会議所 様式4 受領' },
              { key: 'electronicFiled', label: '電子申請完了' },
              { key: 'adopted', label: '採択' },
              { key: 'reportFiled', label: '実績報告提出済み' },
            ].map(item => (
              <label key={item.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                (status as Record<string, unknown>)[item.key] ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  checked={Boolean((status as Record<string, unknown>)[item.key])}
                  onChange={e => handleStatusChange(item.key, e.target.checked)}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="text-sm text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">管理メモ</label>
            <textarea
              value={(status as Record<string, unknown>).notes as string || ''}
              onChange={e => handleStatusChange('notes', e.target.value)}
              rows={3}
              placeholder="担当者向けのメモを入力..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white resize-none"
            />
          </div>
        </div>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
          <ChatInterface
            section="general"
            sectionTitle={`${user.companyName || user.username} のチャット（管理者閲覧）`}
            userId={user.id}
          />
        </div>
      )}
    </div>
  )
}
