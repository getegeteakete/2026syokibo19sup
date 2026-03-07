import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = session.role === 'admin' ? (searchParams.get('userId') || session.id) : session.id

  const status = await prisma.applicationStatus.findUnique({ where: { userId } })
  return NextResponse.json({ status })
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { userId: bodyUserId, ...updateData } = await request.json()
  const userId = session.role === 'admin' ? (bodyUserId || session.id) : session.id

  if (session.role !== 'admin' && userId !== session.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const status = await prisma.applicationStatus.upsert({
    where: { userId },
    update: updateData,
    create: { userId, ...updateData },
  })

  return NextResponse.json({ success: true, status })
}
