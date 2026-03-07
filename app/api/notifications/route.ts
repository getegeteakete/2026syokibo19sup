import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, sendSMS, buildDeadlineEmail, buildSMSMessage } from '@/lib/notifications'
import { SCHEDULE } from '@/lib/constants'

function daysUntil(target: Date): number {
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// GET: Get notification settings
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const userId = session.role === 'admin'
    ? new URL(request.url).searchParams.get('userId') || session.id
    : session.id

  try {
    const settings = await (prisma as any).notificationSettings?.findUnique?.({ where: { userId } }).catch(() => null)
    const logs = await (prisma as any).notificationLog?.findMany?.({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    }).catch(() => [])
    return NextResponse.json({ settings: settings || null, logs: logs || [] })
  } catch(e) {
    console.error('GET /api/notifications error:', e)
    return NextResponse.json({ settings: null, logs: [] })
  }
}

// POST: Save settings and send test/scheduled notifications
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  let body: any = {}
  try { body = await request.json() } catch(_) {}
  const { action, userId: bodyUserId, ...settingsData } = body
  const userId = session.role === 'admin' ? (bodyUserId || session.id) : session.id

  // Save notification settings
  if (action === 'save_settings') {
    await (prisma as any).notificationSettings?.upsert?.({
      where: { userId },
      update: settingsData,
      create: { userId, ...settingsData },
    }).catch(() => null)
    return NextResponse.json({ success: true })
  }

  // Send test notification
  if (action === 'test') {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const settings = await (prisma as any).notificationSettings?.findUnique?.({ where: { userId } }).catch(() => null)

    if (!settings?.email && !user?.email) {
      return NextResponse.json({ error: 'メールアドレスが未設定です' }, { status: 400 })
    }

    const email = settings?.email || user?.email || ''
    const daysLeft = daysUntil(SCHEDULE.applicationDeadline)

    const result = await sendEmail({
      to: email,
      subject: `【テスト】補助金申請締切まで${daysLeft}日`,
      html: buildDeadlineEmail({
        companyName: user?.companyName || user?.username || '',
        daysLeft,
        deadlineLabel: '電子申請締切',
        deadline: '2026年4月30日 17:00',
        action: 'これはテスト通知です。システムから通知が届くことを確認してください。',
        actionUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      }),
    })

    if (result.success) {
      await (prisma as any).notificationLog?.create?.({
        data: { userId, type: 'email', subject: `テスト通知`, body: `テスト送信`, status: 'sent' }
      }).catch(() => null)
    }

    return NextResponse.json(result)
  }

  // Send bulk deadline notifications (admin only or cron)
  if (action === 'send_bulk' && session.role === 'admin') {
    const users = await prisma.user.findMany({
      where: { role: 'customer' },
      include: { applicationStatus: true }
    })

    const results = []
    for (const user of users) {
      if (!user.email) continue
      const daysToApp = daysUntil(SCHEDULE.applicationDeadline)
      const daysToShokoukai = daysUntil(SCHEDULE.shokoukaideadline)

      // Only notify at key intervals
      if ([30, 21, 14, 7, 3, 1].includes(daysToApp) || [14, 7, 3].includes(daysToShokoukai)) {
        const notifyDays = daysToShokoukai <= 14 && !user.applicationStatus?.shokoukaiFiled
          ? daysToShokoukai : daysToApp

        const label = daysToShokoukai <= 7 && !user.applicationStatus?.shokoukaiFiled
          ? '様式4 締切' : '電子申請締切'

        const action = daysToShokoukai <= 7 && !user.applicationStatus?.shokoukaiFiled
          ? '商工会議所に今すぐ連絡し、様式4の発行手続きを行ってください。'
          : notifyDays <= 3
          ? 'Jグランツで電子申請の最終確認と送信をしてください。'
          : '申請書類の確認と電子申請の準備を進めてください。'

        const emailResult = await sendEmail({
          to: user.email,
          subject: `【補助金サポート】${label}まで${notifyDays}日`,
          html: buildDeadlineEmail({
            companyName: user.companyName || user.username,
            daysLeft: notifyDays,
            deadlineLabel: label,
            deadline: label === '様式4 締切' ? '2026年4月16日' : '2026年4月30日 17:00',
            action,
            actionUrl: process.env.NEXTAUTH_URL,
          }),
        })

        results.push({ userId: user.id, email: user.email, success: emailResult.success })

        await (prisma as any).notificationLog?.create?.({
          data: {
            userId: user.id,
            type: 'email',
            subject: `${label}まで${notifyDays}日`,
            body: action,
            status: emailResult.success ? 'sent' : 'failed',
          }
        }).catch(() => null)
      }
    }

    return NextResponse.json({ success: true, results })
  }

  return NextResponse.json({ error: '不明なアクションです' }, { status: 400 })
}
