'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string; ts?: number }
type HData = Record<string, string>

// ============================================================
// Web Speech API 型定義
// ============================================================
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean
  start(): void; stop(): void; abort(): void
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

// ============================================================
// データ定義
// ============================================================
const FIELD_LABELS: Record<string, string> = {
  companyName: '会社名・屋号', businessType: '業種', employeeCount: '従業員数',
  annualSales: '年間売上高', currentBusiness: '現在の事業内容', mainProducts: '主な商品・サービス',
  targetCustomers: 'ターゲット顧客', salesChannels: '販売チャネル', strengths: '強み・特徴',
  challenges: '課題・悩み', subsidyPurpose: '補助金で実現したいこと', plannedActivities: '取組内容',
  expectedEffects: '期待される効果', requestedAmount: '申請希望額', implementationPlan: '実施スケジュール',
}
const PROGRESS_FIELDS = [
  'companyName','businessType','employeeCount','currentBusiness','mainProducts',
  'targetCustomers','challenges','subsidyPurpose','plannedActivities','requestedAmount',
]

// ============================================================
// TTS ユーティリティ
// ============================================================
let currentUtterance: SpeechSynthesisUtterance | null = null

function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

function speakJapanese(text: string, rate: number, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  stopSpeaking()

  // マークダウン・記号を除去
  const plain = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s/gm, '')
    .replace(/^[-*]\s/gm, '')
    .replace(/\n+/g, '。')
    .replace(/[【】「」『』]/g, '')
    .slice(0, 600)

  const utter = new SpeechSynthesisUtterance(plain)
  utter.lang = 'ja-JP'
  utter.rate = rate        // 0.7〜2.0
  utter.pitch = 1.25       // 高め = 女性らしい
  utter.volume = 1.0

  // 日本語女性ボイスを優先選択
  const voices = window.speechSynthesis.getVoices()
  const femaleJa = voices.find(v => v.lang === 'ja-JP' && /female|kyoko|haruka|hana|ren|女|woman/i.test(v.name))
    || voices.find(v => v.lang === 'ja-JP' && v.localService)
    || voices.find(v => v.lang === 'ja-JP')
    || voices.find(v => v.lang.startsWith('ja'))
  if (femaleJa) utter.voice = femaleJa

  if (onEnd) utter.onend = onEnd
  utter.onerror = () => { currentUtterance = null; onEnd?.() }
  currentUtterance = utter
  window.speechSynthesis.speak(utter)
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function HearingPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hearingData, setHearingData] = useState<HData>({})
  const [initialLoading, setInitialLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'data'>('chat')

  // 音声関連
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)   // デフォルトON
  const [speechRate, setSpeechRate] = useState(1.1)  // 速度 デフォルト
  const [voiceReady, setVoiceReady] = useState(false)
  const [showSpeedPanel, setShowSpeedPanel] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const completionRate = Math.round(
    (PROGRESS_FIELDS.filter(f => hearingData[f]?.trim()).length / PROGRESS_FIELDS.length) * 100
  )

  // ブラウザ音声サポート確認
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR || window.speechSynthesis) setVoiceReady(true)
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  // 初期ロード
  useEffect(() => {
    fetch('/api/hearing').then(r => r.json()).then(({ data }) => {
      if (data) setHearingData(data)
      setInitialLoading(false)
    }).catch(() => setInitialLoading(false))
  }, [])

  // 最初の挨拶
  useEffect(() => {
    if (initialLoading) return
    const hasData = Object.values(hearingData).some(v => v?.trim())
    const greeting = hasData
      ? `こんにちは！前回の続きから進めましょう。\n\nすでに「${Object.keys(hearingData).filter(k => hearingData[k]?.trim() && FIELD_LABELS[k]).map(k => FIELD_LABELS[k]).slice(0, 3).join('・')}」などの情報をいただいています。\n\n${hearingData.challenges ? '引き続き、補助事業の内容を詳しく聞かせてください。\n\n今回の補助金でどんな取り組みを行う予定ですか？' : '現在の事業で一番の課題や悩みを教えてください。'}`
      : `こんにちは！小規模事業者持続化補助金の申請書作成のため、事業についてお聞きします。\n\n一問一答で進めますので、気軽にお答えください！\n\nまず、**会社名（または屋号）**を教えていただけますか？`

    const firstMsg: Msg = { role: 'assistant', content: greeting, ts: Date.now() }
    setMessages([firstMsg])

    // 挨拶を読み上げ
    if (autoSpeak) {
      setTimeout(() => {
        setIsSpeaking(true)
        speakJapanese(greeting, speechRate, () => setIsSpeaking(false))
      }, 500)
    }
  }, [initialLoading]) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ============================================================
  // 音声入力（STT）
  // ============================================================
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    stopSpeaking()
    setIsSpeaking(false)

    const rec = new SR()
    rec.lang = 'ja-JP'
    rec.continuous = true
    rec.interimResults = true

    rec.onstart = () => setIsRecording(true)
    rec.onend = () => setIsRecording(false)
    rec.onerror = () => setIsRecording(false)
    rec.onresult = (e) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else setInput(e.results[i][0].transcript) // 中間表示
      }
      if (final) setInput(prev => (prev.replace(/[^。、\n]*$/, '') + final).trimStart())
    }
    rec.start()
    recognitionRef.current = rec
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
  }, [])

  // ============================================================
  // メッセージ送信
  // ============================================================
  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (isRecording) stopRecording()
    stopSpeaking()
    setIsSpeaking(false)
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
      const aiText = json.message || 'エラーが発生しました'
      const newMsg: Msg = { role: 'assistant', content: aiText, ts: Date.now() }
      setMessages(prev => [...prev, newMsg])

      // 自動保存
      if (json.extractedData) {
        const merged = { ...hearingData }
        for (const [k, v] of Object.entries(json.extractedData)) {
          if (v && String(v).trim() && String(v) !== 'null' && String(v) !== '...') {
            merged[k] = String(v)
          }
        }
        setHearingData(merged)
        try {
          await fetch('/api/hearing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(merged),
          })
        } catch {}
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }

      // AI回答を読み上げ
      if (autoSpeak) {
        setIsSpeaking(true)
        speakJapanese(aiText, speechRate, () => setIsSpeaking(false))
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '通信エラーが発生しました。もう一度お試しください。', ts: Date.now() }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const manualSave = async () => {
    try {
      await fetch('/api/hearing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hearingData) })
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{ fontWeight:700, color:'#1b3a28' }}>{p.slice(2,-2)}</strong>
        : <span key={i}>{p}</span>
    )

  // ============================================================
  // スピード選択肢
  // ============================================================
  const SPEED_OPTIONS = [
    { label: 'ゆっくり', value: 0.8 },
    { label: '普通', value: 1.0 },
    { label: '少し速め', value: 1.1 },
    { label: '速い', value: 1.3 },
    { label: 'かなり速い', value: 1.6 },
  ]

  // ============================================================
  // スタイル
  // ============================================================
  const C = {
    page: { display:'flex' as const, flexDirection:'column' as const, height:'100vh', fontFamily:"'Noto Sans JP',sans-serif", background:'#f4f7f4' },
    header: { flexShrink:0, background:'#fff', borderBottom:'1px solid #e2ece5', padding:'12px 20px' },
    tabBar: { display:'flex', gap:'2px', padding:'0 20px', background:'#fff', borderBottom:'1px solid #e2ece5', flexShrink:0 },
    tab: (a:boolean) => ({ padding:'9px 14px', fontSize:'12px', fontWeight:a?700:500, cursor:'pointer', border:'none', borderBottom: a?'2px solid #2d6a4f':'2px solid transparent', background:'transparent', color:a?'#2d6a4f':'#8fa38f', fontFamily:"'Noto Sans JP',sans-serif", transition:'all .15s' }),
    chatArea: { flex:1, overflowY:'auto' as const, padding:'16px 20px', display:'flex', flexDirection:'column' as const, gap:'12px' },
    msgUser: { alignSelf:'flex-end' as const, maxWidth:'72%', background:'#2d6a4f', color:'#fff', padding:'11px 15px', borderRadius:'14px 14px 4px 14px', fontSize:'13px', lineHeight:1.7 },
    msgAI: { alignSelf:'flex-start' as const, maxWidth:'80%', background:'#fff', border:'1px solid #e2ece5', padding:'11px 15px', borderRadius:'14px 14px 14px 4px', fontSize:'13px', lineHeight:1.8, boxShadow:'0 1px 3px rgba(27,58,40,0.05)' },
  }

  if (initialLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Noto Sans JP',sans-serif", color:'#7a8f80', fontSize:'13px' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'32px', height:'32px', border:'3px solid #e2ece5', borderTopColor:'#2d6a4f', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }}/>
        読み込み中...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={C.page}>
      {/* ヘッダー */}
      <div style={C.header}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:'15px', fontWeight:700, color:'#1b3a28', margin:0 }}>ヒアリング</h1>
            <p style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>AIが一問一答で申請に必要な情報を収集します</p>
          </div>

          {/* 右側コントロール群 */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {saved && <span style={{ fontSize:'11px', color:'#52b788', fontWeight:600 }}>✅ 保存</span>}

            {/* 読み上げON/OFFトグル */}
            {voiceReady && (
              <button
                onClick={() => {
                  const next = !autoSpeak
                  setAutoSpeak(next)
                  if (!next) { stopSpeaking(); setIsSpeaking(false) }
                }}
                style={{
                  display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px',
                  borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:600,
                  background: autoSpeak ? '#e8f5ee' : '#f0f0f0',
                  color: autoSpeak ? '#2d6a4f' : '#9aab9f',
                  transition:'all .15s',
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                {autoSpeak ? '読み上げON' : '読み上げOFF'}
              </button>
            )}

            {/* 速度ボタン（パネル開閉） */}
            {voiceReady && autoSpeak && (
              <div style={{ position:'relative' }}>
                <button
                  onClick={() => setShowSpeedPanel(p => !p)}
                  style={{
                    display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px',
                    borderRadius:'20px', border:'1px solid #d5e8db', cursor:'pointer',
                    fontSize:'11px', fontWeight:600, background:'#fff', color:'#2d6a4f',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {SPEED_OPTIONS.find(s => s.value === speechRate)?.label ?? '速度'}
                </button>
                {showSpeedPanel && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 6px)', right:0, background:'#fff',
                    border:'1px solid #e2ece5', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
                    padding:'8px', zIndex:100, minWidth:'130px',
                  }}>
                    <p style={{ fontSize:'10px', color:'#9aab9f', fontWeight:700, margin:'0 4px 6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>話す速さ</p>
                    {SPEED_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => { setSpeechRate(opt.value); setShowSpeedPanel(false) }}
                        style={{
                          display:'block', width:'100%', textAlign:'left', padding:'7px 10px',
                          borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'12px',
                          fontFamily:"'Noto Sans JP',sans-serif", fontWeight: speechRate===opt.value ? 700 : 400,
                          background: speechRate===opt.value ? '#e8f5ee' : 'transparent',
                          color: speechRate===opt.value ? '#2d6a4f' : '#1b3a28',
                        }}>
                        {speechRate===opt.value && '✓ '}{opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 収集率 */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ position:'relative', width:'44px', height:'44px' }}>
                <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)', width:'44px', height:'44px' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#eef3ef" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#2d6a4f" strokeWidth="3"
                    strokeDasharray={`${completionRate * 0.88} ${100}`} strokeLinecap="round"/>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#2d6a4f' }}>
                  {completionRate}%
                </div>
              </div>
              <span style={{ fontSize:'9px', color:'#9aab9f', marginTop:'1px' }}>収集率</span>
            </div>
          </div>
        </div>
      </div>

      {/* 読み上げ中バナー */}
      {isSpeaking && (
        <div style={{
          flexShrink:0, background:'#f0faf4', borderBottom:'1px solid #b7e4c7',
          padding:'7px 20px', display:'flex', alignItems:'center', gap:'10px',
        }}>
          {/* 波形アニメーション */}
          <div style={{ display:'flex', gap:'3px', alignItems:'center' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:'3px', borderRadius:'2px', background:'#2d6a4f', animation:`wave 0.8s ease-in-out ${i*0.15}s infinite` }}/>
            ))}
          </div>
          <span style={{ fontSize:'12px', color:'#2d6a4f', fontWeight:600 }}>AIが読み上げ中...</span>
          <button onClick={() => { stopSpeaking(); setIsSpeaking(false) }}
            style={{ marginLeft:'auto', fontSize:'11px', color:'#52b788', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:"'Noto Sans JP',sans-serif" }}>
            ■ 停止
          </button>
        </div>
      )}

      {/* タブバー */}
      <div style={C.tabBar}>
        {[
          { id:'chat', label:'AIインタビュー' },
          { id:'data', label:`収集済みデータ（${Object.values(hearingData).filter(v=>v?.trim()).length}件）` },
        ].map(t => (
          <button key={t.id} style={C.tab(activeTab===t.id)} onClick={() => setActiveTab(t.id as 'chat'|'data')}>{t.label}</button>
        ))}
      </div>

      {/* ── チャットタブ ── */}
      {activeTab === 'chat' && (
        <>
          <div style={C.chatArea} onClick={() => setShowSpeedPanel(false)}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column' }}>
                {m.role === 'assistant' && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px', alignSelf:'flex-start' }}>
                    <div style={{ width:'22px', height:'22px', background:'#e8f5ee', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/>
                      </svg>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#2d6a4f' }}>補助金サポートAI</span>
                    {/* 手動読み上げボタン */}
                    {voiceReady && (
                      <button
                        onClick={() => {
                          if (isSpeaking) { stopSpeaking(); setIsSpeaking(false) }
                          else { setIsSpeaking(true); speakJapanese(m.content, speechRate, () => setIsSpeaking(false)) }
                        }}
                        title="このメッセージを読み上げ"
                        style={{ width:'20px', height:'20px', borderRadius:'50%', border:'none', cursor:'pointer', background:'transparent', color:'#b0bfb5', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                <div style={m.role==='user' ? C.msgUser : C.msgAI}>
                  <div style={{ whiteSpace:'pre-wrap' }}>{renderText(m.content)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
                  <div style={{ width:'22px', height:'22px', background:'#e8f5ee', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#2d6a4f' }}>補助金サポートAI</span>
                </div>
                <div style={C.msgAI}>
                  <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#b7dfc4', animation:`bounce .9s ease-in-out ${i*0.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* 録音中バナー */}
          {isRecording && (
            <div style={{
              flexShrink:0, background:'#fff5f5', borderTop:'1px solid #fca5a5',
              padding:'7px 20px', display:'flex', alignItems:'center', gap:'10px',
            }}>
              <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#e74c3c', animation:'pulse 1s infinite' }}/>
              <span style={{ fontSize:'12px', color:'#e74c3c', fontWeight:600 }}>録音中... 話し終わったらマイクボタンを押してください</span>
            </div>
          )}

          {/* 入力エリア */}
          <div style={{ flexShrink:0, background:'#fff', borderTop:'1px solid #e2ece5', padding:'10px 14px', display:'flex', gap:'8px', alignItems:'flex-end' }}>
            {/* マイクボタン */}
            {voiceReady && (
              <button
                onClick={() => { if (isRecording) stopRecording(); else startRecording() }}
                title={isRecording ? '録音停止' : '音声入力'}
                style={{
                  flexShrink:0, width:'42px', height:'42px', borderRadius:'12px', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s',
                  background: isRecording ? '#e74c3c' : '#e8f5ee',
                  color: isRecording ? '#fff' : '#2d6a4f',
                  boxShadow: isRecording ? '0 0 0 5px rgba(231,76,60,0.2)' : 'none',
                }}>
                {isRecording ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? '🎤 話しかけてください...' : '回答を入力… (Enterで送信)'}
              rows={1}
              disabled={loading}
              style={{
                flex:1, background: isRecording ? '#fff8f8' : '#f6fbf7',
                border:`1px solid ${isRecording ? '#fca5a5' : '#d5e8db'}`,
                borderRadius:'10px', padding:'10px 14px', fontSize:'13px', resize:'none',
                outline:'none', fontFamily:"'Noto Sans JP',sans-serif", color:'#1b3a28',
                lineHeight:1.6, maxHeight:'120px', transition:'all .15s',
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                flexShrink:0, width:'42px', height:'42px', borderRadius:'12px', border:'none',
                cursor: input.trim()&&!loading ? 'pointer' : 'default',
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
                background: input.trim()&&!loading ? '#2d6a4f' : '#d5e8db',
                boxShadow: input.trim()&&!loading ? '0 2px 8px rgba(45,106,79,0.35)' : 'none',
              }}>
              {loading ? (
                <span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'block', animation:'spin .8s linear infinite' }}/>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>

          <div style={{ textAlign:'center', fontSize:'10px', color:'#b0bfb5', padding:'4px 0 8px', background:'#fff', flexShrink:0 }}>
            {voiceReady ? '🎤 マイクで音声入力　／　🔊 AI回答を読み上げ　／　Shift+Enter改行' : 'Shift+Enterで改行 ／ 回答は自動保存'}
          </div>
        </>
      )}

      {/* ── データタブ ── */}
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
                <div key={key} style={{
                  background: hearingData[key] ? '#f6fbf7' : '#fafafa',
                  borderRadius:'8px', padding:'10px 12px',
                  border:`1px solid ${hearingData[key] ? '#eef3ef' : '#f0f0f0'}`,
                  gridColumn: ['currentBusiness','challenges','subsidyPurpose','plannedActivities','expectedEffects','implementationPlan'].includes(key) ? '1/-1' : 'auto',
                }}>
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
                  ⚠️ あと {PROGRESS_FIELDS.filter(f => !hearingData[f]?.trim()).length} 項目が未収集です。AIインタビューで続きを進めてください。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave {
          0%,100% { height: 6px }
          50% { height: 18px }
        }
      `}</style>
    </div>
  )
}
