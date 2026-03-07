export interface ScheduleTask {
  id: string
  date: Date
  label: string
  description: string
  type: 'urgent' | 'action' | 'milestone' | 'buffer'
  category: 'gbizid' | 'hearing' | 'shokoukai' | 'document' | 'application' | 'post'
  daysFromNow: number
  isDone?: boolean
  isOverdue?: boolean
}

export interface SmartSchedule {
  tasks: ScheduleTask[]
  warnings: string[]
  onTrack: boolean
}

const DEADLINES = {
  shokoukai: new Date('2026-04-16'),
  application: new Date('2026-04-30T17:00:00'),
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function daysUntil(target: Date): number {
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}

export function generateSmartSchedule(userData: {
  hasGbizId: boolean
  hearingRate: number
  hasShokoukai: boolean
  hasApplied: boolean
}): SmartSchedule {
  const now = new Date()
  const warnings: string[] = []
  const tasks: ScheduleTask[] = []
  let onTrack = true

  const daysToApp = daysUntil(DEADLINES.application)
  const daysToShokoukai = daysUntil(DEADLINES.shokoukai)

  // === GビズID取得 ===
  if (!userData.hasGbizId) {
    const gbizDeadline = addDays(now, 3) // すぐやる必要
    tasks.push({
      id: 'gbiz_apply',
      date: now,
      label: '🆔 GビズIDプライム 申請',
      description: 'GビズIDサイトで申請。取得まで2〜3週間かかるため今すぐ申請が必要。',
      type: 'urgent',
      category: 'gbizid',
      daysFromNow: 0,
    })
    tasks.push({
      id: 'gbiz_receive',
      date: addDays(now, 21),
      label: '✅ GビズIDプライム 取得確認',
      description: 'GビズIDが届いたらログインして確認。',
      type: 'milestone',
      category: 'gbizid',
      daysFromNow: 21,
    })
    if (daysToApp < 21) {
      warnings.push('⚠️ GビズIDの取得が電子申請締切に間に合わない可能性があります。今すぐ申請してください！')
      onTrack = false
    }
  }

  // === ヒアリング・計画書作成 ===
  if (userData.hearingRate < 100) {
    const hearingDays = Math.max(0, Math.ceil((100 - userData.hearingRate) / 20)) // 20%/日で試算
    tasks.push({
      id: 'hearing_1',
      date: now,
      label: '📝 ヒアリング入力（基本情報）',
      description: '会社情報・現在の事業内容をシステムに入力する。',
      type: 'action',
      category: 'hearing',
      daysFromNow: 0,
    })
    if (userData.hearingRate < 50) {
      tasks.push({
        id: 'hearing_2',
        date: addDays(now, 2),
        label: '📝 ヒアリング入力（事業計画）',
        description: '補助事業の内容・経費・期待効果を入力する。',
        type: 'action',
        category: 'hearing',
        daysFromNow: 2,
      })
    }
    tasks.push({
      id: 'hearing_draft',
      date: addDays(now, Math.max(hearingDays, 3)),
      label: '✏️ 申請書類 AI下書き作成',
      description: 'ヒアリング完了後、AIチャット「申請書作成」モードで経営計画書・補助事業計画書の下書きを作成。',
      type: 'action',
      category: 'document',
      daysFromNow: Math.max(hearingDays, 3),
    })
  }

  // === 商工会議所 ===
  if (!userData.hasShokoukai) {
    // 様式4取得には通常1〜2週間かかる。余裕を持って2週間前には依頼
    const shokouContactDate = addDays(DEADLINES.shokoukai, -14)
    const contactDaysFromNow = daysUntil(shokouContactDate)

    if (contactDaysFromNow < 0) {
      warnings.push('⚠️ 商工会議所への連絡が遅れています！今すぐ電話してアポを取ってください。')
      onTrack = false
      tasks.push({
        id: 'shokoukai_contact',
        date: now,
        label: '🏢 商工会議所に今すぐ連絡（超急ぎ）',
        description: '最寄りの商工会議所に電話してヒアリング面談の予約を取る。様式4の受付締切は4月16日。',
        type: 'urgent',
        category: 'shokoukai',
        daysFromNow: 0,
        isOverdue: true,
      })
    } else {
      tasks.push({
        id: 'shokoukai_contact',
        date: shokouContactDate,
        label: '🏢 商工会議所に連絡・予約',
        description: '最寄りの商工会議所に電話して面談の予約を取る。計画書の下書きを持参する。',
        type: daysToShokoukai < 14 ? 'urgent' : 'action',
        category: 'shokoukai',
        daysFromNow: Math.max(0, contactDaysFromNow),
      })
    }

    tasks.push({
      id: 'shokoukai_meeting',
      date: addDays(DEADLINES.shokoukai, -7),
      label: '🤝 商工会議所 面談',
      description: '経営計画書・補助事業計画書の下書きを持参して面談。',
      type: 'action',
      category: 'shokoukai',
      daysFromNow: daysUntil(addDays(DEADLINES.shokoukai, -7)),
    })
    tasks.push({
      id: 'shokoukai_receive',
      date: addDays(DEADLINES.shokoukai, -3),
      label: '📄 様式4 受領確認',
      description: '商工会議所から事業支援計画書（様式4）を受け取る。受取後すぐPDF化して保存。',
      type: 'milestone',
      category: 'shokoukai',
      daysFromNow: daysUntil(addDays(DEADLINES.shokoukai, -3)),
    })

    if (daysToShokoukai < 7) {
      warnings.push(`⚠️ 様式4の締切まで${daysToShokoukai}日！今週中に商工会議所で手続きを完了させてください。`)
    }
  }

  // === 電子申請準備 ===
  tasks.push({
    id: 'system_input',
    date: addDays(DEADLINES.application, -14),
    label: '💻 電子申請システム 入力練習',
    description: 'サポートシステムの「電子申請シミュレーション」で入力を練習する。',
    type: 'action',
    category: 'application',
    daysFromNow: daysUntil(addDays(DEADLINES.application, -14)),
  })
  tasks.push({
    id: 'doc_final',
    date: addDays(DEADLINES.application, -7),
    label: '📎 添付書類 最終確認',
    description: '確定申告書・様式4・経営計画書等を全てPDF化してフォルダに整理。',
    type: 'action',
    category: 'document',
    daysFromNow: daysUntil(addDays(DEADLINES.application, -7)),
  })

  if (!userData.hasApplied) {
    tasks.push({
      id: 'app_buffer',
      date: addDays(DEADLINES.application, -3),
      label: '⚡ 電子申請 最終チェック（余裕日）',
      description: 'システムに仮入力して全項目確認。不備がないか再度チェック。',
      type: 'buffer',
      category: 'application',
      daysFromNow: daysUntil(addDays(DEADLINES.application, -3)),
    })
    tasks.push({
      id: 'app_submit',
      date: addDays(DEADLINES.application, -1),
      label: '🚀 電子申請 本番提出',
      description: '4月30日 17:00締切。前日までに提出完了を目標にする。',
      type: 'milestone',
      category: 'application',
      daysFromNow: daysUntil(addDays(DEADLINES.application, -1)),
    })
  }

  // Sort by date
  tasks.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Mark overdue
  tasks.forEach(t => {
    if (t.daysFromNow < 0) t.isOverdue = true
  })

  if (daysToApp < 0) {
    warnings.push('📝 電子申請の締切は終了しています。採択発表をお待ちください。')
  } else if (daysToApp < 7) {
    warnings.push(`⚡ 電子申請締切まで${daysToApp}日！今すぐ申請してください！`)
    onTrack = false
  }

  return { tasks, warnings, onTrack }
}
