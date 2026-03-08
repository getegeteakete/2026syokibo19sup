'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { SessionUser } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/dashboard',             label: 'ホーム',           exact: true },
  { href: '/dashboard/chat',        label: 'AIチャット' },
  { href: '/dashboard/hearing',     label: 'ヒアリング' },
  { href: '/dashboard/documents',   label: '必要書類' },
  { href: '/dashboard/smart-schedule', label: 'スケジュール' },
  { href: '/dashboard/simulation',  label: '申請シミュレーション' },
  { href: '/dashboard/reports',     label: '実績報告' },
  { href: '/dashboard/data',        label: 'データ確認' },
]

export default function DashboardNav({ session }: { session: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div style={{
      display:'flex', flexDirection:'column', width:'200px', height:'100%',
      background:'#162d1f', fontFamily:"'Noto Sans JP',sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:'13px', fontWeight:800, color:'#c8e6d4', letterSpacing:'0.02em', lineHeight:1 }}>
          補助金サポート
        </div>
        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', marginTop:'5px', letterSpacing:'0.08em' }}>
          第19回 一般型 — 2026
        </div>
      </div>

      {/* User */}
      <div style={{ padding:'14px 20px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          fontSize:'11px', fontWeight:700, color:'#74c69d',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          letterSpacing:'0.01em',
        }}>
          {session.companyName || session.username}
        </div>
        <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', marginTop:'3px', letterSpacing:'0.1em' }}>
          顧客ポータル
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={item.href} href={item.href}
              onClick={onNavClick}
              style={{
                display:'block', padding:'9px 12px', borderRadius:'4px',
                fontSize:'12px', fontWeight: active ? 700 : 400,
                color: active ? '#d8f3e8' : 'rgba(255,255,255,0.38)',
                textDecoration:'none', marginBottom:'1px',
                borderLeft: active ? '2px solid #52b788' : '2px solid transparent',
                background: active ? 'rgba(82,183,136,0.1)' : 'transparent',
                letterSpacing:'0.01em',
                transition:'all 0.12s',
              }}>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding:'8px 10px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          style={{
            display:'block', width:'100%', textAlign:'left',
            padding:'9px 12px', borderRadius:'4px', border:'none',
            fontSize:'12px', fontWeight:400, color:'rgba(255,255,255,0.25)',
            background:'none', cursor:'pointer',
            fontFamily:"'Noto Sans JP',sans-serif",
            letterSpacing:'0.01em', transition:'all 0.12s',
          }}>
          ログアウト
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .dnav-mobile-header, .dnav-mobile-spacer { display: none !important; }
        }
        @media (max-width: 767px) {
          .dnav-desktop { display: none !important; }
        }
      `}</style>

      {/* Desktop */}
      <aside className="dnav-desktop" style={{ flexShrink:0 }}>
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="dnav-mobile-header" style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        height:'52px', background:'#162d1f',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', borderBottom:'1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize:'13px', fontWeight:800, color:'#c8e6d4', letterSpacing:'0.02em' }}>補助金サポート</span>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <button onClick={handleLogout} style={{
            padding:'5px 12px', background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.12)', borderRadius:'4px',
            cursor:'pointer', color:'rgba(255,255,255,0.55)', fontSize:'11px',
            fontFamily:"'Noto Sans JP',sans-serif",
          }}>ログアウト</button>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{
            background:'none', border:'none', cursor:'pointer', padding:'6px',
            display:'flex', flexDirection:'column', gap:'4px',
          }}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:'18px', height:'1.5px', background:'rgba(255,255,255,0.55)', borderRadius:'2px' }}/>)}
          </button>
        </div>
      </div>
      <div className="dnav-mobile-spacer" style={{ height:'52px' }} />

      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40, display:'flex' }}>
          <div style={{ marginTop:'52px' }}>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </div>
          <div style={{ flex:1, background:'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
