'use client'
import { useState, useEffect } from 'react'

interface UserTokenData { userId:string; username:string; companyName:string|null; totalInput:number; totalOutput:number; total:number }
interface Settings { perUserTokenLimit:number; globalTokenLimit:number }

const S = {
  page:{padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", minHeight:'100vh'},
  card:{background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', boxShadow:'0 1px 4px rgba(27,58,40,0.05)', overflow:'hidden', marginBottom:'20px'},
  cardHeader:{display:'flex', alignItems:'center', gap:'8px', padding:'16px 20px', borderBottom:'1px solid #eef3ef'},
  cardTitle:{fontSize:'14px', fontWeight:700, color:'#1b3a28'},
  input:{width:'100%', background:'#f6fbf7', border:'1px solid #d5e8db', borderRadius:'7px', padding:'9px 13px', fontSize:'13px', color:'#1b3a28', outline:'none', boxSizing:'border-box' as const, fontFamily:"'Noto Sans JP',sans-serif"},
  label:{display:'block', fontSize:'12px', fontWeight:600, color:'#3d5c47', marginBottom:'5px'},
}

export default function TokensPage() {
  const [data, setData] = useState<{users:UserTokenData[];globalTotal:number;settings:Settings}|null>(null)
  const [settings, setSettings] = useState<Settings>({perUserTokenLimit:50000,globalTokenLimit:1000000})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/tokens')
      const d = await res.json()
      setData(d); if (d.settings) setSettings(d.settings)
    } catch { setData(null) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try { await fetch('/api/tokens', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings)}) } catch {}
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); load()
  }

  const resetUser = async (userId:string, name:string) => {
    if (!confirm(`${name} のトークン使用量をリセットしますか？`)) return
    try { await fetch('/api/tokens', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resetUserId:userId})}) } catch {}
    load()
  }

  if (!data) return <div style={{padding:'40px', color:'#6b7c70', fontFamily:"'Noto Sans JP',sans-serif"}}>読み込み中...</div>

  const globalPct = Math.min((data.globalTotal/settings.globalTokenLimit)*100, 100)

  return (
    <div style={S.page}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'20px', fontWeight:700, color:'#1b3a28', letterSpacing:'-0.01em'}}>トークン使用量管理</h1>
        <p style={{fontSize:'12px', color:'#6b7c70', marginTop:'3px'}}>AI利用量の監視と制限設定</p>
      </div>

      {/* Global stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'20px'}}>
        {[
          { label:'グローバル合計使用量', value:data.globalTotal.toLocaleString(), unit:'トークン',
            icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, bg:'#e8f5ee', iconBg:'#c5e8d0' },
          { label:'1人あたりの制限', value:settings.perUserTokenLimit.toLocaleString(), unit:'トークン/ユーザー',
            icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b7791f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, bg:'#fef9e7', iconBg:'#fde8a0' },
          { label:'グローバル上限', value:settings.globalTokenLimit.toLocaleString(), unit:'最大使用量',
            icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, bg:'#e8f0fe', iconBg:'#c5d5fd' },
        ].map(s => (
          <div key={s.label} style={{background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', padding:'18px 20px', boxShadow:'0 1px 4px rgba(27,58,40,0.05)'}}>
            <div style={{width:'36px', height:'36px', borderRadius:'8px', background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px'}}>{s.icon}</div>
            <div style={{fontSize:'22px', fontWeight:800, color:'#1b3a28', lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:'11px', color:'#7a8f80', marginTop:'4px'}}>{s.label}</div>
            <div style={{fontSize:'10px', color:'#aabbaf', marginTop:'2px'}}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Global usage bar */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          <span style={S.cardTitle}>グローバル使用状況</span>
        </div>
        <div style={{padding:'16px 20px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
            <span style={{fontSize:'12px', color:'#6b7c70'}}>使用量</span>
            <span style={{fontSize:'12px', fontWeight:700, color: globalPct>80?'#c0392b':globalPct>50?'#b7791f':'#2d6a4f'}}>{globalPct.toFixed(1)}%</span>
          </div>
          <div style={{height:'8px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden'}}>
            <div style={{height:'100%', borderRadius:'10px', background:globalPct>80?'#e55':'#52b788', width:`${globalPct}%`, transition:'width 0.6s'}}/>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px'}}>
            <span style={{fontSize:'11px', color:'#9aab9f'}}>{data.globalTotal.toLocaleString()} 使用済み</span>
            <span style={{fontSize:'11px', color:'#9aab9f'}}>{settings.globalTokenLimit.toLocaleString()} 上限</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M21 12h-2M5 12H3M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/></svg>
          <span style={S.cardTitle}>制限設定</span>
        </div>
        <div style={{padding:'20px'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div>
              <label style={S.label}>1人あたりの上限トークン数</label>
              <input type="number" value={settings.perUserTokenLimit} style={S.input}
                onChange={e => setSettings(p => ({...p, perUserTokenLimit:parseInt(e.target.value)||0}))}
                onFocus={e => {e.target.style.border='1px solid #52b788';e.target.style.background='#fff'}}
                onBlur={e => {e.target.style.border='1px solid #d5e8db';e.target.style.background='#f6fbf7'}}
              />
            </div>
            <div>
              <label style={S.label}>グローバル上限トークン数</label>
              <input type="number" value={settings.globalTokenLimit} style={S.input}
                onChange={e => setSettings(p => ({...p, globalTokenLimit:parseInt(e.target.value)||0}))}
                onFocus={e => {e.target.style.border='1px solid #52b788';e.target.style.background='#fff'}}
                onBlur={e => {e.target.style.border='1px solid #d5e8db';e.target.style.background='#f6fbf7'}}
              />
            </div>
          </div>
          <button onClick={save} disabled={saving} style={{display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 20px', background:saved?'#52b788':'#2d6a4f', color:'#fff', borderRadius:'7px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif", transition:'background 0.2s'}}>
            {saving ? '保存中...' : saved ? <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>保存済み
            </> : <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>設定を保存
            </>}
          </button>
        </div>
      </div>

      {/* Per-user usage */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span style={S.cardTitle}>顧客別使用量</span>
        </div>
        <div>
          {data.users.length===0 && <p style={{padding:'32px 20px', textAlign:'center', fontSize:'13px', color:'#9aab9f'}}>顧客データなし</p>}
          {data.users.map((user, idx) => {
            const pct = Math.min((user.total/settings.perUserTokenLimit)*100, 100)
            return (
              <div key={user.userId} style={{padding:'14px 20px', borderBottom:idx===data.users.length-1?'none':'1px solid #f2f7f3', display:'flex', alignItems:'center', gap:'16px'}}>
                <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#2d6a4f', flexShrink:0}}>
                  {(user.companyName||user.username).slice(0,1)}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                    <p style={{fontSize:'13px', fontWeight:600, color:'#1b3a28', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user.companyName||user.username}</p>
                    <span style={{fontSize:'12px', fontWeight:700, color:pct>80?'#c0392b':pct>50?'#b7791f':'#2d6a4f', flexShrink:0, marginLeft:'8px'}}>
                      {user.total.toLocaleString()} / {settings.perUserTokenLimit.toLocaleString()}
                    </span>
                  </div>
                  <div style={{height:'5px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden'}}>
                    <div style={{height:'100%', borderRadius:'10px', background:pct>80?'#e74c3c':pct>50?'#f39c12':'#52b788', width:`${pct}%`, transition:'width 0.4s'}}/>
                  </div>
                  <p style={{fontSize:'10px', color:'#aabbaf', marginTop:'3px'}}>入力: {user.totalInput.toLocaleString()} / 出力: {user.totalOutput.toLocaleString()}</p>
                </div>
                <button onClick={() => resetUser(user.userId, user.companyName||user.username)}
                  style={{flexShrink:0, fontSize:'11px', padding:'5px 11px', background:'#fff2f2', color:'#c0392b', borderRadius:'6px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif"}}>
                  リセット
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
