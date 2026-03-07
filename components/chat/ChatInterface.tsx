'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  timestamp: Date
}

interface ChatInterfaceProps {
  section: string
  sectionTitle: string
  systemHint?: string
  userId?: string
  initialMessages?: Message[]
  onSave?: (field: string, value: string) => void
  placeholder?: string
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-lg mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-1">$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/, '<ul class="list-disc pl-4 space-y-0.5 my-1">$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
}

// ============================================================
// 音声ユーティリティ
// ============================================================

// 日本語読み上げ
function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  // マークダウン記号を除去してプレーンテキスト化
  const plain = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s/gm, '')
    .replace(/^[-*]\s/gm, '')
    .replace(/\n+/g, '。')
    .slice(0, 500) // 長すぎる場合は切り詰め
  const utter = new SpeechSynthesisUtterance(plain)
  utter.lang = 'ja-JP'
  utter.rate = 1.05
  utter.pitch = 1.0
  // 日本語ボイスを優先的に使用
  const voices = window.speechSynthesis.getVoices()
  const jpVoice = voices.find(v => v.lang === 'ja-JP' && v.localService) ||
                  voices.find(v => v.lang === 'ja-JP') ||
                  voices.find(v => v.lang.startsWith('ja'))
  if (jpVoice) utter.voice = jpVoice
  if (onEnd) utter.onend = onEnd
  window.speechSynthesis.speak(utter)
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

// Web Speech API型定義
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export default function ChatInterface({
  section,
  sectionTitle,
  systemHint,
  userId,
  placeholder = 'メッセージを入力...',
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<{ totalUsed: number; limit: number } | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // 音声関連
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [voiceSupport, setVoiceSupport] = useState({ stt: false, tts: false })
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const interimRef = useRef('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ブラウザ音声サポートチェック
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setVoiceSupport({
      stt: !!SpeechRecognition,
      tts: !!window.speechSynthesis,
    })
    // ページ読み込み時にボイスリストをプリロード
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  // Load chat history
  useEffect(() => {
    const load = async () => {
      try {
        const url = userId
          ? `/api/chat?section=${section}&userId=${userId}`
          : `/api/chat?section=${section}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.messages) {
          setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
          })))
        }
      } catch {
        // ignore
      } finally {
        setInitialLoading(false)
      }
    }
    load()
  }, [section, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ============================================================
  // 音声入力（STT）
  // ============================================================
  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    stopSpeaking()

    const rec = new SpeechRecognition()
    rec.lang = 'ja-JP'
    rec.continuous = true
    rec.interimResults = true

    rec.onstart = () => setIsRecording(true)
    rec.onend = () => {
      setIsRecording(false)
      interimRef.current = ''
    }
    rec.onerror = () => {
      setIsRecording(false)
      interimRef.current = ''
    }
    rec.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      interimRef.current = interim
      if (final) {
        setInput(prev => (prev + final).trimStart())
      }
    }
    rec.start()
    recognitionRef.current = rec
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording()
  }, [isRecording, startRecording, stopRecording])

  // ============================================================
  // 読み上げ（TTS）
  // ============================================================
  const toggleSpeak = useCallback((msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking()
      setSpeakingMsgId(null)
      setIsSpeaking(false)
    } else {
      setSpeakingMsgId(msgId)
      setIsSpeaking(true)
      speakText(text, () => {
        setSpeakingMsgId(null)
        setIsSpeaking(false)
      })
    }
  }, [speakingMsgId])

  // ============================================================
  // メッセージ送信
  // ============================================================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !imageFile) || loading) return
    if (isRecording) stopRecording()
    stopSpeaking()
    setSpeakingMsgId(null)

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '（画像を送信）',
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    removeImage()
    setLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const formData = new FormData()
      formData.append('message', currentInput)
      formData.append('section', section)
      formData.append('history', JSON.stringify(history))
      if (imageFile) formData.append('image', imageFile)

      const res = await fetch('/api/chat', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + 'e',
          role: 'assistant',
          content: `⚠️ ${data.error}`,
          timestamp: new Date(),
        }])
      } else {
        const newMsg: Message = {
          id: Date.now().toString() + 'a',
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, newMsg])
        if (data.usage) setTokenInfo(data.usage)
        // 自動読み上げONの場合
        if (autoSpeak && voiceSupport.tts) {
          setSpeakingMsgId(newMsg.id)
          setIsSpeaking(true)
          speakText(data.message, () => {
            setSpeakingMsgId(null)
            setIsSpeaking(false)
          })
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: '⚠️ 通信エラーが発生しました。再度お試しください。',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, imageFile, imagePreview, loading, messages, section, isRecording, stopRecording, autoSpeak, voiceSupport.tts])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

  const tokenPercent = tokenInfo ? Math.min((tokenInfo.totalUsed / tokenInfo.limit) * 100, 100) : 0

  // ============================================================
  // スタイル定数
  // ============================================================
  const colors = {
    green: '#2d6a4f',
    greenLight: '#52b788',
    greenBg: '#e8f5ee',
    red: '#e74c3c',
    bg: '#f4f7f4',
    border: '#e2ece5',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:"'Noto Sans JP',sans-serif", background:colors.bg }}>

      {/* ヘッダー */}
      <div style={{ flexShrink:0, background:'#fff', borderBottom:`1px solid ${colors.border}`, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:colors.greenLight, boxShadow:`0 0 0 3px ${colors.greenBg}` }} />
          <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>{sectionTitle}</span>
          {systemHint && <span style={{ fontSize:'11px', color:'#9aab9f' }}>— {systemHint}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {/* 自動読み上げトグル */}
          {voiceSupport.tts && (
            <button
              onClick={() => { setAutoSpeak(p => !p); if (isSpeaking) { stopSpeaking(); setSpeakingMsgId(null); setIsSpeaking(false) } }}
              title={autoSpeak ? '自動読み上げ: ON（クリックでOFF）' : '自動読み上げ: OFF（クリックでON）'}
              style={{
                display:'flex', alignItems:'center', gap:'5px',
                padding:'4px 10px', borderRadius:'20px', border:'none', cursor:'pointer',
                fontSize:'11px', fontWeight:600, transition:'all 0.15s',
                background: autoSpeak ? colors.greenBg : '#f0f0f0',
                color: autoSpeak ? colors.green : '#9aab9f',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              {autoSpeak ? '自動読み上げON' : '自動読み上げOFF'}
            </button>
          )}
          {tokenInfo && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'11px', color:'#9aab9f' }}>{tokenInfo.totalUsed.toLocaleString()} / {tokenInfo.limit.toLocaleString()}</span>
              <div style={{ width:'60px', height:'4px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:'10px', background: tokenPercent > 80 ? colors.red : tokenPercent > 50 ? '#f39c12' : colors.greenLight, width:`${tokenPercent}%` }}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'16px', minHeight:0 }}>
        {initialLoading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'32px' }}>
            <div style={{ display:'flex', gap:'6px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#c0d4c8', animation:`bounce 1s ${i*0.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {!initialLoading && messages.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, textAlign:'center', padding:'32px' }}>
            <div style={{ width:'56px', height:'56px', background:colors.greenBg, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'16px' }}>🤖</div>
            <p style={{ fontSize:'14px', fontWeight:600, color:'#1b3a28', marginBottom:'6px' }}>AIアシスタント</p>
            <p style={{ fontSize:'12px', color:'#9aab9f', maxWidth:'280px', lineHeight:1.7 }}>
              {sectionTitle}について何でもお気軽にご質問ください。<br/>
              {voiceSupport.stt && '🎤 マイクボタンで音声入力も使えます。'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display:'flex', gap:'10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems:'flex-end' }}>
            {/* アバター */}
            <div style={{
              flexShrink:0, width:'32px', height:'32px', borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700,
              background: msg.role === 'user' ? colors.green : '#fff',
              border: msg.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
              color: msg.role === 'user' ? '#fff' : '#6b7c70',
            }}>
              {msg.role === 'user' ? '私' : '🤖'}
            </div>

            <div style={{ maxWidth:'78%', display:'flex', flexDirection:'column', gap:'4px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="添付画像" style={{ maxWidth:'200px', borderRadius:'12px', border:`1px solid ${colors.border}` }}/>
              )}
              <div style={{
                padding:'10px 14px', borderRadius:'16px', fontSize:'13px', lineHeight:1.7,
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                background: msg.role === 'user' ? colors.green : '#fff',
                color: msg.role === 'user' ? '#fff' : '#1b3a28',
                border: msg.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}/>
                ) : (
                  <p style={{ whiteSpace:'pre-wrap', margin:0 }}>{msg.content}</p>
                )}
              </div>

              {/* 時刻 + 読み上げボタン */}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', paddingLeft: msg.role === 'user' ? 0 : '4px', paddingRight: msg.role === 'user' ? '4px' : 0 }}>
                <span style={{ fontSize:'10px', color:'#b0bfb5' }}>{formatTime(msg.timestamp)}</span>
                {msg.role === 'assistant' && voiceSupport.tts && (
                  <button
                    onClick={() => toggleSpeak(msg.id, msg.content)}
                    title={speakingMsgId === msg.id ? '読み上げ停止' : 'このメッセージを読み上げ'}
                    style={{
                      width:'22px', height:'22px', borderRadius:'50%', border:'none', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background: speakingMsgId === msg.id ? colors.greenBg : 'transparent',
                      color: speakingMsgId === msg.id ? colors.green : '#c0ccc5',
                      transition:'all 0.15s',
                    }}>
                    {speakingMsgId === msg.id ? (
                      // 停止アイコン
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      // スピーカーアイコン
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#fff', border:`1px solid ${colors.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>🤖</div>
            <div style={{ background:'#fff', border:`1px solid ${colors.border}`, borderRadius:'16px', borderBottomLeftRadius:'4px', padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#c0d4c8', animation:`bounce 1s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 録音中インジケーター */}
      {isRecording && (
        <div style={{
          flexShrink:0, background:'#fff5f5', borderTop:`1px solid #fca5a5`,
          padding:'8px 16px', display:'flex', alignItems:'center', gap:'10px',
        }}>
          <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:colors.red, animation:'pulse 1s infinite' }}/>
          <span style={{ fontSize:'12px', color:colors.red, fontWeight:600 }}>録音中... 話し終わったらマイクボタンを押してください</span>
        </div>
      )}

      {/* 入力エリア */}
      <div style={{ flexShrink:0, borderTop:`1px solid ${colors.border}`, background:'#fff', padding:'12px' }}>
        {imagePreview && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', padding:'8px', background:colors.bg, borderRadius:'10px' }}>
            <img src={imagePreview} alt="preview" style={{ width:'44px', height:'44px', objectFit:'cover', borderRadius:'8px' }}/>
            <span style={{ fontSize:'11px', color:'#7a8f80', flex:1 }}>{imageFile?.name}</span>
            <button onClick={removeImage} style={{ background:'none', border:'none', cursor:'pointer', color:'#9aab9f', fontSize:'18px', lineHeight:1 }}>×</button>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'flex-end', gap:'8px' }}>
          {/* 画像添付ボタン */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display:'none' }}/>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="画像を添付"
            style={{ flexShrink:0, width:'40px', height:'40px', borderRadius:'12px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:colors.bg, color:'#7a8f80', fontSize:'18px', transition:'background 0.15s' }}>
            📷
          </button>

          {/* マイクボタン */}
          {voiceSupport.stt && (
            <button
              onClick={toggleRecording}
              title={isRecording ? '録音停止' : '音声入力開始'}
              style={{
                flexShrink:0, width:'40px', height:'40px', borderRadius:'12px', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s',
                background: isRecording ? colors.red : colors.bg,
                color: isRecording ? '#fff' : colors.green,
                boxShadow: isRecording ? `0 0 0 4px rgba(231,76,60,0.2)` : 'none',
              }}>
              {isRecording ? (
                // 録音停止アイコン
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              ) : (
                // マイクアイコン
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          )}

          {/* テキスト入力 */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? '🎤 話しかけてください...' : placeholder}
            rows={1}
            style={{
              flex:1, resize:'none', border:`1px solid ${colors.border}`, borderRadius:'12px',
              padding:'10px 14px', fontSize:'13px', color:'#1b3a28', background: isRecording ? '#fff8f8' : colors.bg,
              outline:'none', minHeight:'40px', maxHeight:'120px', fontFamily:"'Noto Sans JP',sans-serif",
              lineHeight:1.6, transition:'background 0.15s',
            }}
          />

          {/* 送信ボタン */}
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !imageFile) || loading}
            style={{
              flexShrink:0, width:'40px', height:'40px', borderRadius:'12px', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s',
              background: (!input.trim() && !imageFile) || loading ? '#e2ece5' : colors.green,
              color: (!input.trim() && !imageFile) || loading ? '#9aab9f' : '#fff',
              boxShadow: (!input.trim() && !imageFile) || loading ? 'none' : '0 2px 8px rgba(45,106,79,0.35)',
            }}>
            {loading ? (
              <span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'block', animation:'spin 0.8s linear infinite' }}/>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>

        {/* ヒント行 */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px', padding:'0 2px' }}>
          <p style={{ fontSize:'10px', color:'#b0bfb5', margin:0 }}>
            Enter送信 / Shift+Enter改行
            {voiceSupport.stt && ' / 🎤音声入力'}
            {voiceSupport.tts && ' / 🔊読み上げ'}
          </p>
          {isSpeaking && (
            <button
              onClick={() => { stopSpeaking(); setSpeakingMsgId(null); setIsSpeaking(false) }}
              style={{ fontSize:'10px', color:colors.green, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              🔊 読み上げ停止
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0) }
          40% { transform: translateY(-6px) }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        @keyframes pulse {
          0%,100% { opacity:1 } 50% { opacity:0.4 }
        }
        .prose-chat h1,.prose-chat h2,.prose-chat h3 { color:#1b3a28; font-weight:700; margin:8px 0 4px; }
        .prose-chat ul { list-style:disc; padding-left:16px; margin:4px 0; }
        .prose-chat li { margin:2px 0; }
        .prose-chat code { background:#f0faf4; color:#2d6a4f; padding:1px 5px; border-radius:4px; font-size:0.9em; }
        .prose-chat blockquote { border-left:3px solid #52b788; padding-left:10px; color:#6b7c70; }
        .prose-chat strong { color:#1b3a28; }
      `}</style>
    </div>
  )
}
