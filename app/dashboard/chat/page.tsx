'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

const SECTIONS = [
  { id: 'general', label: '総合相談', hint: '補助金全般の質問・相談',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { id: 'hearing', label: 'ヒアリング', hint: '事業計画のヒアリング',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg> },
  { id: 'document', label: '申請書作成', hint: 'ヒアリング結果から書類作成',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg> },
  { id: 'guide', label: '電子申請ガイド', hint: '画面操作・スクリーンショット対応',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
]

function ChatPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sectionId = searchParams.get('section') || 'general'
  const section = SECTIONS.find(s => s.id === sectionId) || SECTIONS[0]

  const placeholder =
    sectionId === 'guide' ? '画面のスクリーンショットを添付して質問できます...' :
    sectionId === 'document' ? 'ヒアリング内容をもとに申請書を作成します...' :
    '補助金について何でも聞いてください...'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:"'Noto Sans JP',sans-serif" }}>
      {/* Header */}
      <div style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid #e2ece5', padding:'16px 20px 0' }}>
        <h1 style={{ fontSize:'15px', fontWeight:700, color:'#1b3a28', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          AIアシスタント
        </h1>
        <div style={{ display:'flex', gap:'2px', overflowX:'auto', paddingBottom:'0' }}>
          {SECTIONS.map(s => {
            const active = s.id === sectionId
            return (
              <button key={s.id} onClick={() => router.push(`/dashboard/chat?section=${s.id}`)}
                style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:'6px',
                  padding:'8px 14px', fontSize:'12px', fontWeight: active ? 600 : 500,
                  cursor:'pointer', border:'none', borderBottom: active ? '2px solid #2d6a4f' : '2px solid transparent',
                  background: active ? '#f0faf4' : 'transparent',
                  color: active ? '#2d6a4f' : '#8fa38f',
                  borderRadius:'6px 6px 0 0',
                  fontFamily:"'Noto Sans JP',sans-serif",
                  transition:'all 0.15s',
                }}>
                <span style={{ color: active ? '#2d6a4f' : '#aabfb0' }}>{s.icon}</span>
                {s.label}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize:'11px', color:'#74c69d', padding:'6px 4px', display:'flex', alignItems:'center', gap:'5px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#52b788' }}/>
          {section.label} — {section.hint}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, overflow:'hidden' }}>
        <ChatInterface
          section={sectionId}
          sectionTitle={section.label}
          systemHint={section.hint}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#7a8f80', fontFamily:"'Noto Sans JP',sans-serif", fontSize:'13px' }}>
        読み込み中...
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
