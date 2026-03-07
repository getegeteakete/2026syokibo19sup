'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { SessionUser } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ホーム', exact: true,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { href: '/dashboard/chat', label: 'AIチャット',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { href: '/dashboard/hearing', label: 'ヒアリング',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: '/dashboard/documents', label: '必要書類',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
  { href: '/dashboard/smart-schedule', label: 'スケジュール',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { href: '/dashboard/simulation', label: '申請シミュレーション',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { href: '/dashboard/reports', label: '実績報告',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { href: '/dashboard/data', label: 'データ確認',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
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

  return (
    <>
      <style>{`
        .dnav {
          display: flex;
          flex-direction: column;
          width: 210px;
          min-width: 210px;
          height: 100%;
          background: #1b3a28;
          font-family: 'Noto Sans JP', sans-serif;
          flex-shrink: 0;
        }
        .dnav-logo {
          padding: 20px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dnav-logo-mark {
          width: 32px;
          height: 32px;
          background: #2d6a4f;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          flex-shrink: 0;
        }
        .dnav-user {
          margin: 10px 12px 4px;
          background: rgba(45,106,79,0.4);
          border: 1px solid rgba(116,198,157,0.15);
          border-radius: 6px;
          padding: 7px 10px;
        }
        .dnav-section {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 16px 6px;
        }
        .dnav-nav {
          flex: 1;
          padding: 2px 8px;
          overflow-y: auto;
        }
        .dnav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          margin-bottom: 2px;
          transition: all 0.15s;
          cursor: pointer;
        }
        .dnav-link:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
        }
        .dnav-link.active {
          background: #2d6a4f;
          color: #d8f3e8;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .dnav-link .nav-icon { color: rgba(255,255,255,0.3); flex-shrink: 0; }
        .dnav-link:hover .nav-icon { color: rgba(255,255,255,0.6); }
        .dnav-link.active .nav-icon { color: #74c69d; }
        .dnav-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 12px; }
        .dnav-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          margin: 4px 0;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.3);
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Noto Sans JP', sans-serif;
          transition: all 0.15s;
        }
        .dnav-logout:hover { background: rgba(255,80,80,0.12); color: #ff9999; }
        .dnav-mobile-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 52px;
          background: #1b3a28;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .dnav-hamburger {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dnav-hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 2px;
        }
        .dnav-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: flex;
        }
        .dnav-drawer {
          width: 210px;
          height: 100%;
          margin-top: 52px;
        }
        .dnav-backdrop {
          flex: 1;
          background: rgba(0,0,0,0.5);
        }
        @media (min-width: 768px) {
          .dnav-mobile-header { display: none; }
          .dnav-mobile-spacer { display: none; }
        }
        @media (max-width: 767px) {
          .dnav-desktop { display: none; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="dnav-desktop dnav">
        <div className="dnav-logo">
          <div className="dnav-logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74c69d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#eaf6ee', lineHeight:1.3 }}>補助金サポート</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'1px' }}>第19回 一般型</div>
          </div>
        </div>

        <div className="dnav-user">
          <div style={{ fontSize:'11px', fontWeight:600, color:'#74c69d', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {session.companyName || session.username}
          </div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'1px' }}>顧客ポータル</div>
        </div>

        <div className="dnav-section">メニュー</div>

        <nav className="dnav-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={`dnav-link${isActive(item) ? ' active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="dnav-divider" />
        <div style={{ padding:'4px 8px 8px' }}>
          <button className="dnav-logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            ログアウト
          </button>
        </div>
      </aside>

      {/* Mobile */}
      <div>
        <div className="dnav-mobile-header">
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div className="dnav-logo-mark" style={{ width:'26px', height:'26px', borderRadius:'6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#74c69d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontSize:'13px', fontWeight:700, color:'#eaf6ee' }}>補助金サポート</span>
          </div>
          <button className="dnav-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            <span/><span/><span/>
          </button>
        </div>
        <div className="dnav-mobile-spacer" style={{ height:'52px' }} />

        {mobileOpen && (
          <div className="dnav-overlay">
            <div className="dnav-drawer">
              <div className="dnav" style={{ width:'210px' }}>
                <div className="dnav-logo">
                  <div className="dnav-logo-mark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74c69d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#eaf6ee' }}>補助金サポート</div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>第19回 一般型</div>
                  </div>
                </div>
                <div className="dnav-user">
                  <div style={{ fontSize:'11px', fontWeight:600, color:'#74c69d' }}>{session.companyName || session.username}</div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>顧客ポータル</div>
                </div>
                <div className="dnav-section">メニュー</div>
                <nav className="dnav-nav">
                  {NAV_ITEMS.map(item => (
                    <Link key={item.href} href={item.href}
                      className={`dnav-link${isActive(item) ? ' active' : ''}`}
                      onClick={() => setMobileOpen(false)}>
                      <span className="nav-icon">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="dnav-divider" />
                <div style={{ padding:'4px 8px 8px' }}>
                  <button className="dnav-logout" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
            <div className="dnav-backdrop" onClick={() => setMobileOpen(false)} />
          </div>
        )}
      </div>
    </>
  )
}
