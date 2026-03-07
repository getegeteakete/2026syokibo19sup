import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return err('認証が必要です', 401)

    if (session.role === 'admin') {
      // ユーザー一覧を1クエリで取得
      const users = await prisma.user.findMany({
        where: { role: 'customer' },
        include: {
          hearingData: { select: { completionRate: true } },
          applicationStatus: { select: { stage: true, adopted: true, electronicFiled: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      // tokenUsageを1クエリで全員分まとめて集計
      let tokenMap: Record<string, number> = {}
      try {
        const tokenGroups = await prisma.tokenUsage.groupBy({
          by: ['userId'],
          _sum: { inputTokens: true, outputTokens: true },
        })
        tokenMap = Object.fromEntries(
          tokenGroups.map(t => [t.userId, (t._sum.inputTokens || 0) + (t._sum.outputTokens || 0)])
        )
      } catch (_) { /* TokenUsageテーブルが未作成の場合 */ }

      const usersWithTokens = users.map(u => ({
        ...u,
        password: undefined,
        totalTokens: tokenMap[u.id] || 0,
      }))

      return NextResponse.json({ users: usersWithTokens })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { hearingData: true, applicationStatus: true }
    })
    return NextResponse.json({ user: { ...user, password: undefined } })
  } catch (e) {
    console.error('GET /api/users error:', e)
    return err(`ユーザー取得エラー: ${String(e)}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || session.role !== 'admin') return err('管理者権限が必要です', 403)

    const { username, password, companyName, contactName, email, phone } = await request.json()
    if (!username || !password) return err('ユーザー名とパスワードは必須です', 400)

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return err('このユーザー名は既に使用されています', 400)

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username, password: hashed, role: 'customer',
        companyName: companyName || null,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        applicationStatus: { create: { stage: 'requirement_check' } }
      }
    })
    return NextResponse.json({ success: true, user: { ...user, password: undefined } })
  } catch (e) {
    console.error('POST /api/users error:', e)
    return err(`ユーザー作成エラー: ${String(e)}`)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return err('認証が必要です', 401)
    const body = await request.json()
    const targetId = session.role === 'admin' ? (body.userId || session.id) : session.id
    if (session.role !== 'admin' && targetId !== session.id) return err('権限がありません', 403)
    const { password, userId: _uid, ...updateData } = body
    if (password) updateData.password = await bcrypt.hash(password, 10)
    const user = await prisma.user.update({ where: { id: targetId }, data: updateData })
    return NextResponse.json({ success: true, user: { ...user, password: undefined } })
  } catch (e) {
    console.error('PATCH /api/users error:', e)
    return err(`更新エラー: ${String(e)}`)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || session.role !== 'admin') return err('管理者権限が必要です', 403)
    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) return err('ユーザーIDが必要です', 400)
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/users error:', e)
    return err(`削除エラー: ${String(e)}`)
  }
}
