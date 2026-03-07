import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

// PATCH /api/admin/ai-permission  { userId, enabled: boolean }
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return err('認証が必要です', 401)
    if (session.role !== 'admin') return err('管理者権限が必要です', 403)

    const { userId, enabled } = await request.json()
    if (!userId || typeof enabled !== 'boolean') return err('パラメータが不正です', 400)

    await prisma.user.update({
      where: { id: userId },
      data: { aiGenerateEnabled: enabled },
    })

    return NextResponse.json({ success: true, enabled })
  } catch (e) {
    console.error('PATCH /api/admin/ai-permission error:', e)
    return err(`更新エラー: ${String(e)}`)
  }
}
