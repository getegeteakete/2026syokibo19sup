'use client'
import { useState, useEffect, useRef } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string; ts?: number }
type HData = Record<string, string>

const FIELD_LABELS: Record<string, string> = {
  companyName: '会社名・屋号', businessType: '業種', employeeCount: '従業員数',
  annualSales: '年間売上高', currentBusiness: '現在の事業内容', mainProducts: '主な商品・サービス',
  targetCustomers: 'ターゲット顧客', salesChannels: '販売チャネル', strengths: '強み・特徴',
  challenges: '課題・悩み', subsidyPurpose: '補助金で実現したいこと', plannedActivities: '取組内容',
  expectedEffects: '期待される効果', requestedAmount: '申請希望額', implementationPlan: '実施スケジュール',
}

const PROGRESS_FIELDS = ['companyName','businessType','employeeCount','currentBusiness','mainProducts',
  'targetCustomers','challenges','subsidyPurpose','plannedActivities','requestedAmount']

export default function HearingPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hearingData, setHearingData] = useState<HData>({})
  const [initialLoading, setInitialLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'data'>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const completionRate = Math.round(
    (PROGRESS_FIELDS.filter(f => hearingData[f]?.trim()).length / PROGRESS_FIELDS.length) * 100
  )

  // 初期ロード：既存ヒアリングデータ取得
  useEffect(() => {
    fetch('/api/hearing').then(r => r.json()).then(({ data }) => {
      if (data) setHearingData(data)
      setInitialLoading(false)
    }).catch(() => setInitialLoading(false))
  }, [])

  // 最初のメッセージ（AIから挨拶）
  useEffect(() => {
    if (initialLoading) return
    const hasData = Object.values(hearingData).some(v => v?.trim())
    const greeting = hasData
      ? `こんにちは！前回の続きからヒアリングを進めましょう。\n\nすでに「${Object.keys(hearingData).filter(k => hearingData[k]?.trim() && FIELD_LABELS[k]).map(k => FIELD_LABELS[k]).slice(0,3).join('・')}」などの情報をいただいています。\n\n引き続き、まだお聞きできていない情報を確認させてください。${hearingData.challenges ? '' : '\n\n現在の事業で感じている一番の課題や悩みを教えていただけますか？'}`
      : `こんにちは！小規模事業者持続化補助金の申請書作成のため、事業についていくつかお聞きします。\n\n会話形式で一つずつ確認していきますので、気軽にお答えください。\n\nまず、**会社名（または屋号）と業種**を教えていただけますか？`
    setMessages([{ role: 'assistant', content: greeting, ts: Date.now() }])
  }, [initialLoading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const newMessages: Msg[] = [...messages, { role: 'user', content: text, ts: Date.now() }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/hearing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          existingData: hearingData,
        }),
      })
      const json = await res.json()

      setMessages(prev => [...prev, { role: 'assistant', content: json.message || 'エラーが発生しました', ts: Date.now() }])

      // 抽出データがあればヒアリングデータに統合して自動保存
      if (json.extractedData) {
        const merged = { ...hearingData }
        for (const [k, v] of Object.entries(json.extractedData)) {
          if (v && String(v).trim() && String(v) !== 'null' && String(v) !== '...') {
            merged[k] = String(v)
          }
        }
        setHearingData(merged)
        // 自動保存
        await fetch('/api/hearing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '通信エラーが発生しました。もう一度お試しください。', ts: Date.now() }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const manualSave = async () => {
    try {
      await fetch('/api/hearing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hearingData),
      })
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // マークダウン的な太字を処理
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{ fontWeight: 700, color: '#1b3a28' }}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    )
  }

  const C = {
    page: { display:'flex' as const, flexDirection:'column' as const, height:'100vh', fontFamily:"'Noto Sans JP',sans-serif", background:'#f4f7f4' },
    header: { flexShrink:0, background:'#fff', borderBottom:'1px solid #e2ece5', padding:'14px 20px' },
    tabBar: { display:'flex', gap:'2px', padding:'0 20px', background:'#fff', borderBottom:'1px solid #e2ece5', flexShrink:0 },
    tab: (active: boolean) => ({ padding:'10px 16px', fontSize:'12px', fontWeight: active?700:500, cursor:'pointer', border:'none', borderBottom: active?'2px solid #2d6a4f':'2px solid transparent', background:'transparent', color: active?'#2d6a4f':'#8fa38f', fontFamily:"'Noto Sans JP',sans-serif", transition:'all .15s' }),
    chatArea: { flex:1, overflowY:'auto' as const, padding:'16px 20px', display:'flex', flexDirection:'column' as const, gap:'12px' },
    msgUser: { alignSelf:'flex-end' as const, maxWidth:'72%', background:'#2d6a4f', color:'#fff', padding:'11px 15px', borderRadius:'14px 14px 4px 14px', fontSize:'13px', lineHeight:1.7 },
    msgAI: { alignSelf:'flex-start' as const, maxWidth:'78%', background:'#fff', border:'1px solid #e2ece5', padding:'11px 15px', borderRadius:'14px 14px 14px 4px', fontSize:'13px', lineHeight:1.8, boxShadow:'0 1px 3px rgba(27,58,40,0.05)' },
    inputArea: { flexShrink:0, background:'#fff', borderTop:'1px solid #e2ece5', padding:'12px 16px', display:'flex', gap:'8px', alignItems:'flex-end' },
    textarea: { flex:1, background:'#f6fbf7', border:'1px solid #d5e8db', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', resize:'none' as const, outline:'none', fontFamily:"'Noto Sans JP',sans-serif", color:'#1b3a28', lineHeight:1.6, maxHeight:'120px' },
    sendBtn: (can: boolean) => ({ width:'40px', height:'40px', borderRadius:'10px', border:'none', cursor: can?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', background: can?'#2d6a4f':'#d5e8db', transition:'background .15s', flexShrink:0 }),
  }

  if (initialLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Noto Sans JP',sans-serif", color:'#7a8f80', fontSize:'13px' }}>
      <div>
        <div style={{ width:'32px', height:'32px', border:'3px solid #e2ece5', borderTopColor:'#2d6a4f', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }}/>
        読み込み中...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={C.page}>
      {/* Header */}
      <div style={C.header}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:'15px', fontWeight:700, color:'#1b3a28', margin:0 }}>ヒアリング</h1>
            <p style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>AIが会話形式で申請に必要な情報を収集します</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {saved && <span style={{ fontSize:'11px', color:'#52b788', fontWeight:600 }}>✅ 保存済み</span>}
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'10px', color:'#7a8f80' }}>収集率</div>
              <div style={{ fontSize:'20px', fontWeight:800, color: completionRate>=80?'#2d6a4f':completionRate>=50?'#b7791f':'#9aab9f', lineHeight:1 }}>{completionRate}%</div>
            </div>
            <div style={{ width:'48px', height:'48px', position:'relative' }}>
              <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)', width:'48px', height:'48px' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef3ef" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2d6a4f" strokeWidth="3"
                  strokeDasharray={`${completionRate} ${100-completionRate}`} strokeDashoffset="0" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={C.tabBar}>
        {[{ id:'chat', label:'AIインタビュー' }, { id:'data', label:`収集済みデータ（${Object.values(hearingData).filter(v=>v?.trim()).length}件）` }].map(t => (
          <button key={t.id} style={C.tab(activeTab===t.id)} onClick={() => setActiveTab(t.id as any)}>{t.label}</button>
        ))}
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <>
          <div style={C.chatArea}>
            {messages.map((m, i) => (
              <div key={i} style={m.role==='user' ? C.msgUser : C.msgAI}>
                {m.role === 'assistant' && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                    <div style={{ width:'20px', height:'20px', background:'#e8f5ee', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/>
                      </svg>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#2d6a4f' }}>補助金サポートAI</span>
                  </div>
                )}
                <div style={{ whiteSpace:'pre-wrap' }}>{renderText(m.content)}</div>
              </div>
            ))}

            {loading && (
              <div style={C.msgAI}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                  <div style={{ width:'20px', height:'20px', background:'#e8f5ee', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#2d6a4f' }}>補助金サポートAI</span>
                </div>
                <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#b7dfc4', animation:`bounce .9s ease-in-out ${i*0.2}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={C.inputArea}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
              onKeyDown={handleKeyDown}
              placeholder="回答を入力してください…（Enterで送信）"
              rows={1}
              style={C.textarea}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={!input.trim() || loading} style={C.sendBtn(!!input.trim() && !loading)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div style={{ textAlign:'center', fontSize:'10px', color:'#aabfb0', padding:'4px 0 8px', background:'#fff', borderTop:'none', flexShrink:0 }}>
            Shift+Enterで改行　／　回答内容は自動保存されます
          </div>
        </>
      )}

      {/* Data tab */}
      {activeTab === 'data' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #eef3ef' }}>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>収集済みヒアリングデータ</span>
              <button onClick={manualSave} style={{ padding:'6px 14px', background:'#2d6a4f', color:'#fff', border:'none', borderRadius:'7px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif" }}>
                {saved ? '✅ 保存済み' : '保存'}
              </button>
            </div>
            <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <div key={key} style={{ background: hearingData[key] ? '#f6fbf7' : '#fafafa', borderRadius:'8px', padding:'10px 12px', border:`1px solid ${hearingData[key] ? '#eef3ef' : '#f0f0f0'}`, gridColumn: ['currentBusiness','challenges','subsidyPurpose','plannedActivities','expectedEffects','implementationPlan'].includes(key) ? '1/-1' : 'auto' }}>
                  <p style={{ fontSize:'10px', color: hearingData[key] ? '#2d6a4f' : '#bbb', fontWeight:600, marginBottom:'4px' }}>
                    {hearingData[key] ? '✓ ' : '○ '}{label}
                  </p>
                  {hearingData[key]
                    ? <p style={{ fontSize:'13px', color:'#1b3a28', whiteSpace:'pre-wrap', lineHeight:1.6, margin:0 }}>{hearingData[key]}</p>
                    : <p style={{ fontSize:'12px', color:'#ccc', margin:0 }}>未収集</p>
                  }
                </div>
              ))}
            </div>
            {completionRate < 100 && (
              <div style={{ padding:'12px 20px', background:'#fef9e7', borderTop:'1px solid #f6d860' }}>
                <p style={{ fontSize:'12px', color:'#b7791f', margin:0 }}>
                  ⚠️ まだ {PROGRESS_FIELDS.filter(f => !hearingData[f]?.trim()).length} 項目が未収集です。AIインタビューで続きを進めてください。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-5px)}
        }
      `}</style>
    </div>
  )
}
