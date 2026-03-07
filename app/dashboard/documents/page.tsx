'use client'
import { useState, useEffect } from 'react'

type GenStatus = 'idle' | 'loading' | 'done' | 'error'

const INDUSTRY_OPTIONS = [
  '飲食業', '小売業', '製造業', '建設業', 'サービス業', '美容・理容業',
  '医療・介護', '宿泊業', 'IT・情報通信', '農業・林業・水産業', 'その他'
]

const REQUIRED_DOCS = [
  { id: 'style4', label: '様式4 事業支援計画書', required: true, hint: '商工会議所から受け取るPDF', category: '必須' },
  { id: 'kakutei', label: '確定申告書（直近1期分）', required: true, hint: '個人:白色/青色申告書、法人:法人税申告書', category: '必須' },
  { id: 'gbizid', label: 'GビズIDプライム', required: true, hint: '電子申請に必要。未取得の場合は早急に申請を', category: '必須' },
  { id: 'meibo', label: '従業員名簿', required: false, hint: '常時使用する従業員がいる場合', category: '条件付き' },
  { id: 'invoice', label: 'インボイス登録通知書', required: false, hint: 'インボイス特例を申請する場合', category: '条件付き' },
  { id: 'wage', label: '賃金台帳の写し', required: false, hint: '賃金引上げ特例を申請する場合', category: '条件付き' },
]

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'checklist'>('generate')
  const [industry, setIndustry] = useState('')
  const [form2Status, setForm2Status] = useState<GenStatus>('idle')
  const [form3Status, setForm3Status] = useState<GenStatus>('idle')
  const [form2Doc, setForm2Doc] = useState('')
  const [form3Doc, setForm3Doc] = useState('')
  const [completionRate, setCompletionRate] = useState(0)
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})
  const [aiGenerateEnabled, setAiGenerateEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/hearing').then(r => r.json()).then(({ data, aiGenerateEnabled }) => {
      setAiGenerateEnabled(aiGenerateEnabled ?? false)
      if (data) {
        setCompletionRate(data.completionRate || 0)
        setIndustry(data.businessType || '')
        if (data.applicationDraft) {
          try {
            const draft = JSON.parse(data.applicationDraft)
            if (draft.form2) setForm2Doc(draft.form2)
            if (draft.form3) setForm3Doc(draft.form3)
            if (draft.form2 || draft.form3) {
              setForm2Status(draft.form2 ? 'done' : 'idle')
              setForm3Status(draft.form3 ? 'done' : 'idle')
            }
          } catch {}
        }
      }
    }).catch(() => {})
  }, [])

  const generate = async (type: 'form2' | 'form3') => {
    if (type === 'form2') setForm2Status('loading')
    else setForm3Status('loading')

    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, industry }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      if (type === 'form2') { setForm2Doc(json.document); setForm2Status('done') }
      else { setForm3Doc(json.document); setForm3Status('done') }
    } catch (e) {
      if (type === 'form2') setForm2Status('error')
      else setForm3Status('error')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const C = {
    card: { background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', boxShadow:'0 1px 4px rgba(27,58,40,0.05)', marginBottom:'16px', overflow:'hidden' as const },
    cardHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #eef3ef' },
    tab: (a: boolean) => ({ padding:'10px 18px', fontSize:'12px', fontWeight:a?700:500, cursor:'pointer', border:'none', borderBottom:a?'2px solid #2d6a4f':'2px solid transparent', background:'transparent', color:a?'#2d6a4f':'#8fa38f', fontFamily:"'Noto Sans JP',sans-serif", transition:'all .15s' }),
    btn: (color='#2d6a4f', disabled=false) => ({ display:'inline-flex', alignItems:'center', gap:'7px', padding:'9px 20px', background:disabled?'#d5e8db':color, color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:disabled?'default':'pointer', fontFamily:"'Noto Sans JP',sans-serif", transition:'background .15s' }),
  }

  const FormCard = ({ type, title, desc, status, doc, aiEnabled }: { type:'form2'|'form3', title:string, desc:string, status:GenStatus, doc:string, aiEnabled:boolean }) => (
    <div style={C.card}>
      <div style={C.cardHeader}>
        <div>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1b3a28' }}>{title}</div>
          <div style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>{desc}</div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {status === 'done' && (
            <button onClick={() => copyToClipboard(doc)} style={{ ...C.btn('#3b5bdb'), fontSize:'12px', padding:'7px 14px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              コピー
            </button>
          )}
          {aiEnabled ? (
            <button
              onClick={() => generate(type)}
              disabled={status === 'loading' || completionRate < 30}
              style={C.btn(status==='done'?'#52b788':'#2d6a4f', status==='loading' || completionRate < 30)}
            >
              {status === 'loading' ? (
                <>
                  <div style={{ width:'12px', height:'12px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                  生成中...
                </>
              ) : status === 'done' ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  再生成
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
                  AIで生成
                </>
              )}
            </button>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'#f4f7f4', border:'1px solid #e2ece5', borderRadius:'8px', fontSize:'12px', color:'#9aab9f' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              担当者が許可後に利用可能
            </div>
          )}
        </div>
      </div>

      {completionRate < 30 && status === 'idle' && (
        <div style={{ padding:'14px 20px', background:'#fef9e7', borderBottom:'1px solid #f6d860', fontSize:'12px', color:'#b7791f' }}>
          ⚠️ ヒアリング収集率が {completionRate}% です。精度の高い計画書を生成するには、先にヒアリング（AIインタビュー）を進めてください。
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding:'14px 20px', background:'#fff2f2', fontSize:'12px', color:'#c0392b' }}>
          ❌ 生成中にエラーが発生しました。もう一度お試しください。
        </div>
      )}

      {status === 'loading' && (
        <div style={{ padding:'32px 20px', textAlign:'center' }}>
          <div style={{ width:'36px', height:'36px', border:'3px solid #e2ece5', borderTopColor:'#2d6a4f', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }}/>
          <div style={{ fontSize:'13px', color:'#7a8f80' }}>AIが計画書を作成中です...</div>
          <div style={{ fontSize:'11px', color:'#9aab9f', marginTop:'4px' }}>30秒〜1分ほどかかります</div>
        </div>
      )}

      {status === 'done' && doc && (
        <div style={{ padding:'20px', maxHeight:'500px', overflowY:'auto' }}>
          <div style={{ background:'#f6fbf7', border:'1px solid #e2ece5', borderRadius:'8px', padding:'16px 20px', fontSize:'13px', lineHeight:1.9, color:'#1b3a28', whiteSpace:'pre-wrap', fontFamily:"'Noto Sans JP',sans-serif" }}>
            {doc}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", maxWidth:'860px' }}>
      {/* Header */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1b3a28', margin:0 }}>申請書類作成</h1>
        <p style={{ fontSize:'12px', color:'#7a8f80', marginTop:'3px' }}>ヒアリング内容をもとにAIが申請書を自動生成します</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'2px', background:'#fff', border:'1px solid #e2ece5', borderRadius:'9px', padding:'3px', marginBottom:'20px' }}>
        <button style={C.tab(activeTab==='generate')} onClick={() => setActiveTab('generate')}>📝 計画書生成</button>
        <button style={C.tab(activeTab==='checklist')} onClick={() => setActiveTab('checklist')}>✅ 必要書類チェック</button>
      </div>

      {activeTab === 'generate' && (
        <>
          {/* Hearing rate warning */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#fff', border:'1px solid #e2ece5', borderRadius:'9px', marginBottom:'16px' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'12px', fontWeight:600, color:'#1b3a28' }}>ヒアリング収集率</span>
                <span style={{ fontSize:'12px', fontWeight:700, color: completionRate>=70?'#2d6a4f':completionRate>=40?'#b7791f':'#9aab9f' }}>{completionRate}%</span>
              </div>
              <div style={{ height:'5px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', background: completionRate>=70?'#52b788':completionRate>=40?'#f39c12':'#d5e8db', width:`${completionRate}%`, borderRadius:'10px', transition:'width .5s' }}/>
              </div>
            </div>
            {completionRate < 70 && (
              <a href="/dashboard/hearing" style={{ fontSize:'12px', color:'#2d6a4f', fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', padding:'6px 12px', background:'#e8f5ee', borderRadius:'7px' }}>
                ヒアリングへ →
              </a>
            )}
          </div>

          {/* Industry selector */}
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#3d5c47', marginBottom:'5px' }}>業種を選択（より精度が上がります）</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              style={{ background:'#f6fbf7', border:'1px solid #d5e8db', borderRadius:'7px', padding:'8px 12px', fontSize:'13px', color:'#1b3a28', outline:'none', width:'240px', fontFamily:"'Noto Sans JP',sans-serif" }}>
              <option value="">選択してください</option>
              {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <FormCard
            type="form2"
            title="様式2：経営計画書"
            desc="企業概要・市場動向・強み弱み・経営方針（全4章・約4000文字）"
            status={form2Status}
            doc={form2Doc}
            aiEnabled={aiGenerateEnabled}
          />

          <FormCard
            type="form3"
            title="様式3：補助事業計画書"
            desc="補助事業名・取組内容・業務効率化・効果試算（経費表・収支予測表付き）"
            status={form3Status}
            doc={form3Doc}
            aiEnabled={aiGenerateEnabled}
          />

          <div style={{ background:'#f6fbf7', border:'1px solid #e2ece5', borderRadius:'9px', padding:'14px 18px', fontSize:'12px', color:'#5a7060', lineHeight:1.8 }}>
            <strong style={{ color:'#2d6a4f' }}>💡 ご利用方法</strong><br/>
            ① ヒアリングページでAIインタビューを完了（収集率70%以上推奨）<br/>
            ② 上の業種を選択<br/>
            ③「AIで生成」ボタンで計画書を自動作成<br/>
            ④ 生成された文章を「コピー」してGビズIDの申請フォームに貼り付け
          </div>
        </>
      )}

      {activeTab === 'checklist' && (
        <div>
          {['必須', '条件付き'].map(cat => (
            <div key={cat} style={C.card}>
              <div style={C.cardHeader}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>
                  {cat === '必須' ? '🔴 必須書類' : '🟡 条件付き書類'}
                </span>
                <span style={{ fontSize:'11px', color:'#7a8f80' }}>
                  {cat === '必須' ? '全員が必ず用意' : '該当する場合のみ'}
                </span>
              </div>
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {REQUIRED_DOCS.filter(d => d.category === cat).map(doc => (
                  <label key={doc.id} style={{
                    display:'flex', alignItems:'flex-start', gap:'10px', padding:'11px 14px',
                    borderRadius:'8px', border:'1px solid', cursor:'pointer',
                    background: checkedDocs[doc.id] ? '#e8f5ee' : '#fafafa',
                    borderColor: checkedDocs[doc.id] ? '#b7dfc4' : '#eaeaea',
                  }}>
                    <input type="checkbox" checked={checkedDocs[doc.id]||false}
                      onChange={e => setCheckedDocs(prev => ({ ...prev, [doc.id]: e.target.checked }))}
                      style={{ width:'16px', height:'16px', marginTop:'1px', accentColor:'#2d6a4f', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:checkedDocs[doc.id]?'#2d6a4f':'#1b3a28' }}>
                        {checkedDocs[doc.id] ? '✓ ' : ''}{doc.label}
                      </div>
                      <div style={{ fontSize:'11px', color:'#8fa38f', marginTop:'2px' }}>{doc.hint}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div style={{ background:'#e8f0fe', border:'1px solid #c5d8f8', borderRadius:'9px', padding:'14px 18px', fontSize:'12px', color:'#1e3a8a' }}>
            <strong>📌 本番申請URL</strong><br/>
            <a href="https://www.jizokukanb.com/jizokuka_r6h/oubo.php" target="_blank" rel="noreferrer"
              style={{ color:'#2563eb', wordBreak:'break-all' }}>
              https://www.jizokukanb.com/jizokuka_r6h/oubo.php
            </a><br/>
            申請画面の「受付締切回」から「第19回」を選択してGビズIDでログインしてください。
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
