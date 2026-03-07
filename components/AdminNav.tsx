'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'ダッシュボード', icon: '📊', exact: true },
  { href: '/admin/users', label: '顧客管理', icon: '👥' },
  { href: '/admin/tokens', label: 'トークン管理', icon: '🔢' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-52 bg-slate-900 shrink-0 h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center text-white text-lg shadow">
            ⚙️
          </div>
          <div>
            <p className="font-bold text-white text-sm">管理者パネル</p>
            <p className="text-xs text-slate-400">補助金サポート</p>
          </div>
        </div>
      </div>

      <div className="p-3 text-xs text-slate-400 bg-slate-800/50 mx-3 mt-3 rounded-lg">
        🔐 管理者モード
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <span>🚪</span>
          ログアウト
        </button>
      </div>
    </aside>
  )
}
