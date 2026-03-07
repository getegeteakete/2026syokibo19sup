'use client'
import { useState } from 'react'
import Link from 'next/link'

const REPORT_DOCS = [
  { id: 'jisseki', label: '実績報告書（様式7）', required: true, description: '補助事業の実施内容を報告' },
  { id: 'keiri', label: '経理書類一覧（様式8）', required: true, description: '補助対象経費の一覧' },
  { id: 'ryoshusho', label: '領収書・請求書の写し', required: true, description: 'すべての補助対象経費の証憑' },
  { id: 'tsukisho', label: '振込明細・通帳の写し', required: true, description: '支払いを証明する書類' },
  { id: 'seika', label: '成果物（チラシ・HP等）の写し', required: false, description: '補助事業で作成した成果物' },
  { id: 'kotei', label: '固定資産台帳の写し（該当する場合）', required: false, description: '機械装置等を取得した場合' },
]

export default function ReportsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [section, setSection] = useState<'info' | 'docs' | 'chat'>('info')

  const toggleCheck = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))
  const checkedCount = REPORT_DOCS.filter(d => d.required && checked[d.id]).length
  const totalRequired = REPORT_DOCS.filter(d => d.required).length

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">📊 実績報告</h1>
        <p className="text-slate-500 text-sm mt-0.5">補助事業終了後の実績報告手続き</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-200 p-1">
        {[
          { id: 'info', label: '概要・手順', icon: 'ℹ️' },
          { id: 'docs', label: '提出書類', icon: '📎' },
          { id: 'chat', label: 'AIに相談', icon: '💬' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id as typeof section)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
              section === tab.id ? 'bg-primary-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {section === 'info' && (
        <div className="space-y-4">
          {/* Important dates */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="font-semibold text-amber-800 mb-3">⚠️ 実績報告の重要事項</h3>
            <div className="space-y-2 text-sm text-amber-900">
              <div className="flex items-start gap-2 p-2 bg-white rounded-xl">
                <span>📅</span>
                <div>
                  <p className="font-medium">提出期限：2027年7月10日</p>
                  <p className="text-xs text-amber-700 mt-0.5">補助事業が終了したときから30日以内、またはこの期限のいずれか早い日</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white rounded-xl">
                <span>💡</span>
                <div>
                  <p className="font-medium">補助金は精算払い</p>
                  <p className="text-xs text-amber-700 mt-0.5">実績報告後、補助金額が確定→請求→交付という流れです</p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">実績報告の流れ</h3>
            {[
              {
                step: 1,
                title: '補助事業の実施',
                desc: '交付決定日以降に補助事業を実施します。すべての経費支出は2027年6月30日までに完了してください。',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                step: 2,
                title: '証憑書類の整理',
                desc: '領収書・請求書・振込明細をすべて保管。補助対象経費ごとに整理します。',
                color: 'bg-purple-100 text-purple-700',
              },
              {
                step: 3,
                title: '実績報告書類の作成',
                desc: '実績報告書（様式7）・経理書類一覧（様式8）等を作成します。',
                color: 'bg-amber-100 text-amber-700',
              },
              {
                step: 4,
                title: '電子申請システムで提出',
                desc: 'Jグランツから実績報告書類一式をアップロードして提出します。',
                color: 'bg-green-100 text-green-700',
              },
              {
                step: 5,
                title: '確定・補助金交付',
                desc: '審査後に補助金額が確定し、請求→補助金が振り込まれます。',
                color: 'bg-primary-100 text-primary-700',
              },
            ].map(item => (
              <div key={item.step} className="flex gap-3">
                <div className={`shrink-0 w-8 h-8 rounded-full ${item.color} flex items-center justify-center font-bold text-sm`}>
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Effect report */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-sm">
            <h3 className="font-semibold text-slate-700 mb-2">📈 事業効果報告書について</h3>
            <p className="text-slate-600">補助事業終了から1年後に、事業の効果・成果を報告する「事業効果報告書」の提出が必要です。</p>
          </div>
        </div>
      )}

      {section === 'docs' && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">必須書類の準備状況</span>
              <span className="text-sm font-bold text-primary-600">{checkedCount} / {totalRequired}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full progress-fill"
                style={{ width: `${(checkedCount / totalRequired) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {REPORT_DOCS.map(doc => (
              <label key={doc.id} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all bg-white ${
                checked[doc.id] ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={checked[doc.id] || false}
                  onChange={() => toggleCheck(doc.id)}
                  className="w-5 h-5 accent-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{doc.label}</span>
                    {doc.required && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">必須</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {section === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{height: '500px'}}>
          <Link
            href="/dashboard/chat?section=general"
            className="flex items-center justify-center h-full text-primary-600 font-medium hover:bg-primary-50 transition-colors"
          >
            💬 実績報告についてAIに相談する →
          </Link>
        </div>
      )}
    </div>
  )
}
