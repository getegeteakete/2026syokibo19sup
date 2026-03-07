'use client'
import { useState } from 'react'
import Link from 'next/link'

const REPORT_DOCS = [
  { id:'jisseki', label:'実績報告書（様式7）', required:true, desc:'補助事業の実施内容を報告' },
  { id:'keiri', label:'経理書類一覧（様式8）', required:true, desc:'補助対象経費の一覧' },
  { id:'ryoshusho', label:'領収書・請求書の写し', required:true, desc:'すべての補助対象経費の証憑' },
  { id:'tsukisho', label:'振込明細・通帳の写し', required:true, desc:'支払いを証明する書類' },
  { id:'seika', label:'成果物（チラシ・HP等）の写し', required:false, desc:'補助事業で作成した成果物' },
  { id:'kotei', label:'固定資産台帳の写し（該当時）', required:false, desc:'機械装置等を取得した場合' },
]

export default function ReportsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [section, setSection] = useState<'info' | 'docs' | 'chat'>('info')
  const checkedCount = REPORT_DOCS.filter(d => d.required && checked[d.id]).length
  const totalRequired = REPORT_DOCS.filter(d => d.required).length

  const S = {
    card: { background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', boxShadow:'0 1px 4px rgba(27,58,40,0.05)', marginBottom:'14px' },
  }

  const TABS = [
    { id:'info', label:'実績報告について' },
    { id:'docs', label:'書類チェックリスト' },
    { id:'chat', label:'AIに相談' },
  ]

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", maxWidth:'780px' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1b3a28', margin:0 }}>実績報告</h1>
        <p style={{ fontSize:'12px', color:'#6b7c70', marginTop:'3px' }}>採択後の実績報告手続き（提出期限：2027年7月10日）</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', background:'#fff', borderRadius:'10px', border:'1px solid #e2ece5', padding:'4px', marginBottom:'16px' }}>
        {TABS.map(t => {
          const active = section === t.id
          return (
            <button key={t.id} onClick={() => setSection(t.id as any)} style={{
              flex:1, padding:'8px', borderRadius:'7px', fontSize:'12px', fontWeight: active ? 600 : 500,
              border:'none', cursor:'pointer', fontFamily:"'Noto Sans JP',sans-serif",
              background: active ? '#2d6a4f' : 'transparent',
              color: active ? '#fff' : '#7a8f80',
              transition:'all 0.15s',
            }}>{t.label}</button>
          )
        })}
      </div>

      {section === 'info' && (
        <>
          {/* Important notice */}
          <div style={{ ...S.card, borderLeft:'3px solid #f39c12', padding:'14px 18px', background:'#fffdf0' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#b7791f', marginBottom:'6px' }}>⚠️ 実績報告とは</div>
            <p style={{ fontSize:'12px', color:'#6b4c00', lineHeight:1.7, margin:0 }}>
              補助事業が完了したら、実施した内容と経費の使途を報告します。<br/>
              <strong>報告なしには補助金が交付されません。</strong>経費の証憑（領収書等）は補助事業開始から保管してください。
            </p>
          </div>

          {/* Timeline */}
          <div style={S.card}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #eef3ef' }}>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28' }}>実績報告の流れ</span>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {[
                { num:'1', label:'補助事業の実施', desc:'交付決定日以降に補助対象経費の支払いを行う' },
                { num:'2', label:'証憑書類の整理', desc:'領収書・請求書・振込明細などを種類ごとに整理' },
                { num:'3', label:'実績報告書の作成', desc:'様式7・様式8に実施内容と経費を記入' },
                { num:'4', label:'電子申請システムで提出', desc:'実績報告書と証憑をアップロードして提出' },
                { num:'5', label:'補助金額の確定・交付', desc:'審査後、確定額が通知され補助金が振り込まれる' },
              ].map((step, i) => (
                <div key={i} style={{ display:'flex', gap:'12px', marginBottom: i < 4 ? '14px' : 0 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#2d6a4f', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>{step.num}</div>
                    {i < 4 && <div style={{ width:'2px', flex:1, background:'#e2ece5', minHeight:'16px', margin:'3px 0' }}/>}
                  </div>
                  <div style={{ paddingTop:'4px' }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1b3a28' }}>{step.label}</div>
                    <div style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#e8f5ee', borderRadius:'10px', padding:'14px 18px', border:'1px solid #b7dfc4' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#1b3a28', marginBottom:'6px' }}>📅 重要な期限</div>
            <div style={{ fontSize:'12px', color:'#2d6a4f', lineHeight:1.8 }}>
              補助事業実施期間：交付決定日 〜 <strong>2027年6月30日</strong><br/>
              実績報告提出期限：<strong>2027年7月10日</strong>（事業完了から30日以内）
            </div>
          </div>
        </>
      )}

      {section === 'docs' && (
        <div>
          <div style={{ ...S.card, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'13px', fontWeight:600, color:'#1b3a28' }}>必須書類の準備状況</span>
            <span style={{ fontSize:'14px', fontWeight:800, color:'#2d6a4f' }}>{checkedCount} / {totalRequired} 完了</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {REPORT_DOCS.map(doc => (
              <label key={doc.id} style={{
                display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
                background: checked[doc.id] ? '#f0faf4' : '#fff',
                borderRadius:'10px', border:`1px solid ${checked[doc.id] ? '#b7dfc4' : '#e2ece5'}`,
                cursor:'pointer', boxShadow:'0 1px 3px rgba(27,58,40,0.04)',
              }}>
                <input type="checkbox" checked={Boolean(checked[doc.id])}
                  onChange={() => setChecked(p => ({ ...p, [doc.id]: !p[doc.id] }))}
                  style={{ width:'16px', height:'16px', accentColor:'#2d6a4f' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600, color: checked[doc.id] ? '#7a8f80' : '#1b3a28', textDecoration: checked[doc.id] ? 'line-through' : 'none' }}>{doc.label}</span>
                    <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'10px', background: doc.required ? '#fff0f0' : '#f4f7f4', color: doc.required ? '#c0392b' : '#7a8f80', fontWeight:600 }}>
                      {doc.required ? '必須' : '任意'}
                    </span>
                  </div>
                  <div style={{ fontSize:'11px', color:'#7a8f80', marginTop:'2px' }}>{doc.desc}</div>
                </div>
                {checked[doc.id] && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {section === 'chat' && (
        <div style={{ ...S.card, padding:'24px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>💬</div>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1b3a28', marginBottom:'8px' }}>AIに実績報告を相談する</div>
          <p style={{ fontSize:'12px', color:'#7a8f80', marginBottom:'16px', lineHeight:1.7 }}>
            実績報告の書き方・経費の計上方法などをAIがサポートします
          </p>
          <Link href="/dashboard/chat?section=general" style={{
            display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 20px',
            background:'#2d6a4f', color:'#fff', borderRadius:'8px', textDecoration:'none',
            fontSize:'13px', fontWeight:600, boxShadow:'0 2px 8px rgba(45,106,79,0.25)',
          }}>
            AIチャットを開く →
          </Link>
        </div>
      )}
    </div>
  )
}
