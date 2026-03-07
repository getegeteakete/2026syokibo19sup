import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Get all users (admin) or self
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  if (session.role === 'admin') {
    const users = await prisma.user.findMany({
      where: { role: 'customer' },
      include: {
        hearingData: { select: { completionRate: true, updatedAt: true } },
        applicationStatus: true,
        tokenUsage: { select: { inputTokens: true, outputTokens: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const usersWithTokens = users.map(u => ({
      ...u,
      password: undefined,
      totalTokens: u.tokenUsage.reduce((sum, t) => sum + t.inputTokens + t.outputTokens, 0),
    }))

    return NextResponse.json({ users: usersWithTokens })
  }

  // Customer: return own data
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      hearingData: true,
      applicationStatus: true,
    }
  })

  return NextResponse.json({ user: { ...user, password: undefined } })
}

// Create new user (admin only)
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const { username, password, companyName, contactName, email, phone } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'ユーザー名とパスワードは必須です' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    return NextResponse.json({ error: 'このユーザー名は既に使用されています' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      username,
      password: hashed,
      role: 'customer',
      companyName,
      contactName,
      email,
      phone,
      applicationStatus: {
        create: { stage: 'requirement_check' }
      }
    }
  })

  return NextResponse.json({ success: true, user: { ...user, password: undefined } })
}

// Update user
export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const targetId = session.role === 'admin' ? (body.userId || session.id) : session.id

  if (session.role !== 'admin' && targetId !== session.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { password, ...updateData } = body
  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id: targetId },
    data: updateData,
  })

  return NextResponse.json({ success: true, user: { ...user, password: undefined } })
}

// Delete user (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 })

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ success: true })
}
