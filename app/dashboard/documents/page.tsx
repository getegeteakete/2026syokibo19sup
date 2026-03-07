'use client'
import { useState } from 'react'
import { REQUIRED_DOCUMENTS } from '@/lib/constants'

const DOCS = [
  {
    id: 'gbiz_id',
    label: 'GビズIDプライム取得',
    required: true,
    urgent: true,
    description: '電子申請に必須。取得に2〜3週間かかるため早めに！',
    link: 'https://gbiz-id.go.jp/top/',
    linkLabel: 'GビズIDサイトへ',
    steps: ['法人番号（または個人事業主は住所・氏名等）を準備', 'GビズIDサイトにアクセス', 'プライムアカウント申請（書類送付方式）', '審査完了後、ログイン確認'],
  },
  {
    id: 'shien_keikaku',
    label: '事業支援計画書（様式4）',
    required: true,
    urgent: true,
    description: '商工会議所が発行する書類。4月16日締切のため最優先！',
    link: null,
    steps: ['最寄りの商工会議所に連絡', '面談日を予約（持参書類を確認）', '面談・事業計画を説明', '様式4を受領'],
  },
  {
    id: 'keiei_keikaku',
    label: '経営計画書（様式2）',
    required: true,
    urgent: false,
    description: '自社の概要・現在の経営状況・経営方針を記載',
    link: 'https://r6.jizokukahojokin.info/',
    linkLabel: '公式サイトで様式ダウンロード',
    steps: ['公式サイトから様式をダウンロード', '会社概要・事業内容を記入', '現状分析・課題を記入', '経営方針・目標を記入'],
  },
  {
    id: 'hojo_jigyou',
    label: '補助事業計画書（様式3-1、3-2）',
    required: true,
    urgent: false,
    description: '補助事業の内容・経費明細を記載',
    steps: ['公式サイトから様式をダウンロード', '補助事業の概要を記入', '経費明細を記入', '資金調達方法を記入'],
  },
  {
    id: 'kakutei_shinkoku',
    label: '直近の確定申告書の写し',
    required: true,
    urgent: false,
    description: '個人：白色・青色申告書、法人：法人税申告書',
    steps: ['税務署または電子申告データから取得', '直近1期分（法人）または1年分（個人）', '全ページを準備'],
  },
  {
    id: 'bs_pl',
    label: '貸借対照表・損益計算書',
    required: false,
    urgent: false,
    description: '法人の場合：直近1期分を提出',
    steps: ['会計ソフト等から出力', '直近1期分を準備'],
  },
  {
    id: 'meibo',
    label: '従業員名簿',
    required: false,
    urgent: false,
    description: '常時使用する従業員がいる場合',
    steps: ['従業員の氏名・雇用形態・就労時間を記載', '様式は自由'],
  },
  {
    id: 'mitsumori',
    label: '見積書（50万円超の経費）',
    required: false,
    urgent: false,
    description: '採択後・交付決定前に提出。単価50万円超の経費は2社以上から取得',
    steps: ['採択後に業者へ見積依頼', '2社以上から取得', '交付決定申請時に提出'],
  },
]

export default function DocumentsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleCheck = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const required = DOCS.filter(d => d.required)
  const optional = DOCS.filter(d => !d.required)
  const checkedCount = required.filter(d => checked[d.id]).length

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">📂 必要書類チェックリスト</h1>
        <p className="text-slate-500 text-sm mt-0.5">必要書類の準備状況を確認できます</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">必須書類の準備状況</span>
          <span className="text-sm font-bold text-primary-600">{checkedCount} / {required.length}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full progress-fill"
            style={{ width: `${(checkedCount / required.length) * 100}%` }}
          />
        </div>
        {checkedCount === required.length && (
          <p className="text-green-600 text-sm font-medium mt-2">🎉 必須書類がすべて揃いました！</p>
        )}
      </div>

      {/* Urgent items */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <h3 className="font-semibold text-red-800 mb-3">🚨 最優先で対応が必要</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-red-100">
            <span className="text-red-500 text-lg mt-0.5">⚡</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">GビズIDプライムの取得</p>
              <p className="text-xs text-slate-500 mt-0.5">取得に2〜3週間かかります。今すぐ申請を！</p>
              <a href="https://gbiz-id.go.jp/top/" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium mt-1 hover:underline">
                → GビズIDサイトへ ↗
              </a>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-red-100">
            <span className="text-amber-500 text-lg mt-0.5">🏢</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">商工会議所への連絡（様式4）</p>
              <p className="text-xs text-slate-500 mt-0.5">受付締切：<strong className="text-red-600">2026年4月16日</strong>。面談の予約が必要です。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Required docs */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3">📌 必須書類</h2>
        <div className="space-y-2">
          {required.map(doc => (
            <div key={doc.id} className={`bg-white rounded-2xl border transition-all ${
              checked[doc.id] ? 'border-green-300 bg-green-50' : 'border-slate-200'
            } shadow-sm overflow-hidden`}>
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
              >
                <input
                  type="checkbox"
                  checked={checked[doc.id] || false}
                  onChange={() => toggleCheck(doc.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-5 h-5 accent-green-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{doc.label}</span>
                    {doc.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">急ぎ</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                </div>
                <span className="text-slate-400 text-sm">{expandedId === doc.id ? '▲' : '▼'}</span>
              </div>

              {expandedId === doc.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-600 mt-3 mb-2">準備ステップ：</p>
                  <div className="space-y-1.5">
                    {doc.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                  {doc.link && (
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                    >
                      {doc.linkLabel} ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optional docs */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3">📎 提出が必要な場合がある書類</h2>
        <div className="space-y-2">
          {optional.map(doc => (
            <div key={doc.id} className={`bg-white rounded-2xl border transition-all ${
              checked[doc.id] ? 'border-green-300 bg-green-50' : 'border-slate-200'
            } shadow-sm`}>
              <div className="flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={checked[doc.id] || false}
                  onChange={() => toggleCheck(doc.id)}
                  className="w-5 h-5 accent-green-500 cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{doc.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
