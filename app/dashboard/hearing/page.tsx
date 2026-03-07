'use client'
import { useState, useEffect } from 'react'
import { HEARING_SECTIONS, REQUIREMENT_CHECKS } from '@/lib/constants'

type HearingData = Record<string, string>

const TABS = [
  { id: 'requirement', label: '申請要件チェック', icon: '✅' },
  { id: 'company', label: '会社情報', icon: '🏢' },
  { id: 'current_business', label: '現在の事業', icon: '📊' },
  { id: 'subsidy_plan', label: '補助事業計画', icon: '🎯' },
  { id: 'amount', label: '補助額シミュレーション', icon: '💰' },
]

export default function HearingPage() {
  const [activeTab, setActiveTab] = useState('requirement')
  const [data, setData] = useState<HearingData>({})
  const [requirements, setRequirements] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [completionRate, setCompletionRate] = useState(0)

  // Load existing data
  useEffect(() => {
    fetch('/api/hearing').then(r => r.json()).then(({ data: d }) => {
      if (d) {
        setData(d)
        try { setRequirements(JSON.parse(d.requirementCheck || '{}')) } catch {}
        setCompletionRate(d.completionRate || 0)
      }
    })
  }, [])

  const handleChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleRequirementChange = (id: string, checked: boolean) => {
    const newReqs = { ...requirements, [id]: checked }
    setRequirements(newReqs)
    setData(prev => ({ ...prev, requirementCheck: JSON.stringify(newReqs) }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/hearing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Subsidy calculation
  const requestedAmount = parseInt(data.requestedAmount?.replace(/[^0-9]/g, '') || '0')
  const subsidyAmount = Math.min(Math.floor(requestedAmount * (2 / 3)), 500000)
  const ownBurden = requestedAmount - subsidyAmount

  const allRequirementsMet = REQUIREMENT_CHECKS.every(r => requirements[r.id])
  const requirementCount = REQUIREMENT_CHECKS.filter(r => requirements[r.id]).length

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">📝 ヒアリング・事業計画</h1>
          <p className="text-slate-500 text-sm mt-0.5">申請書類作成のための情報収集</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">記入率</p>
            <p className="text-lg font-bold text-primary-600">{completionRate}%</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary-500 hover:bg-primary-400 text-white shadow-md shadow-primary-500/30'
            }`}
          >
            {saving ? '保存中...' : saved ? '✅ 保存済み' : '💾 保存'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full progress-fill" style={{ width: `${completionRate}%` }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl border border-slate-200 p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Requirement check tab */}
      {activeTab === 'requirement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">申請要件チェックリスト</h2>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              allRequirementsMet ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {requirementCount} / {REQUIREMENT_CHECKS.length} 確認済み
            </span>
          </div>

          {!allRequirementsMet && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              ⚠️ すべての要件を満たしていることを確認してから申請に進んでください。
            </div>
          )}

          {allRequirementsMet && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              ✅ 申請要件をすべて確認しました！次のステップに進めます。
            </div>
          )}

          <div className="space-y-3">
            {REQUIREMENT_CHECKS.map(req => (
              <label key={req.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                requirements[req.id] ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  checked={requirements[req.id] || false}
                  onChange={e => handleRequirementChange(req.id, e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{req.label}</p>
                  {req.description && <p className="text-xs text-slate-500 mt-0.5">{req.description}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Form sections */}
      {HEARING_SECTIONS.map(section => activeTab === section.id && (
        <div key={section.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">{section.icon} {section.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.questions.map(q => (
              <div key={q.id} className={q.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {q.label}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {q.type === 'textarea' ? (
                  <textarea
                    value={data[q.id] || ''}
                    onChange={e => handleChange(q.id, e.target.value)}
                    rows={3}
                    placeholder={`${q.label}を入力してください`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all resize-none"
                  />
                ) : q.type === 'select' ? (
                  <select
                    value={data[q.id] || ''}
                    onChange={e => handleChange(q.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
                  >
                    <option value="">選択してください</option>
                    {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={data[q.id] || ''}
                    onChange={e => handleChange(q.id, e.target.value)}
                    placeholder={`${q.label}を入力`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Amount simulation tab */}
      {activeTab === 'amount' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">💰 補助額シミュレーション</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  補助対象経費の合計見込み額（円）
                </label>
                <input
                  type="text"
                  value={data.requestedAmount || ''}
                  onChange={e => handleChange('requestedAmount', e.target.value)}
                  placeholder="例: 750000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
                />
              </div>

              {requestedAmount > 0 && (
                <div className="bg-gradient-to-br from-primary-50 to-green-50 border border-primary-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-slate-800 mb-4 text-center">試算結果</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">補助対象経費</p>
                      <p className="text-lg font-bold text-slate-800">{requestedAmount.toLocaleString()}円</p>
                    </div>
                    <div className="bg-primary-600 text-white rounded-xl p-3 shadow-md shadow-primary-600/30">
                      <p className="text-xs text-primary-200 mb-1">補助金額（2/3）</p>
                      <p className="text-lg font-bold">{subsidyAmount.toLocaleString()}円</p>
                      {requestedAmount > 750000 && <p className="text-xs text-primary-300 mt-1">上限50万円適用</p>}
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">自己負担額</p>
                      <p className="text-lg font-bold text-amber-600">{ownBurden.toLocaleString()}円</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl">
                      <span className="text-green-500">✓</span>
                      <span className="text-slate-700">補助率: <strong>2/3</strong>（約66.7%）</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl">
                      <span>{requestedAmount <= 750000 ? '✓' : '⚠️'}</span>
                      <span className="text-slate-700">補助上限: <strong>50万円</strong>
                        {requestedAmount > 750000 && <span className="text-amber-600 ml-1">（上限に達しています）</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
                      <span>💡</span>
                      <span className="text-amber-800 text-xs">補助金は事業完了後の精算払いです。先に全額を立て替える必要があります。</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Eligible expenses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">補助対象となる経費</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                '机広告費（チラシ・ポスター・HP制作等）',
                '展示会等出展費',
                '旅費（販路開拓のための出張等）',
                '開発費（新商品・パッケージ等）',
                '資料購入費（市場調査等）',
                '雑役務費（軽微な委託費等）',
                '借料（機器・スペースのレンタル）',
                '設備処分費（既存設備の撤去等）',
                '委託費（専門家への委託）',
                '外注費（加工・設計等の外注）',
              ].map((expense, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-700">
                  <span className="text-green-500">✓</span>
                  {expense}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save button at bottom */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl shadow-md shadow-primary-500/30 transition-all hover:-translate-y-0.5"
        >
          {saving ? '保存中...' : saved ? '✅ 保存済み' : '💾 保存する'}
        </button>
      </div>
    </div>
  )
}
