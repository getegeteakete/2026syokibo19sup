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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      // Build history for API (last 10 messages)
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

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
        setMessages(prev => [...prev, {
          id: Date.now().toString() + 'a',
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }])
        if (data.usage) setTokenInfo(data.usage)
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
  }, [input, imageFile, imagePreview, loading, messages, section])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

  const tokenPercent = tokenInfo ? Math.min((tokenInfo.totalUsed / tokenInfo.limit) * 100, 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-slate-700">{sectionTitle}</span>
          {systemHint && <span className="text-xs text-slate-400 hidden sm:block">— {systemHint}</span>}
        </div>
        {tokenInfo && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
              <span>トークン: {tokenInfo.totalUsed.toLocaleString()} / {tokenInfo.limit.toLocaleString()}</span>
            </div>
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${tokenPercent > 80 ? 'bg-red-400' : tokenPercent > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {initialLoading && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="typing-dot w-2 h-2 rounded-full bg-slate-300" />
              ))}
            </div>
          </div>
        )}

        {!initialLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">🤖</div>
            <p className="text-slate-600 font-medium mb-2">AIアシスタント</p>
            <p className="text-slate-400 text-sm max-w-sm">
              {sectionTitle}について何でもお気軽にご質問ください。<br/>
              補助金申請をしっかりサポートします。
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {msg.role === 'user' ? '私' : '🤖'}
            </div>

            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="添付画像" className="max-w-xs rounded-xl border border-slate-200 shadow-sm" />
              )}
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-tr-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-md shadow-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div
                    className="prose-chat"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">🤖</div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="typing-dot w-2 h-2 rounded-full bg-slate-300" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        {imagePreview && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-xl">
            <img src={imagePreview} alt="preview" className="w-12 h-12 object-cover rounded-lg" />
            <span className="text-xs text-slate-500 flex-1">{imageFile?.name}</span>
            <button onClick={removeImage} className="text-slate-400 hover:text-red-500 transition-colors text-lg">×</button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-lg"
            title="画像を添付（申請画面のスクリーンショット等）"
          >
            📷
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all min-h-[40px] max-h-[120px]"
          />

          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !imageFile) || loading}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary-500 hover:bg-primary-400 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-primary-500/30 disabled:shadow-none"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 px-1">Enterで送信 / Shift+Enterで改行 / 📷で画像添付</p>
      </div>
    </div>
  )
}
