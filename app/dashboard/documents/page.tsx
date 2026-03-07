'use client'
import { useState } from 'react'

const DOCS = [
  { id:'gbiz', label:'GビズIDプライム取得', required:true, urgent:true,
    desc:'電子申請に必須。取得に2〜3週間かかるため早めに！',
    link:'https://gbiz-id.go.jp/top/', linkLabel:'GビズIDサイトへ',
    steps:['法人番号（個人は住所・氏名等）を準備','GビズIDサイトへアクセス','プライムアカウントを申請','審査完了後ログイン確認'] },
  { id:'style4', label:'事業支援計画書（様式4）', required:true, urgent:true,
    desc:'商工会議所が発行。4月16日締切のため最優先！',
    steps:['最寄りの商工会議所に連絡・予約','持参書類を確認して面談','事業計画を説明','様式4を受領・PDF化'] },
  { id:'keiei', label:'経営計画書（様式2）', required:true, urgent:false,
    desc:'自社概要・現在の経営状況・経営方針を記載',
    steps:['ヒアリングページで情報を入力','AIチャットで下書きを作成','内容を確認・修正','PDF形式で保存'] },
  { id:'hojojigyou', label:'補助事業計画書（様式3-1）', required:true, urgent:false,
    desc:'補助事業の内容・目的・効果を具体的に記載',
    steps:['補助で実施する取り組みを整理','AIチャットで文章化','数値目標を明記','内容を確認・修正'] },
  { id:'keihi', label:'経費明細書（様式3-2）', required:true, urgent:false,
    desc:'補助対象経費の種類・金額を記載',
    steps:['経費の種類・金額を確認','申請シミュレーションで入力練習','見積書を取得','金額を正確に記入'] },
  { id:'kakutei', label:'確定申告書', required:true, urgent:false,
    desc:'直近1期分（個人：青/白色申告書、法人：法人税申告書）',
    steps:['税務署・e-Taxで書類を準備','全ページスキャンしてPDF化'] },
]

export default function DocumentsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>('gbiz')

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))
  const doneCount = DOCS.filter(d => checked[d.id]).length

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", maxWidth:'760px' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1b3a28', margin:0 }}>必要書類</h1>
        <p style={{ fontSize:'12px', color:'#6b7c70', marginTop:'3px' }}>申請に必要な書類のチェックリスト</p>
      </div>

      {/* Progress */}
      <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', padding:'16px 20px', marginBottom:'16px', boxShadow:'0 1px 4px rgba(27,58,40,0.05)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
          <span style={{ fontSize:'13px', fontWeight:600, color:'#1b3a28' }}>準備状況</span>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#2d6a4f' }}>{doneCount} / {DOCS.length} 完了</span>
        </div>
        <div style={{ height:'6px', background:'#eef3ef', borderRadius:'10px', overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#2d6a4f,#52b788)', borderRadius:'10px', width:`${(doneCount/DOCS.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
      </div>

      {/* Doc list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {DOCS.map(doc => {
          const done = checked[doc.id]
          const open = expanded === doc.id
          return (
            <div key={doc.id} style={{ background:'#fff', borderRadius:'10px', border:`1px solid ${doc.urgent && !done ? '#ffd6a5' : '#e2ece5'}`, boxShadow:'0 1px 4px rgba(27,58,40,0.05)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', cursor:'pointer' }}
                onClick={() => setExpanded(open ? null : doc.id)}>
                <input type="checkbox" checked={Boolean(done)}
                  onChange={() => toggle(doc.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width:'16px', height:'16px', accentColor:'#2d6a4f', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600, color: done ? '#7a8f80' : '#1b3a28', textDecoration: done ? 'line-through' : 'none' }}>
                      {doc.label}
                    </span>
                    {doc.required && <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'10px', background:'#fff0f0', color:'#c0392b', fontWeight:600 }}>必須</span>}
                    {doc.urgent && !done && <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'10px', background:'#fff8e1', color:'#b7791f', fontWeight:600 }}>急ぎ</span>}
                  </div>
                  <div style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>{doc.desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aab9f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {open && (
                <div style={{ padding:'4px 16px 14px 44px', borderTop:'1px solid #f0f7f2' }}>
                  <div style={{ fontSize:'12px', fontWeight:600, color:'#3d5c47', marginBottom:'8px' }}>手順</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {doc.steps.map((step, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                        <div style={{ width:'20px', height:'20px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#2d6a4f', flexShrink:0 }}>
                          {i+1}
                        </div>
                        <span style={{ fontSize:'12px', color:'#3d5c47', lineHeight:1.5, paddingTop:'2px' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  {doc.link && (
                    <a href={doc.link} target="_blank" rel="noopener noreferrer" style={{
                      display:'inline-flex', alignItems:'center', gap:'5px', marginTop:'10px',
                      fontSize:'12px', fontWeight:600, color:'#2d6a4f', textDecoration:'none',
                      padding:'6px 12px', background:'#e8f5ee', borderRadius:'7px', border:'1px solid #b7dfc4',
                    }}>
                      {doc.linkLabel} →
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
