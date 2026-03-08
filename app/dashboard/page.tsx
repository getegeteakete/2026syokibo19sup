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
    const [u, settings, agg] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.id }, include: { hearingData: true, applicationStatus: true } }),
      prisma.systemSettings.findFirst(),
      prisma.tokenUsage.aggregate({ where: { userId: session.id }, _sum: { inputTokens: true, outputTokens: true } }),
    ])
    user = u
    tokenLimit = settings?.perUserTokenLimit || 50000
    totalTokens = (agg._sum.inputTokens || 0) + (agg._sum.outputTokens || 0)
  } catch (_) {}

  const tokenPct = Math.min((totalTokens / tokenLimit) * 100, 100)
  const stage = user?.applicationStatus?.stage || 'requirement_check'
  const stageIndex = Math.max(0, STAGES.findIndex((s: any) => s.id === stage))
  const completionRate = user?.hearingData?.completionRate || 0
  const now = new Date()
  const daysToDeadline = Math.ceil((SCHEDULE.applicationDeadline.getTime() - now.getTime()) / 86400000)
  const daysToShokoukai = Math.ceil((SCHEDULE.shokoukaideadline.getTime() - now.getTime()) / 86400000)

  const MENU = [
    { href:'/dashboard/chat',           label:'AIチャット',       sub:'補助金について何でも相談', num:'01' },
    { href:'/dashboard/hearing',        label:`ヒアリング`,        sub:`事業情報の入力 — ${completionRate}% 完了`, num:'02' },
    { href:'/dashboard/documents',      label:'必要書類',          sub:'提出書類チェックリスト', num:'03' },
    { href:'/dashboard/simulation',     label:'申請シミュレーション', sub:'電子申請の事前練習', num:'04' },
    { href:'/dashboard/smart-schedule', label:'スケジュール',      sub:'逆算タスク・期日管理', num:'05' },
    { href:'/dashboard/reports',        label:'実績報告',          sub:'採択後の手続き', num:'06' },
  ]

  return (
    <div style={{ padding:'32px 36px 48px', fontFamily:"'Noto Sans JP',sans-serif", maxWidth:'860px' }}>

      {/* Header */}
      <div style={{ marginBottom:'36px', paddingBottom:'24px', borderBottom:'1px solid #e4ece7' }}>
        <p style={{ fontSize:'10px', letterSpacing:'0.14em', color:'#8fa38f', textTransform:'uppercase', margin:'0 0 8px', fontWeight:600 }}>
          小規模事業者持続化補助金 第19回
        </p>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'#162d1f', margin:'0 0 6px', letterSpacing:'-0.02em' }}>
          {user?.companyName || session.username}
        </h1>
        <p style={{ fontSize:'12px', color:'#8fa38f', margin:0 }}>
          申請締切まで
          <span style={{ fontWeight:800, color: daysToDeadline < 14 ? '#c0392b' : '#2d6a4f', margin:'0 4px', fontSize:'14px' }}>
            {daysToDeadline}
          </span>
          日
        </p>
      </div>

      {/* Deadline strip */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'36px' }}>
        {[
          { label:'電子申請締切', days: daysToDeadline, date:'2026年4月30日', urgent: daysToDeadline < 14 },
          { label:'様式4（商工会議所）', days: daysToShokoukai, date:'2026年4月16日', urgent: daysToShokoukai < 14 },
        ].map(d => (
          <div key={d.label} style={{
            padding:'16px 20px',
            borderTop:`2px solid ${d.urgent ? '#c0392b' : '#2d6a4f'}`,
            background:'#fff',
          }}>
            <div style={{ fontSize:'10px', color:'#8fa38f', letterSpacing:'0.08em', marginBottom:'8px' }}>{d.label}</div>
            <div style={{ fontSize:'30px', fontWeight:800, color: d.urgent ? '#c0392b' : '#162d1f', lineHeight:1, letterSpacing:'-0.03em' }}>
              {d.days}<span style={{ fontSize:'12px', fontWeight:500, color:'#8fa38f', marginLeft:'4px' }}>日</span>
            </div>
            <div style={{ fontSize:'10px', color:'#b0bfb5', marginTop:'4px' }}>{d.date}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ marginBottom:'36px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:'12px' }}>
          <span style={{ fontSize:'10px', fontWeight:700, color:'#8fa38f', letterSpacing:'0.1em', textTransform:'uppercase' }}>申請進捗</span>
          <span style={{ fontSize:'10px', color:'#b0bfb5' }}>STEP {stageIndex + 1} / {STAGES.length}</span>
        </div>
        <div style={{ height:'2px', background:'#eef3ef', marginBottom:'16px' }}>
          <div style={{ height:'100%', background:'#2d6a4f', width:`${((stageIndex+1)/STAGES.length)*100}%`, transition:'width 0.6s' }}/>
        </div>
        <div style={{ display:'flex', gap:'0', overflowX:'auto' }}>
          {(STAGES as any[]).map((s, i) => (
            <div key={s.id} style={{ flex:1, minWidth:'52px', textAlign:'center' }}>
              <div style={{
                width:'24px', height:'24px', borderRadius:'50%', margin:'0 auto 5px',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'10px', fontWeight:700,
                background: i < stageIndex ? '#2d6a4f' : i === stageIndex ? '#162d1f' : '#eef3ef',
                color: i <= stageIndex ? '#fff' : '#c5d4c8',
                border: i === stageIndex ? '2px solid #162d1f' : '2px solid transparent',
              }}>
                {i < stageIndex ? '✓' : i + 1}
              </div>
              <span style={{ fontSize:'8px', color: i === stageIndex ? '#162d1f' : '#c5d4c8', fontWeight: i === stageIndex ? 700 : 400, lineHeight:1.2, display:'block' }}>
                {s.label.slice(0, 5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div style={{ marginBottom:'36px' }}>
        <div style={{ fontSize:'10px', fontWeight:700, color:'#8fa38f', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'14px' }}>
          メニュー
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#e4ece7' }}>
          {MENU.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', display:'block', background:'#fff', padding:'20px 22px', transition:'background 0.1s' }}
              className="dash-menu-cell">
              <div style={{ fontSize:'9px', color:'#b0bfb5', letterSpacing:'0.1em', marginBottom:'7px', fontWeight:600 }}>
                {item.num}
              </div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#162d1f', letterSpacing:'-0.01em', marginBottom:'4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize:'11px', color:'#8fa38f' }}>
                {item.sub}
              </div>
            </Link>
          ))}
        </div>
        <style>{`.dash-menu-cell:hover { background: #f6fbf7 !important; }`}</style>
      </div>

      {/* Bottom row: token + schedule */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        {/* Token */}
        <div style={{ background:'#fff', padding:'20px 22px', borderTop:'2px solid #e4ece7' }}>
          <div style={{ fontSize:'10px', fontWeight:700, color:'#8fa38f', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>
            AI利用量
          </div>
          <div style={{ fontSize:'22px', fontWeight:800, color:'#162d1f', letterSpacing:'-0.02em', lineHeight:1, marginBottom:'4px' }}>
            {totalTokens.toLocaleString()}
            <span style={{ fontSize:'10px', fontWeight:400, color:'#b0bfb5', marginLeft:'4px' }}>/ {tokenLimit.toLocaleString()}</span>
          </div>
          <div style={{ height:'2px', background:'#eef3ef', margin:'10px 0 6px' }}>
            <div style={{ height:'100%', background: tokenPct>80?'#c0392b':tokenPct>50?'#e67e22':'#2d6a4f', width:`${tokenPct}%` }}/>
          </div>
          <div style={{ fontSize:'10px', color:'#b0bfb5' }}>残り {(tokenLimit-totalTokens).toLocaleString()} トークン</div>
        </div>

        {/* Schedule */}
        <div style={{ background:'#fff', padding:'20px 22px', borderTop:'2px solid #e4ece7' }}>
          <div style={{ fontSize:'10px', fontWeight:700, color:'#8fa38f', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>
            重要日程
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              { label:'様式4 締切', date:'4/16', done: now > SCHEDULE.shokoukaideadline, urgent: daysToShokoukai <= 14 },
              { label:'電子申請 締切', date:'4/30', done: now > SCHEDULE.applicationDeadline, urgent: daysToDeadline <= 14 },
              { label:'採択発表', date:'7月頃', done: false, urgent: false },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f0f5f2' }}>
                <span style={{ fontSize:'11px', color: item.done ? '#b0bfb5' : '#3a5245', textDecoration: item.done ? 'line-through' : 'none', fontWeight: item.urgent ? 700 : 400 }}>
                  {item.label}
                </span>
                <span style={{ fontSize:'11px', fontWeight:700, color: item.done ? '#b0bfb5' : item.urgent ? '#c0392b' : '#8fa38f' }}>
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
