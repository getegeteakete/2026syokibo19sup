import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return err('認証が必要です', 401)

    if (session.role === 'admin') {
      const users = await prisma.user.findMany({
        where: { role: 'customer' },
        include: { tokenUsage: { select: { inputTokens: true, outputTokens: true } } }
      })
      const settings = await prisma.systemSettings.findFirst()
      const summary = users.map(u => ({
        userId: u.id, username: u.username, companyName: u.companyName,
        totalInput: u.tokenUsage.reduce((s, t) => s + t.inputTokens, 0),
        totalOutput: u.tokenUsage.reduce((s, t) => s + t.outputTokens, 0),
        total: u.tokenUsage.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0),
      }))
      return NextResponse.json({ users: summary, globalTotal: summary.reduce((s, u) => s + u.total, 0), settings })
    }

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
  } catch (e) {
    console.error('GET /api/tokens error:', e)
    return err(`トークン取得エラー: ${String(e)}`)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || session.role !== 'admin') return err('管理者権限が必要です', 403)

    const { perUserTokenLimit, globalTokenLimit, resetUserId } = await request.json()
    if (resetUserId) {
      await prisma.tokenUsage.deleteMany({ where: { userId: resetUserId } })
      return NextResponse.json({ success: true, message: 'リセットしました' })
    }
    const settings = await prisma.systemSettings.upsert({
      where: { id: '1' },
      update: { perUserTokenLimit, globalTokenLimit },
      create: { id: '1', perUserTokenLimit, globalTokenLimit },
    })
    return NextResponse.json({ success: true, settings })
  } catch (e) {
    console.error('PATCH /api/tokens error:', e)
    return err(`設定保存エラー: ${String(e)}`)
  }
}
