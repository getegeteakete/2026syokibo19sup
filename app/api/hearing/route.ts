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
    const [data, user] = await Promise.all([
      prisma.hearingData.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { aiGenerateEnabled: true } }),
    ])
    return NextResponse.json({ data, aiGenerateEnabled: user?.aiGenerateEnabled ?? false })
  } catch (e) {
    console.error('GET /api/hearing error:', e)
    return err(`ヒアリングデータ取得エラー: ${String(e)}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return err('認証が必要です', 401)

    const { userId: bodyUserId, ...hearingData } = await request.json()
    const userId = session.role === 'admin' ? (bodyUserId || session.id) : session.id

    const requiredFields = ['companyName', 'representativeName', 'businessType', 'employeeCount',
      'currentBusiness', 'mainProducts', 'targetCustomers', 'subsidyPurpose', 'plannedActivities', 'requestedAmount']
    const filled = requiredFields.filter(f => hearingData[f]?.trim?.()).length
    const completionRate = Math.round((filled / requiredFields.length) * 100)

    const data = await prisma.hearingData.upsert({
      where: { userId },
      update: { ...hearingData, completionRate },
      create: { userId, ...hearingData, completionRate },
    })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('POST /api/hearing error:', e)
    return err(`ヒアリングデータ保存エラー: ${String(e)}`)
  }
}
