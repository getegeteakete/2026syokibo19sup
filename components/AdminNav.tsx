'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  {
    href: '/admin', label: 'ダッシュボード', exact: true,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  },
  {
    href: '/admin/users', label: '顧客管理',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  {
    href: '/admin/tokens', label: 'トークン管理',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside style={{
      display:'flex', flexDirection:'column', width:'200px', minWidth:'200px',
      height:'100%', background:'#1b3a28', fontFamily:"'Noto Sans JP',sans-serif",
    }}>
      {/* Logo */}
      <div style={{padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'32px', height:'32px', background:'#2d6a4f', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.25)', flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74c69d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:'12px', fontWeight:700, color:'#eaf6ee', lineHeight:1.3}}>管理者パネル</div>
            <div style={{fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'1px'}}>補助金サポート</div>
          </div>
        </div>
      </div>

      {/* Admin badge */}
      <div style={{margin:'10px 12px 4px', background:'rgba(45,106,79,0.4)', border:'1px solid rgba(116,198,157,0.15)', borderRadius:'5px', padding:'4px 10px', display:'inline-flex', alignItems:'center', gap:'6px'}}>
        <div style={{width:'5px', height:'5px', borderRadius:'50%', background:'#52b788'}}/>
        <span style={{fontSize:'10px', color:'#74c69d', letterSpacing:'0.08em', fontWeight:600}}>ADMIN MODE</span>
      </div>

      {/* Section label */}
      <div style={{fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'12px 16px 6px'}}>メニュー</div>

      {/* Nav */}
      <nav style={{flex:1, padding:'2px 8px', overflowY:'auto'}}>
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'9px 12px', borderRadius:'7px',
              fontSize:'13px', fontWeight: active ? 600 : 500,
              color: active ? '#d8f3e8' : 'rgba(255,255,255,0.5)',
              textDecoration:'none', marginBottom:'2px',
              background: active ? '#2d6a4f' : 'transparent',
              boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition:'all 0.15s',
            }}>
              <span style={{color: active ? '#74c69d' : 'rgba(255,255,255,0.3)', flexShrink:0}}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{height:'1px', background:'rgba(255,255,255,0.07)', margin:'0 12px'}}/>

      {/* Logout */}
      <div style={{padding:'8px'}}>
        <button onClick={handleLogout} style={{
          display:'flex', alignItems:'center', gap:'10px', width:'100%',
          padding:'9px 12px', borderRadius:'7px', fontSize:'13px', fontWeight:500,
          color:'rgba(255,255,255,0.3)', background:'none', border:'none',
          cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif", transition:'all 0.15s',
        }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,80,80,0.1)';e.currentTarget.style.color='#ff9999'}}
        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,0.3)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          ログアウト
        </button>
      </div>
    </aside>
  )
}
