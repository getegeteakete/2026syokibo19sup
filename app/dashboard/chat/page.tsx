'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

const SECTIONS = [
  { id: 'general', label: '総合相談', icon: '💬', hint: '補助金全般の質問・相談' },
  { id: 'hearing', label: 'ヒアリング', icon: '📝', hint: '事業計画のヒアリング' },
  { id: 'document', label: '申請書作成', icon: '✏️', hint: 'ヒアリング結果から書類作成' },
  { id: 'guide', label: '電子申請ガイド', icon: '🖥️', hint: '画面操作・スクリーンショット対応' },
]

function ChatPageContent() {
  const searchParams = useSearchParams()
  const sectionId = searchParams.get('section') || 'general'
  const section = SECTIONS.find(s => s.id === sectionId) || SECTIONS[0]

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh)]">
      {/* Section tabs */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 pt-4 pb-0">
        <h1 className="text-base font-bold text-slate-800 mb-3">🤖 AIアシスタント</h1>
        <div className="flex gap-1 overflow-x-auto pb-0">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`/dashboard/chat?section=${s.id}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-sm font-medium border-b-2 transition-colors ${
                s.id === sectionId
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          section={sectionId}
          sectionTitle={section.label}
          systemHint={section.hint}
          placeholder={
            sectionId === 'guide'
              ? '画面のスクリーンショットを添付して質問できます...'
              : sectionId === 'document'
              ? 'ヒアリング内容をもとに申請書を作成します...'
              : '補助金について何でも聞いてください...'
          }
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">読み込み中...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
