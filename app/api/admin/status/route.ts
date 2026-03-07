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
    const userId = session.role === 'admin'
      ? new URL(request.url).searchParams.get('userId') || session.id
      : session.id
    const status = await prisma.applicationStatus.findUnique({ where: { userId } })
    return NextResponse.json({ status })
  } catch (e) {
    console.error('GET /api/admin/status error:', e)
    return err(`ステータス取得エラー: ${String(e)}`)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return err('認証が必要です', 401)

    const { userId: bodyUserId, ...updateData } = await request.json()
    const userId = session.role === 'admin' ? (bodyUserId || session.id) : session.id
    if (session.role !== 'admin' && userId !== session.id) return err('権限がありません', 403)

    const status = await prisma.applicationStatus.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    })
    return NextResponse.json({ success: true, status })
  } catch (e) {
    console.error('PATCH /api/admin/status error:', e)
    return err(`ステータス更新エラー: ${String(e)}`)
  }
}
