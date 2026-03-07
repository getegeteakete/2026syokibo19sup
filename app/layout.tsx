import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '小規模補助金サポートシステム | 第19回',
  description: '小規模事業者持続化補助金 申請・管理サポートシステム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Noto Sans JP', sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
