import { prisma } from '@/lib/db'
import { STAGES } from '@/lib/constants'
import Link from 'next/link'

const S = {
  page: {padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", minHeight:'100vh'},
  header: {marginBottom:'24px'},
  h1: {fontSize:'20px', fontWeight:700, color:'#1b3a28', letterSpacing:'-0.01em'},
  sub: {fontSize:'12px', color:'#6b7c70', marginTop:'3px'},
  grid4: {display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'20px'},
  card: {background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', padding:'18px 20px', boxShadow:'0 1px 4px rgba(27,58,40,0.05)'},
  statIcon: {width:'36px', height:'36px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px'},
  statVal: {fontSize:'26px', fontWeight:800, color:'#1b3a28', lineHeight:1},
  statLabel: {fontSize:'11px', color:'#7a8f80', marginTop:'4px'},
  sectionCard: {background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', boxShadow:'0 1px 4px rgba(27,58,40,0.05)', marginBottom:'20px', overflow:'hidden'},
  sectionHeader: {display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eef3ef'},
  sectionTitle: {fontSize:'14px', fontWeight:700, color:'#1b3a28'},
  badge: {fontSize:'11px', padding:'3px 10px', borderRadius:'20px', fontWeight:600},
  row: {display:'flex', alignItems:'center', gap:'14px', padding:'13px 20px', borderBottom:'1px solid #f2f7f3', textDecoration:'none'},
  avatar: {width:'34px', height:'34px', borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#2d6a4f', flexShrink:0},
}

export default async function AdminPage() {
  let users: any[] = []
  let settings: any = null
  let totalTokens = 0

  try {
    users = await prisma.user.findMany({
      where: { role: 'customer' },
      include: {
        hearingData: { select: { completionRate: true } },
        applicationStatus: { select: { stage: true, adopted: true, electronicFiled: true } },
        tokenUsage: { select: { inputTokens: true, outputTokens: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    settings = await prisma.systemSettings.findFirst()
    totalTokens = users.reduce((sum, u) => sum + u.tokenUsage.reduce((s: number, t: any) => s + t.inputTokens + t.outputTokens, 0), 0)
  } catch {}

  const stats = {
    total: users.length,
    hearing: users.filter(u => (u.hearingData?.completionRate || 0) > 50).length,
    electronic: users.filter(u => u.applicationStatus?.electronicFiled).length,
    adopted: users.filter(u => u.applicationStatus?.adopted).length,
  }

  const statCards = [
    { label:'登録顧客数', value:stats.total, bg:'#e8f5ee', iconColor:'#2d6a4f',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label:'ヒアリング50%+', value:stats.hearing, bg:'#fef9e7', iconColor:'#b7791f',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { label:'電子申請済み', value:stats.electronic, bg:'#e8f0fe', iconColor:'#3b5bdb',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label:'採択済み', value:stats.adopted, bg:'#fde8f5', iconColor:'#9c27b0',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  ]

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.h1}>ダッシュボード</h1>
        <p style={S.sub}>小規模事業者持続化補助金 第19回 — 顧客サポート管理</p>
      </div>

      {/* Stat cards */}
      <div style={S.grid4}>
        {statCards.map(s => (
          <div key={s.label} style={S.card}>
            <div style={{...S.statIcon, background:s.bg}}>
              <span style={{color:s.iconColor}}>{s.icon}</span>
            </div>
            <div style={S.statVal}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Token bar */}
      <div style={{...S.sectionCard, marginBottom:'20px'}}>
        <div style={S.sectionHeader}>
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span style={S.sectionTitle}>AI トークン使用状況</span>
          </div>
          <Link href="/admin/tokens" style={{fontSize:'12px', color:'#2d6a4f', fontWeight:600, textDecoration:'none'}}>詳細を見る →</Link>
        </div>
        <div style={{padding:'16px 20px'}}>
          <div style={{display:'flex', alignItems:'flex-end', gap:'6px', marginBottom:'8px'}}>
            <span style={{fontSize:'28px', fontWeight:800, color:'#1b3a28', lineHeight:1}}>{totalTokens.toLocaleString()}</span>
            <span style={{fontSize:'12px', color:'#6b7c70', paddingBottom:'3px'}}>/ {(settings?.globalTokenLimit || 1000000).toLocaleString()} トークン</span>
          </div>
          <div style={{height:'6px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden'}}>
            <div style={{height:'100%', borderRadius:'10px', background:'linear-gradient(90deg,#2d6a4f,#52b788)', width:`${Math.min((totalTokens/(settings?.globalTokenLimit||1000000))*100,100)}%`, transition:'width 0.6s'}}/>
          </div>
          <p style={{fontSize:'11px', color:'#9aab9f', marginTop:'5px'}}>グローバル上限の {((totalTokens/(settings?.globalTokenLimit||1000000))*100).toFixed(1)}% 使用中</p>
        </div>
      </div>

      {/* Customer list */}
      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <span style={S.sectionTitle}>顧客一覧</span>
            <span style={{...S.badge, background:'#e8f5ee', color:'#2d6a4f'}}>{users.length}件</span>
          </div>
          <Link href="/admin/users" style={{display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:600, color:'#fff', background:'#2d6a4f', padding:'6px 14px', borderRadius:'7px', textDecoration:'none'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新規追加
          </Link>
        </div>
        <div>
          {users.length === 0 && (
            <div style={{padding:'48px 20px', textAlign:'center', color:'#9aab9f'}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 10px', display:'block', opacity:0.4}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p style={{fontSize:'13px'}}>まだ顧客が登録されていません</p>
            </div>
          )}
          {users.map((user, idx) => {
            const stage = user.applicationStatus?.stage || 'requirement_check'
            const stageObj = STAGES.find((s: any) => s.id === stage)
            const tokens = user.tokenUsage.reduce((s: number, t: any) => s + t.inputTokens + t.outputTokens, 0)
            const rate = user.hearingData?.completionRate || 0
            const isLast = idx === users.length - 1

            return (
              <Link key={user.id} href={`/admin/customer/${user.id}`} style={{
                ...S.row, borderBottom: isLast ? 'none' : '1px solid #f2f7f3',
              }}>
                <div style={S.avatar}>{(user.companyName || user.username).slice(0,1)}</div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:'13px', fontWeight:600, color:'#1b3a28', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{user.companyName || user.username}</p>
                  <p style={{fontSize:'11px', color:'#8fa38f', marginTop:'1px'}}>@{user.username}</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'20px', flexShrink:0}}>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:'10px', color:'#9aab9f', marginBottom:'2px'}}>記入率</p>
                    <p style={{fontSize:'13px', fontWeight:700, color: rate>=80?'#2d6a4f':rate>=50?'#b7791f':'#9aab9f'}}>{rate}%</p>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:'10px', color:'#9aab9f', marginBottom:'2px'}}>トークン</p>
                    <p style={{fontSize:'12px', fontWeight:600, color:'#4a5f4e'}}>{tokens.toLocaleString()}</p>
                  </div>
                  <span style={{
                    fontSize:'11px', padding:'3px 9px', borderRadius:'20px', fontWeight:600, flexShrink:0,
                    background: user.applicationStatus?.adopted ? '#e8f5ee' : user.applicationStatus?.electronicFiled ? '#e8f0fe' : '#f4f7f4',
                    color: user.applicationStatus?.adopted ? '#2d6a4f' : user.applicationStatus?.electronicFiled ? '#3b5bdb' : '#7a8f80',
                  }}>
                    {stageObj?.label?.slice(0,6) || '未設定'}
                  </span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c5d4c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
