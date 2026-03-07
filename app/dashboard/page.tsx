import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { STAGES, SCHEDULE } from '@/lib/constants'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  let user: any = null
  let totalTokens = 0
  let tokenLimit = 50000

  try {
    user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { hearingData: true, applicationStatus: true }
    })
    const settings = await prisma.systemSettings.findFirst()
    tokenLimit = settings?.perUserTokenLimit || 50000
    const agg = await prisma.tokenUsage.aggregate({
      where: { userId: session.id },
      _sum: { inputTokens: true, outputTokens: true }
    })
    totalTokens = (agg._sum.inputTokens || 0) + (agg._sum.outputTokens || 0)
  } catch (_) {}

  const tokenPct = Math.min((totalTokens / tokenLimit) * 100, 100)
  const stage = user?.applicationStatus?.stage || 'requirement_check'
  const stageIndex = Math.max(0, STAGES.findIndex((s: any) => s.id === stage))
  const completionRate = user?.hearingData?.completionRate || 0
  const now = new Date()
  const daysToDeadline = Math.ceil((SCHEDULE.applicationDeadline.getTime() - now.getTime()) / 86400000)
  const daysToShokoukai = Math.ceil((SCHEDULE.shokoukaideadline.getTime() - now.getTime()) / 86400000)

  const cardStyle = { background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', boxShadow:'0 1px 4px rgba(27,58,40,0.05)' }

  const QUICK_ACTIONS = [
    { href:'/dashboard/chat', label:'AIに質問', desc:'何でも聞いてください', bg:'#e8f5ee', iconColor:'#2d6a4f',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href:'/dashboard/hearing', label:`ヒアリング ${completionRate}%`, desc:'事業情報を入力', bg:'#fef9e7', iconColor:'#b7791f',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { href:'/dashboard/documents', label:'必要書類', desc:'チェックリスト確認', bg:'#e8f0fe', iconColor:'#3b5bdb',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
    { href:'/dashboard/simulation', label:'申請シミュレーション', desc:'電子申請を練習', bg:'#f3e8ff', iconColor:'#7c3aed',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { href:'/dashboard/smart-schedule', label:'スケジュール', desc:'逆算タスク管理', bg:'#fff0f3', iconColor:'#be185d',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { href:'/dashboard/reports', label:'実績報告', desc:'採択後の手続き', bg:'#fef3c7', iconColor:'#92400e',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  ]

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", maxWidth:'900px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1b3a28', letterSpacing:'-0.01em', margin:0 }}>
            こんにちは、{user?.companyName || session.username}さん
          </h1>
          <p style={{ fontSize:'12px', color:'#6b7c70', marginTop:'4px' }}>
            申請締切まで
            <span style={{ fontWeight:700, color: daysToDeadline < 14 ? '#c0392b' : '#2d6a4f', margin:'0 3px' }}>{daysToDeadline}日</span>
            です
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'10px', color:'#9aab9f', marginBottom:'2px' }}>現在のステージ</div>
          <div style={{ fontSize:'12px', fontWeight:700, color:'#2d6a4f' }}>{(STAGES as any)[stageIndex]?.label || '―'}</div>
        </div>
      </div>

      {/* Deadline cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'20px' }}>
        {[
          { label:'電子申請締切', days: daysToDeadline, date:'2026年4月30日 17:00', urgent: daysToDeadline < 14 },
          { label:'様式4（商工会議所）締切', days: daysToShokoukai, date:'2026年4月16日', urgent: daysToShokoukai < 14 },
        ].map(d => (
          <div key={d.label} style={{ ...cardStyle, padding:'16px 20px', borderLeft:`3px solid ${d.urgent ? '#e74c3c' : '#2d6a4f'}` }}>
            <div style={{ fontSize:'11px', color:'#7a8f80', marginBottom:'4px' }}>{d.label}</div>
            <div style={{ fontSize:'28px', fontWeight:800, color: d.urgent ? '#c0392b' : '#1b3a28', lineHeight:1 }}>
              {d.days}<span style={{ fontSize:'13px', fontWeight:500, marginLeft:'3px', color:'#6b7c70' }}>日</span>
            </div>
            <div style={{ fontSize:'11px', color:'#9aab9f', marginTop:'3px' }}>{d.date}</div>
          </div>
        ))}
      </div>

      {/* キャッチコピー */}
      <div style={{ marginBottom:'12px', padding:'12px 16px', background:'linear-gradient(135deg,#1b3a28,#2d6a4f)', borderRadius:'10px', textAlign:'center' }}>
        <p style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#eaf6ee', letterSpacing:'0.02em', lineHeight:1.6 }}>
          AIを導入しないと生き残れない時代になりました。
        </p>
      </div>

      {/* Progress */}
      <div style={{ ...cardStyle, padding:'18px 20px', marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>申請進捗</span>
          <span style={{ fontSize:'11px', color:'#7a8f80' }}>ステップ {stageIndex + 1} / {STAGES.length}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height:'6px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#2d6a4f,#52b788)', borderRadius:'10px', width:`${((stageIndex+1)/STAGES.length)*100}%`, transition:'width 0.6s' }}/>
        </div>
        {/* Stage dots */}
        <div style={{ display:'flex', gap:'4px', overflowX:'auto', paddingBottom:'4px' }}>
          {(STAGES as any[]).map((s, i) => (
            <div key={s.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', flexShrink:0 }}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'11px', fontWeight:700, transition:'all 0.2s',
                background: i < stageIndex ? '#52b788' : i === stageIndex ? '#2d6a4f' : '#f4f7f4',
                color: i <= stageIndex ? '#fff' : '#9aab9f',
                border: `2px solid ${i < stageIndex ? '#52b788' : i === stageIndex ? '#2d6a4f' : '#e2ece5'}`,
                boxShadow: i === stageIndex ? '0 2px 8px rgba(45,106,79,0.3)' : 'none',
              }}>
                {i < stageIndex ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (i + 1)}
              </div>
              <span style={{ fontSize:'9px', color: i === stageIndex ? '#2d6a4f' : '#9aab9f', maxWidth:'40px', textAlign:'center', lineHeight:1.2, fontWeight: i === stageIndex ? 600 : 400 }}>
                {s.label.slice(0, 5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
        {QUICK_ACTIONS.map(item => (
          <Link key={item.href} href={item.href} style={{
            ...cardStyle, padding:'16px', textDecoration:'none', display:'block', transition:'all 0.15s',
          }}
          className="dash-quick-action">
            <div style={{ width:'36px', height:'36px', background:item.bg, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px', color:item.iconColor }}>
              {item.icon}
            </div>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28', marginBottom:'2px' }}>{item.label}</div>
            <div style={{ fontSize:'11px', color:'#8fa38f' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Token + Schedule row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        {/* Token */}
        <div style={{ ...cardStyle, padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>AI 利用量</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
            <span style={{ fontSize:'12px', color:'#6b7c70' }}>{totalTokens.toLocaleString()}</span>
            <span style={{ fontSize:'12px', color:'#9aab9f' }}>{tokenLimit.toLocaleString()}</span>
          </div>
          <div style={{ height:'5px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:'10px', background: tokenPct>80?'#e74c3c':tokenPct>50?'#f39c12':'#52b788', width:`${tokenPct}%` }}/>
          </div>
          <div style={{ fontSize:'11px', color:'#9aab9f', marginTop:'5px' }}>残り {(tokenLimit-totalTokens).toLocaleString()} トークン</div>
        </div>

        {/* Schedule */}
        <div style={{ ...cardStyle, padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>重要日程</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {[
              { label:'様式4 締切', date:'4/16', done: now > SCHEDULE.shokoukaideadline, urgent: daysToShokoukai <= 14 },
              { label:'電子申請 締切', date:'4/30', done: now > SCHEDULE.applicationDeadline, urgent: daysToDeadline <= 14 },
              { label:'採択発表', date:'7月頃', done: false, urgent: false },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:'6px', background: item.done ? '#f0faf4' : item.urgent ? '#fff8f0' : '#f6fbf7' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: item.done ? '#52b788' : item.urgent ? '#f39c12' : '#9aab9f' }}/>
                  <span style={{ fontSize:'12px', color: item.done ? '#52b788' : '#1b3a28', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                </div>
                <span style={{ fontSize:'11px', color:'#9aab9f', fontWeight:600 }}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
