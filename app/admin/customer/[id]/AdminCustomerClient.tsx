'use client'
import { useState } from 'react'

interface Props {
  user: {
    id: string; username: string; companyName: string | null; contactName: string | null
    email: string | null; phone: string | null
    hearingData: Record<string, unknown> | null
    applicationStatus: {
      stage: string; requirementCheckDone: boolean; amountCheckDone: boolean
      hearingDone: boolean; shokoukaiFiled: boolean; electronicFiled: boolean
      adopted: boolean; reportFiled: boolean; notes: string | null
    } | null
    totalTokens: number
    chatMessages: Array<{ id: string; role: string; content: string; section: string; createdAt: Date }>
    aiGenerateEnabled: boolean
  }
  stages: Array<{ id: string; label: string; icon: string }>
  stageIndex: number
}

const S = {
  card: { background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5', boxShadow: '0 1px 4px rgba(27,58,40,0.05)', overflow: 'hidden', marginBottom: '16px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #eef3ef' },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#1b3a28' },
  input: { width: '100%', background: '#f6fbf7', border: '1px solid #d5e8db', borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: '#1b3a28', outline: 'none', boxSizing: 'border-box' as const },
}

const HEARING_FIELDS = [
  { label: '会社名・屋号', key: 'companyName' }, { label: '代表者名', key: 'representativeName' },
  { label: '業種', key: 'businessType' }, { label: '従業員数', key: 'employeeCount' },
  { label: '年間売上高', key: 'annualSales' }, { label: '現在の事業内容', key: 'currentBusiness' },
  { label: '主な商品・サービス', key: 'mainProducts' }, { label: '主なターゲット顧客', key: 'targetCustomers' },
  { label: '販売チャネル', key: 'salesChannels' }, { label: '強み・特徴', key: 'strengths' },
  { label: '課題・悩み', key: 'challenges' }, { label: '補助金で実現したいこと', key: 'subsidyPurpose' },
  { label: '取組内容', key: 'plannedActivities' }, { label: '期待される効果', key: 'expectedEffects' },
  { label: '申請希望額', key: 'requestedAmount' }, { label: '実施スケジュール', key: 'implementationPlan' },
]

const STATUS_CHECKS = [
  { key: 'requirementCheckDone', label: '申請要件確認済み' },
  { key: 'amountCheckDone', label: '補助額確認済み' },
  { key: 'hearingDone', label: 'ヒアリング完了' },
  { key: 'shokoukaiFiled', label: '商工会議所 様式4 受領' },
  { key: 'electronicFiled', label: '電子申請完了' },
  { key: 'adopted', label: '採択' },
  { key: 'reportFiled', label: '実績報告提出済み' },
]

export default function AdminCustomerClient({ user, stages, stageIndex }: Props) {
  const [activeTab, setActiveTab] = useState<'data' | 'chat' | 'status'>('data')
  const [status, setStatus] = useState<Record<string, unknown>>(user.applicationStatus || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(user.aiGenerateEnabled)
  const [aiToggling, setAiToggling] = useState(false)

  const toggleAiPermission = async (val: boolean) => {
    setAiToggling(true)
    try {
      const res = await fetch('/api/admin/ai-permission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, enabled: val }),
      })
      if (res.ok) setAiEnabled(val)
    } catch(e) { console.error(e) } finally { setAiToggling(false) }
  }
  const hearing = user.hearingData as Record<string, string> | null
  const rate = (hearing as any)?.completionRate || 0

  const handleStatusChange = (field: string, value: unknown) => {
    setStatus(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const saveStatus = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...status }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.error(e) } finally { setSaving(false) }
  }

  const TABS = [
    { id: 'data', label: 'ヒアリングデータ', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { id: 'status', label: '申請ステータス管理', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { id: 'chat', label: 'チャット履歴', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  ]

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'ヒアリング記入率', value: `${rate}%`, color: rate >= 80 ? '#2d6a4f' : rate >= 50 ? '#b7791f' : '#9aab9f', bg: '#e8f5ee' },
          { label: 'AI トークン使用量', value: user.totalTokens.toLocaleString(), color: '#2d6a4f', bg: '#e8f5ee' },
          { label: 'チャット履歴', value: `${user.chatMessages.length}件`, color: '#3b5bdb', bg: '#e8f0fe' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5', padding: '16px 18px', boxShadow: '0 1px 4px rgba(27,58,40,0.05)', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#7a8f80', marginBottom: '6px' }}>{c.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* AI生成許可トグル */}
      <div style={{ background: '#fff', borderRadius: '10px', border: `2px solid ${aiEnabled ? '#52b788' : '#e2ece5'}`, padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color .2s' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={aiEnabled ? '#2d6a4f' : '#9aab9f'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1b3a28' }}>AI書類生成ボタン</span>
            <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', fontWeight: 600, background: aiEnabled ? '#e8f5ee' : '#f0f0f0', color: aiEnabled ? '#2d6a4f' : '#9aab9f' }}>
              {aiEnabled ? '許可中' : '非許可'}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#9aab9f', marginTop: '4px', marginLeft: '23px' }}>
            {aiEnabled ? 'この顧客の申請書類ページにAI生成ボタンが表示されます' : 'ヒアリング完了後に許可してください。現在は非表示です'}
          </p>
        </div>
        <button
          onClick={() => toggleAiPermission(!aiEnabled)}
          disabled={aiToggling}
          style={{
            width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: aiToggling ? 'default' : 'pointer',
            background: aiEnabled ? '#2d6a4f' : '#d5e8db', position: 'relative', transition: 'background .2s', flexShrink: 0,
          }}>
          <span style={{
            position: 'absolute', top: '3px',
            left: aiEnabled ? '27px' : '3px',
            width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
            transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}/>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5', padding: '4px', marginBottom: '16px' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: "'Noto Sans JP',sans-serif", transition: 'all 0.15s',
            background: activeTab === tab.id ? '#2d6a4f' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#7a8f80',
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
          }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Data tab */}
      {activeTab === 'data' && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>ヒアリングデータ</span>
            <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#e8f5ee', color: '#2d6a4f', fontWeight: 600 }}>{rate}% 記入済み</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {!hearing && <p style={{ fontSize: '13px', color: '#9aab9f', textAlign: 'center', padding: '20px' }}>まだヒアリングデータがありません</p>}
            {hearing && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {HEARING_FIELDS.filter(f => hearing[f.key]).map(field => (
                  <div key={field.key} style={{ background: '#f6fbf7', borderRadius: '8px', padding: '10px 12px', border: '1px solid #eef3ef' }}>
                    <p style={{ fontSize: '10px', color: '#8fa38f', marginBottom: '3px' }}>{field.label}</p>
                    <p style={{ fontSize: '13px', color: '#1b3a28', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{hearing[field.key]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status tab */}
      {activeTab === 'status' && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>申請ステータス管理</span>
            <button onClick={saveStatus} disabled={saving} style={{
              padding: '6px 16px', background: saved ? '#52b788' : '#2d6a4f', color: '#fff',
              borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              fontFamily: "'Noto Sans JP',sans-serif", transition: 'background 0.2s',
            }}>
              {saving ? '保存中...' : saved ? '✅ 保存済み' : '保存'}
            </button>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3d5c47', marginBottom: '5px' }}>現在のステージ</label>
              <select value={status.stage as string || 'requirement_check'}
                onChange={e => handleStatusChange('stage', e.target.value)}
                style={{ ...S.input, appearance: 'auto' }}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {STATUS_CHECKS.map(item => (
                <label key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                  borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                  background: status[item.key] ? '#e8f5ee' : '#f6fbf7',
                  borderColor: status[item.key] ? '#b7dfc4' : '#e2ece5',
                }}>
                  <input type="checkbox" checked={Boolean(status[item.key])}
                    onChange={e => handleStatusChange(item.key, e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#2d6a4f' }} />
                  <span style={{ fontSize: '12px', color: '#1b3a28', fontWeight: 500 }}>{item.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3d5c47', marginBottom: '5px' }}>管理メモ</label>
              <textarea value={status.notes as string || ''}
                onChange={e => handleStatusChange('notes', e.target.value)}
                rows={3} placeholder="担当者向けメモを入力..."
                style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </div>
        </div>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>チャット履歴（直近20件）</span>
          </div>
          <div style={{ padding: '12px 16px', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.chatMessages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9aab9f', fontSize: '13px', padding: '24px' }}>チャット履歴がありません</p>
            )}
            {[...user.chatMessages].reverse().map(msg => (
              <div key={msg.id} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '75%', padding: '9px 13px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.6,
                  background: msg.role === 'user' ? '#2d6a4f' : '#f4f7f4',
                  color: msg.role === 'user' ? '#fff' : '#1b3a28',
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.6, textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
