import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'

// next/fontでセルフホスト化 → レンダーブロッキングを排除
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],  // 3ウェイトに絞る（旧: 5ウェイト）
  display: 'swap',
  variable: '--font-noto',
  preload: false,  // 日本語は全量preloadしない
})

export const metadata: Metadata = {
  title: '小規模補助金サポートシステム | 第19回',
  description: '小規模事業者持続化補助金 申請・管理サポートシステム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body style={{ fontFamily: 'var(--font-noto), sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
