'use client'
import { useState, useEffect } from 'react'
import { STAGES } from '@/lib/constants'

interface User {
  id: string; username: string; companyName: string | null; contactName: string | null
  email: string | null; phone: string | null; createdAt: string
  hearingData: { completionRate: number } | null
  applicationStatus: { stage: string } | null
  totalTokens: number
}

const FIELDS = [
  { key:'username', label:'ユーザーID', required:true, type:'text', placeholder:'半角英数字' },
  { key:'password', label:'パスワード', required:true, type:'password', placeholder:'8文字以上推奨' },
  { key:'companyName', label:'会社名・屋号', required:false, type:'text', placeholder:'株式会社○○' },
  { key:'contactName', label:'担当者名', required:false, type:'text', placeholder:'山田 太郎' },
  { key:'email', label:'メールアドレス', required:false, type:'email', placeholder:'example@email.com' },
  { key:'phone', label:'電話番号', required:false, type:'text', placeholder:'090-0000-0000' },
]

const S = {
  page: {padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", minHeight:'100vh'},
  card: {background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', boxShadow:'0 1px 4px rgba(27,58,40,0.05)', overflow:'hidden', marginBottom:'20px'},
  cardHeader: {display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eef3ef'},
  cardTitle: {fontSize:'14px', fontWeight:700, color:'#1b3a28'},
  input: {width:'100%', background:'#f6fbf7', border:'1px solid #d5e8db', borderRadius:'7px', padding:'9px 13px', fontSize:'13px', color:'#1b3a28', outline:'none', boxSizing:'border-box' as const, fontFamily:"'Noto Sans JP',sans-serif"},
  label: {display:'block', fontSize:'12px', fontWeight:600, color:'#3d5c47', marginBottom:'5px'},
  btnGreen: {display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 18px', background:'#2d6a4f', color:'#fff', borderRadius:'7px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif"},
  btnGhost: {display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 18px', background:'#f4f7f4', color:'#4a5f4e', borderRadius:'7px', fontSize:'13px', fontWeight:500, border:'1px solid #e2ece5', cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif"},
  avatar: {width:'34px', height:'34px', borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#2d6a4f', flexShrink:0},
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({username:'', password:'', companyName:'', contactName:'', email:'', phone:''})
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users || [])
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error) }
      else {
        setSuccess(`${form.companyName || form.username} を登録しました`)
        setForm({username:'', password:'', companyName:'', contactName:'', email:'', phone:''})
        setShowCreate(false); load()
        setTimeout(() => setSuccess(''), 3000)
      }
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} を削除しますか？`)) return
    await fetch(`/api/users?userId=${id}`, { method:'DELETE' })
    load()
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'20px', fontWeight:700, color:'#1b3a28', letterSpacing:'-0.01em'}}>顧客管理</h1>
          <p style={{fontSize:'12px', color:'#6b7c70', marginTop:'3px'}}>顧客の登録・管理ができます</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={S.btnGreen}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新規顧客登録
        </button>
      </div>

      {success && <div style={{background:'#e8f5ee', border:'1px solid #b7dfc4', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', color:'#2d6a4f', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {success}
      </div>}

      {/* Create form */}
      {showCreate && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>新規顧客登録フォーム</span>
          </div>
          <div style={{padding:'20px'}}>
            <form onSubmit={handleCreate}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label style={S.label}>{f.label}{f.required && <span style={{color:'#e55', marginLeft:'3px'}}>*</span>}</label>
                    <input type={f.type} value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder} required={f.required} style={S.input}
                      onFocus={e => { e.target.style.border='1px solid #52b788'; e.target.style.background='#fff' }}
                      onBlur={e => { e.target.style.border='1px solid #d5e8db'; e.target.style.background='#f6fbf7' }}
                    />
                  </div>
                ))}
              </div>
              {error && <div style={{background:'#fff2f2', border:'1px solid #ffc0c0', borderRadius:'7px', padding:'9px 14px', fontSize:'13px', color:'#c0392b', marginBottom:'14px'}}>{error}</div>}
              <div style={{display:'flex', gap:'10px'}}>
                <button type="submit" disabled={creating} style={{...S.btnGreen, opacity: creating ? 0.6 : 1}}>
                  {creating ? '登録中...' : '登録する'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={S.btnGhost}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User list */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <span style={S.cardTitle}>登録顧客一覧</span>
            <span style={{fontSize:'11px', padding:'2px 9px', borderRadius:'20px', background:'#e8f5ee', color:'#2d6a4f', fontWeight:600}}>{users.length}件</span>
          </div>
        </div>
        <div>
          {users.length === 0 && <p style={{padding:'40px 20px', textAlign:'center', fontSize:'13px', color:'#9aab9f'}}>顧客がまだ登録されていません</p>}
          {users.map((user, idx) => {
            const stage = user.applicationStatus?.stage || 'requirement_check'
            const stageObj = STAGES.find((s: any) => s.id === stage)
            const rate = user.hearingData?.completionRate || 0
            return (
              <div key={user.id} style={{display:'flex', alignItems:'center', gap:'14px', padding:'13px 20px', borderBottom: idx===users.length-1?'none':'1px solid #f2f7f3'}}>
                <div style={S.avatar}>{(user.companyName || user.username).slice(0,1)}</div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:'13px', fontWeight:600, color:'#1b3a28'}}>{user.companyName || '(会社名未設定)'}</p>
                  <p style={{fontSize:'11px', color:'#8fa38f', marginTop:'1px'}}>@{user.username} {user.email ? `| ${user.email}` : ''}</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'18px', flexShrink:0}}>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:'10px', color:'#9aab9f', marginBottom:'2px'}}>記入率</p>
                    <p style={{fontSize:'13px', fontWeight:700, color:rate>=80?'#2d6a4f':rate>=50?'#b7791f':'#9aab9f'}}>{rate}%</p>
                  </div>
                  <span style={{fontSize:'11px', padding:'3px 9px', borderRadius:'20px', fontWeight:600, background:'#f4f7f4', color:'#5a7060'}}>
                    {stageObj?.label?.slice(0,6) || '未設定'}
                  </span>
                  <div style={{display:'flex', gap:'6px'}}>
                    <a href={`/admin/customer/${user.id}`} style={{fontSize:'12px', padding:'5px 12px', background:'#e8f5ee', color:'#2d6a4f', borderRadius:'6px', fontWeight:600, textDecoration:'none'}}>詳細</a>
                    <button onClick={() => handleDelete(user.id, user.companyName || user.username)}
                      style={{fontSize:'12px', padding:'5px 12px', background:'#fff2f2', color:'#c0392b', borderRadius:'6px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif"}}>削除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
