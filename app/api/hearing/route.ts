import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = session.role === 'admin' ? (searchParams.get('userId') || session.id) : session.id

  const data = await prisma.hearingData.findUnique({ where: { userId } })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { userId: bodyUserId, ...hearingData } = await request.json()
  const userId = session.role === 'admin' ? (bodyUserId || session.id) : session.id

  // Calculate completion rate
  const requiredFields = ['companyName', 'representativeName', 'businessType', 'employeeCount',
    'currentBusiness', 'mainProducts', 'targetCustomers', 'subsidyPurpose', 'plannedActivities', 'requestedAmount']
  const filled = requiredFields.filter(f => hearingData[f]?.trim()).length
  const completionRate = Math.round((filled / requiredFields.length) * 100)

  const data = await prisma.hearingData.upsert({
    where: { userId },
    update: { ...hearingData, completionRate },
    create: { userId, ...hearingData, completionRate },
  })

  return NextResponse.json({ success: true, data })
}
