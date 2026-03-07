'use client'
import { useState, useEffect } from 'react'
import { HEARING_SECTIONS, REQUIREMENT_CHECKS } from '@/lib/constants'

type HearingData = Record<string, string>

const TABS = [
  { id: 'requirement', label: '申請要件チェック' },
  { id: 'company', label: '会社情報' },
  { id: 'current_business', label: '現在の事業' },
  { id: 'subsidy_plan', label: '補助事業計画' },
  { id: 'amount', label: '補助額シミュレーション' },
]

export default function HearingPage() {
  const [activeTab, setActiveTab] = useState('requirement')
  const [data, setData] = useState<HearingData>({})
  const [requirements, setRequirements] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [completionRate, setCompletionRate] = useState(0)

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
    } finally { setSaving(false) }
  }

  const requestedAmount = parseInt(data.requestedAmount?.replace(/[^0-9]/g, '') || '0')
  const subsidyAmount = Math.min(Math.floor(requestedAmount * (2 / 3)), 500000)
  const ownBurden = requestedAmount - subsidyAmount
  const allRequirementsMet = REQUIREMENT_CHECKS.every(r => requirements[r.id])
  const requirementCount = REQUIREMENT_CHECKS.filter(r => requirements[r.id]).length

  return (
    <div className="dash-page" style={{ fontFamily:"'Noto Sans JP',sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 className="dash-h1">ヒアリング・事業計画</h1>
          <p className="dash-subtitle">申請書類作成のための情報収集</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'10px', color:'#7a8f80', marginBottom:'1px' }}>記入率</div>
            <div style={{ fontSize:'22px', fontWeight:800, color: completionRate>=80 ? '#2d6a4f' : completionRate>=50 ? '#b7791f' : '#9aab9f', lineHeight:1 }}>{completionRate}%</div>
          </div>
          <button className={`dash-btn-primary${saved?' dash-btn-saved':''}`} onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : saved ? '✅ 保存済み' : '保存'}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height:'5px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden', marginBottom:'20px' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#2d6a4f,#52b788)', width:`${completionRate}%`, transition:'width .6s', borderRadius:'10px' }}/>
      </div>

      {/* Tabs */}
      <div className="dash-tab-bar">
        {TABS.map(tab => (
          <button key={tab.id} className={`dash-tab${activeTab===tab.id?' active':''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requirement check */}
      {activeTab === 'requirement' && (
        <div className="dash-card" style={{ marginBottom:'16px' }}>
          <div className="dash-card-header">
            <span>申請要件チェックリスト</span>
            <span className={`dash-badge ${allRequirementsMet ? 'dash-badge-green' : 'dash-badge-amber'}`}>
              {requirementCount} / {REQUIREMENT_CHECKS.length} 確認済み
            </span>
          </div>
          <div style={{ padding:'16px 20px' }}>
            {!allRequirementsMet && (
              <div style={{ background:'#fef9e7', border:'1px solid #f6d860', borderRadius:'7px', padding:'10px 14px', fontSize:'12px', color:'#b7791f', marginBottom:'14px' }}>
                ⚠️ すべての要件を満たしていることを確認してから申請に進んでください。
              </div>
            )}
            {allRequirementsMet && (
              <div style={{ background:'#e8f5ee', border:'1px solid #b7dfc4', borderRadius:'7px', padding:'10px 14px', fontSize:'12px', color:'#2d6a4f', marginBottom:'14px' }}>
                ✅ 申請要件をすべて確認しました！次のステップに進めます。
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {REQUIREMENT_CHECKS.map(req => (
                <label key={req.id} style={{
                  display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px',
                  borderRadius:'8px', border:'1px solid', cursor:'pointer',
                  background: requirements[req.id] ? '#e8f5ee' : '#f6fbf7',
                  borderColor: requirements[req.id] ? '#b7dfc4' : '#e2ece5',
                }}>
                  <input type="checkbox" checked={requirements[req.id]||false}
                    onChange={e => handleRequirementChange(req.id, e.target.checked)}
                    style={{ marginTop:'2px', width:'15px', height:'15px', accentColor:'#2d6a4f', flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#1b3a28', margin:0 }}>{req.label}</p>
                    {(req as any).description && <p style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>{(req as any).description}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form sections */}
      {HEARING_SECTIONS.map((section: any) => activeTab === section.id && (
        <div key={section.id} className="dash-card" style={{ marginBottom:'16px' }}>
          <div className="dash-card-header">{section.title}</div>
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {section.questions.map((q: any) => (
              <div key={q.id} style={{ gridColumn: q.type==='textarea' ? '1/-1' : 'auto' }}>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#3d5c47', marginBottom:'4px' }}>
                  {q.label}{q.required && <span style={{ color:'#e74c3c', marginLeft:'3px' }}>*</span>}
                </label>
                {q.type === 'textarea' ? (
                  <textarea value={data[q.id]||''} onChange={e => handleChange(q.id, e.target.value)}
                    rows={3} placeholder={q.label} className="dash-input" style={{ resize:'vertical', lineHeight:1.6 }} />
                ) : q.type === 'select' ? (
                  <select value={data[q.id]||''} onChange={e => handleChange(q.id, e.target.value)} className="dash-input">
                    <option value="">選択してください</option>
                    {q.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type="text" value={data[q.id]||''} onChange={e => handleChange(q.id, e.target.value)}
                    placeholder={q.label} className="dash-input" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Amount simulation */}
      {activeTab === 'amount' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div className="dash-card">
            <div className="dash-card-header">補助額シミュレーション</div>
            <div style={{ padding:'16px 20px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#3d5c47', marginBottom:'5px' }}>
                補助対象経費の合計見込み額（円）
              </label>
              <input type="text" value={data.requestedAmount||''} onChange={e => handleChange('requestedAmount', e.target.value)}
                placeholder="例: 750000" className="dash-input" style={{ marginBottom:'14px' }} />
              {requestedAmount > 0 && (
                <div style={{ background:'linear-gradient(135deg,#e8f5ee,#f0faf4)', border:'1px solid #b7dfc4', borderRadius:'10px', padding:'20px' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'#1b3a28', textAlign:'center', marginBottom:'16px' }}>試算結果</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', textAlign:'center' }}>
                    {[
                      { label:'補助対象経費', value:`${requestedAmount.toLocaleString()}円`, bg:'#fff', color:'#1b3a28' },
                      { label:'補助金額（2/3）', value:`${subsidyAmount.toLocaleString()}円`, bg:'#2d6a4f', color:'#fff', note: requestedAmount>750000?'上限50万円適用':undefined },
                      { label:'自己負担額', value:`${ownBurden.toLocaleString()}円`, bg:'#fff', color:'#b7791f' },
                    ].map(c => (
                      <div key={c.label} style={{ background:c.bg, borderRadius:'8px', padding:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
                        <p style={{ fontSize:'10px', opacity:.7, marginBottom:'4px', color:c.color }}>{c.label}</p>
                        <p style={{ fontSize:'16px', fontWeight:800, color:c.color, lineHeight:1 }}>{c.value}</p>
                        {c.note && <p style={{ fontSize:'10px', opacity:.7, marginTop:'3px', color:c.color }}>{c.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-header">補助対象となる経費</div>
            <div style={{ padding:'14px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
              {['広告費（チラシ・HP制作等）','展示会等出展費','旅費','開発費','資料購入費','雑役務費','借料','設備処分費','委託費','外注費'].map(e => (
                <div key={e} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 8px', background:'#f6fbf7', borderRadius:'6px', fontSize:'12px', color:'#1b3a28' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'4px' }}>
        <button className={`dash-btn-primary${saved?' dash-btn-saved':''}`} onClick={handleSave} disabled={saving} style={{ padding:'10px 28px', fontSize:'13px' }}>
          {saving ? '保存中...' : saved ? '✅ 保存済み' : '保存する'}
        </button>
      </div>
    </div>
  )
}
