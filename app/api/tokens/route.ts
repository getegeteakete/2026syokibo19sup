import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  if (session.role === 'admin') {
    // Admin: get all users' token usage
    const users = await prisma.user.findMany({
      where: { role: 'customer' },
      include: {
        tokenUsage: { select: { inputTokens: true, outputTokens: true, date: true } }
      }
    })

    const settings = await prisma.systemSettings.findFirst()

    const summary = users.map(u => ({
      userId: u.id,
      username: u.username,
      companyName: u.companyName,
      totalInput: u.tokenUsage.reduce((s, t) => s + t.inputTokens, 0),
      totalOutput: u.tokenUsage.reduce((s, t) => s + t.outputTokens, 0),
      total: u.tokenUsage.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0),
    }))

    const globalTotal = summary.reduce((s, u) => s + u.total, 0)

    return NextResponse.json({
      users: summary,
      globalTotal,
      settings,
    })
  }

  // Customer: own usage
  const usage = await prisma.tokenUsage.aggregate({
    where: { userId: session.id },
    _sum: { inputTokens: true, outputTokens: true },
  })

  const settings = await prisma.systemSettings.findFirst()

  return NextResponse.json({
    totalInput: usage._sum.inputTokens || 0,
    totalOutput: usage._sum.outputTokens || 0,
    total: (usage._sum.inputTokens || 0) + (usage._sum.outputTokens || 0),
    limit: settings?.perUserTokenLimit || 50000,
  })
}

// Update settings (admin only)
export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const { perUserTokenLimit, globalTokenLimit, resetUserId } = await request.json()

  if (resetUserId) {
    await prisma.tokenUsage.deleteMany({ where: { userId: resetUserId } })
    return NextResponse.json({ success: true, message: 'トークン使用量をリセットしました' })
  }

  const settings = await prisma.systemSettings.upsert({
    where: { id: '1' },
    update: { perUserTokenLimit, globalTokenLimit },
    create: { id: '1', perUserTokenLimit, globalTokenLimit },
  })

  return NextResponse.json({ success: true, settings })
}
