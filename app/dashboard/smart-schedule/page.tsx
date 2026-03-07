'use client'
import { useState, useEffect } from 'react'
import { generateSmartSchedule, SmartSchedule, ScheduleTask } from '@/lib/smart-schedule'

const CATEGORY_COLORS: Record<string, {bg:string,color:string,border:string}> = {
  gbizid:      {bg:'#f3e8ff',color:'#6b21a8',border:'#d8b4fe'},
  hearing:     {bg:'#eff6ff',color:'#1d4ed8',border:'#bfdbfe'},
  shokoukai:   {bg:'#fff7ed',color:'#c2410c',border:'#fed7aa'},
  document:    {bg:'#e8f5ee',color:'#2d6a4f',border:'#b7dfc4'},
  application: {bg:'#e8f5ee',color:'#1b3a28',border:'#a3d4b4'},
  post:        {bg:'#f6fbf7',color:'#5a7060',border:'#d5e8db'},
}
const CATEGORY_LABELS: Record<string, string> = {
  gbizid: 'GビズID', hearing: 'ヒアリング', shokoukai: '商工会議所',
  document: '書類準備', application: '電子申請', post: '採択後',
}
const TYPE_ICONS: Record<string, string> = {
  urgent: '🚨', action: '📌', milestone: '🏁', buffer: '🛡️',
}

export default function SmartSchedulePage() {
  const [schedule, setSchedule] = useState<SmartSchedule | null>(null)
  const [notifSettings, setNotifSettings] = useState({ email: '', phone: '', emailEnabled: true, smsEnabled: false })
  const [saving, setSaving] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [tab, setTab] = useState<'schedule' | 'notify'>('schedule')
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load hearing data to generate smart schedule
    Promise.all([
      fetch('/api/hearing').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/status').then(r => r.json()).catch(() => ({})),
      fetch('/api/notifications').then(r => r.json()).catch(() => ({})),
    ]).then(([hearingRes, statusRes, notifRes]) => {
      const hearing = hearingRes.data
      const status = statusRes.status
      const notif = notifRes.settings

      const smart = generateSmartSchedule({
        hasGbizId: status?.requirementCheckDone || false,
        hearingRate: hearing?.completionRate || 0,
        hasShokoukai: status?.shokoukaiFiled || false,
        hasApplied: status?.electronicFiled || false,
      })
      setSchedule(smart)

      if (notif) {
        setNotifSettings({
          email: notif.email || '',
          phone: notif.phone || '',
          emailEnabled: notif.emailEnabled ?? true,
          smsEnabled: notif.smsEnabled ?? false,
        })
      }
    })
  }, [])

  const toggleDone = (id: string) => {
    setDoneTasks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const saveNotif = async () => {
    setSaving(true)
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_settings', ...notifSettings }),
    })
    setSaving(false)
  }

  const sendTest = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' }),
    })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  const completedCount = schedule ? schedule.tasks.filter(t => doneTasks.has(t.id)).length : 0
  const totalCount = schedule?.tasks.length || 0

  return (
    <div style={{padding:'28px 32px',fontFamily:"'Noto Sans JP',sans-serif",maxWidth:'780px'}}>
      <div>
        <h1 style={{fontSize:'18px',fontWeight:700,color:'#1b3a28',margin:0}}>スマートスケジュール</h1>
        <p style={{fontSize:'12px',color:'#6b7c70',marginTop:'3px'}}>あなたの状況に合わせた逆算スケジュールと通知設定</p>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'4px',background:'#fff',borderRadius:'10px',border:'1px solid #e2ece5',padding:'4px',marginBottom:'4px'}}>
        {[
          { id: 'schedule', label: 'スケジュール', icon: '📅' },
          { id: 'notify', label: '通知設定', icon: '🔔' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'8px',borderRadius:'7px',fontSize:'12px',fontWeight:tab===t.id?600:500,border:'none',cursor:'pointer',fontFamily:"'Noto Sans JP',sans-serif",background:tab===t.id?'#2d6a4f':'transparent',color:tab===t.id?'#fff':'#7a8f80',boxShadow:tab===t.id?'0 2px 8px rgba(0,0,0,0.12)':'none',transition:'all 0.15s'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'schedule' && schedule && (
        <>
          {/* Warnings */}
          {schedule.warnings.length > 0 && (
            <div className="space-y-2">
              {schedule.warnings.map((w, i) => (
                <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 flex items-start gap-2">
                  <span className="shrink-0">⚠️</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          <div className="bg-white dash-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2d4a35]">タスク完了状況</span>
              <span className="text-sm font-bold text-primary-600">{completedCount} / {totalCount}</span>
            </div>
            <div className="w-full h-2 bg-[#eef3ef] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <span key={key} style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',border:`1px solid ${(CATEGORY_COLORS[key] as any).border}`,fontWeight:600,background:(CATEGORY_COLORS[key] as any).bg,color:(CATEGORY_COLORS[key] as any).color}}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dash-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eef3ef] bg-[#f6fbf7]">
              <p className="text-sm font-semibold text-[#2d4a35]">🗓️ 逆算スケジュール（今日〜申請まで）</p>
            </div>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#eef3ef]" />
              <div className="divide-y divide-slate-50">
                {schedule.tasks.map((task) => {
                  const isDone = doneTasks.has(task.id)
                  return (
                    <div key={task.id}
                      className={`flex items-start gap-4 p-4 pl-14 relative transition-colors ${
                        isDone ? 'bg-green-50/50' : task.isOverdue ? 'bg-red-50/50' : ''
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-4 w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center text-xs ${
                        isDone ? 'bg-green-500 border-green-500' :
                        task.isOverdue ? 'bg-red-400 border-red-400' :
                        task.type === 'urgent' ? 'bg-red-100 border-red-400' :
                        task.type === 'milestone' ? 'bg-primary-500 border-primary-500' :
                        task.type === 'buffer' ? 'bg-amber-100 border-amber-300' :
                        'bg-white border-slate-300'
                      }`}>
                        {isDone && <span className="text-white text-xs">✓</span>}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-1">
                          <button onClick={() => toggleDone(task.id)}
                            className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isDone ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-primary-400'
                            }`}>
                            {isDone && <span className="text-xs">✓</span>}
                          </button>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold leading-tight ${isDone ? 'text-[#9aab9f] line-through' : 'text-[#1b3a28]'}`}>
                              {TYPE_ICONS[task.type]} {task.label}
                            </p>
                            <p className={`text-xs mt-0.5 ${isDone ? 'text-slate-300' : 'text-[#7a8f80]'}`}>
                              {task.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 pl-7">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[task.category]}`}>
                            {CATEGORY_LABELS[task.category]}
                          </span>
                          <span className={`text-xs font-medium ${
                            task.isOverdue ? 'text-red-600' :
                            task.daysFromNow === 0 ? 'text-orange-600 font-bold' :
                            task.daysFromNow <= 3 ? 'text-amber-600' : 'text-[#9aab9f]'
                          }`}>
                            {task.isOverdue ? '⚡ 期限超過！' :
                             task.daysFromNow === 0 ? '📍 今日！' :
                             `${formatDate(task.date)}`}
                          </span>
                          {task.daysFromNow > 0 && !task.isOverdue && (
                            <span className="text-xs text-[#9aab9f]">（{task.daysFromNow}日後）</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-[#f6fbf7] rounded-2xl p-4 text-xs text-[#7a8f80]">
            <p className="font-medium text-[#3d5c47] mb-2">凡例</p>
            <div className="flex flex-wrap gap-3">
              <span>🚨 緊急</span>
              <span>📌 アクション必要</span>
              <span>🏁 マイルストーン</span>
              <span>🛡️ バッファ日（余裕）</span>
            </div>
          </div>
        </>
      )}

      {tab === 'notify' && (
        <div className="space-y-4">
          {/* Notification settings */}
          <div className="bg-white dash-card p-5 space-y-4">
            <h2 className="font-semibold text-[#1b3a28]">🔔 通知設定</h2>
            <p className="text-sm text-[#7a8f80]">締切前・書類未収集などのリマインダーをメール/SMSで受け取れます。</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#2d4a35] mb-1">メールアドレス</label>
                <input type="email" value={notifSettings.email}
                  onChange={e => setNotifSettings(p => ({ ...p, email: e.target.value }))}
                  placeholder="通知先メールアドレス"
                  className="w-full bg-[#f6fbf7] border border-[#e2ece5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2d4a35] mb-1">携帯電話番号（SMS通知）</label>
                <input type="tel" value={notifSettings.phone}
                  onChange={e => setNotifSettings(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+81901234567（国際形式）"
                  className="w-full bg-[#f6fbf7] border border-[#e2ece5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white" />
                <p className="text-xs text-[#9aab9f] mt-1">SMS通知はTwilio設定が必要です</p>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              {[
                { key: 'emailEnabled', label: 'メール通知を有効にする', icon: '📧' },
                { key: 'smsEnabled', label: 'SMS通知を有効にする', icon: '📱' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 bg-[#f6fbf7] rounded-xl cursor-pointer">
                  <span className="text-sm text-[#2d4a35]">{item.icon} {item.label}</span>
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifSettings[item.key as keyof typeof notifSettings] ? 'bg-primary-500' : 'bg-slate-300'
                  }`}
                    onClick={() => setNotifSettings(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      notifSettings[item.key as keyof typeof notifSettings] ? 'left-6' : 'left-1'
                    }`} />
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={saveNotif} disabled={saving}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-md transition-all">
                {saving ? '保存中...' : '💾 設定を保存'}
              </button>
              <button onClick={sendTest}
                className={`flex-1 py-2.5 font-semibold rounded-xl text-sm border-2 transition-all ${
                  testSent ? 'border-green-400 text-green-600 bg-green-50' : 'border-primary-300 text-primary-600 hover:bg-primary-50'
                }`}>
                {testSent ? '✅ 送信しました' : '📤 テスト送信'}
              </button>
            </div>
          </div>

          {/* Notification timeline */}
          <div className="bg-white dash-card p-5">
            <h3 className="font-semibold text-[#1b3a28] mb-3">📬 自動通知スケジュール</h3>
            <div className="space-y-2">
              {[
                { days: 30, label: '電子申請締切30日前', desc: '書類準備の開始リマインダー', type: 'info' },
                { days: 21, label: '電子申請締切21日前', desc: 'GビズID確認・商工会議所連絡リマインダー', type: 'info' },
                { days: 14, label: '様式4締切2週間前', desc: '商工会議所への早急な連絡を促す通知', type: 'warning' },
                { days: 7, label: '様式4締切1週間前', desc: '商工会議所の様式4未取得者への緊急通知', type: 'urgent' },
                { days: 14, label: '電子申請締切2週間前', desc: '申請書最終確認と電子申請準備の通知', type: 'warning' },
                { days: 7, label: '電子申請締切1週間前', desc: '電子申請を急ぐよう促す通知', type: 'warning' },
                { days: 3, label: '電子申請締切3日前', desc: '最終チェックと提出の督促通知', type: 'urgent' },
                { days: 1, label: '電子申請前日', desc: '「今日中に提出を！」緊急通知', type: 'urgent' },
              ].map((n, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                  n.type === 'urgent' ? 'bg-red-50 border border-red-100' :
                  n.type === 'warning' ? 'bg-amber-50 border border-amber-100' :
                  'bg-[#f6fbf7] border border-[#eef3ef]'
                }`}>
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    n.type === 'urgent' ? 'bg-red-200 text-red-700' :
                    n.type === 'warning' ? 'bg-amber-200 text-amber-700' :
                    'bg-slate-200 text-[#3d5c47]'
                  }`}>{n.days}日</span>
                  <div>
                    <p className="font-medium text-[#1b3a28]">{n.label}</p>
                    <p className="text-xs text-[#7a8f80]">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
