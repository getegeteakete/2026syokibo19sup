'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { SessionUser } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ホーム', icon: '🏠', exact: true },
  { href: '/dashboard/chat', label: 'AIチャット', icon: '💬' },
  { href: '/dashboard/hearing', label: 'ヒアリング', icon: '📝' },
  { href: '/dashboard/documents', label: '必要書類', icon: '📂' },
  { href: '/dashboard/smart-schedule', label: 'スケジュール', icon: '📅' },
  { href: '/dashboard/simulation', label: '申請シミュレーション', icon: '🖥️' },
  { href: '/dashboard/reports', label: '実績報告', icon: '📊' },
  { href: '/dashboard/data', label: 'データ確認', icon: '🔍' },
]

export default function DashboardNav({ session }: { session: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md shadow-primary-600/30">
            📋
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">補助金サポート</p>
            <p className="text-xs text-slate-500">第19回 一般型</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="mx-3 mt-3 mb-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
        <p className="text-xs text-primary-600 font-medium">{session.companyName || session.username}</p>
        <p className="text-xs text-slate-500 mt-0.5">顧客ポータル</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive(item)
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span>
          ログアウト
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 shrink-0 h-full">
        <NavContent />
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden">
        {/* Mobile header bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span className="font-bold text-sm text-slate-800">補助金サポート</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            <div className={`w-5 flex flex-col gap-1 transition-all ${mobileOpen ? 'gap-0' : ''}`}>
              <span className={`block h-0.5 bg-slate-600 transition-all ${mobileOpen ? 'rotate-45 translate-y-0.5' : ''}`} />
              <span className={`block h-0.5 bg-slate-600 transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-slate-600 transition-all ${mobileOpen ? '-rotate-45 -translate-y-0.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 flex">
            <div className="w-64 bg-white h-full flex flex-col border-r border-slate-200 shadow-2xl mt-14">
              <NavContent />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Spacer for fixed header */}
        <div className="h-14" />
      </div>
    </>
  )
}
