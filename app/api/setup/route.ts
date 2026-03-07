import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (key !== 'setup2026') {
    return NextResponse.json({ error: '認証キーが必要です ?key=setup2026' }, { status: 401 })
  }

  const results: string[] = []

  // ① DB接続確認
  try {
    await prisma.$queryRaw`SELECT 1`
    results.push('✅ DB接続成功')
  } catch (e) {
    return NextResponse.json({ error: 'DB接続失敗', detail: String(e) }, { status: 500 })
  }

  // ② テーブル作成（CREATE TABLE IF NOT EXISTS）
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'customer',
        "companyName" TEXT,
        "contactName" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`)
    results.push('✅ Userテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HearingData" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "data" JSONB NOT NULL DEFAULT '{}',
        "completionRate" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HearingData_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "HearingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "HearingData_userId_key" ON "HearingData"("userId");`)
    results.push('✅ HearingDataテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "section" TEXT NOT NULL DEFAULT 'general',
        "tokensUsed" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    results.push('✅ ChatMessageテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TokenUsage" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "totalTokens" INTEGER NOT NULL DEFAULT 0,
        "monthlyTokens" INTEGER NOT NULL DEFAULT 0,
        "tokenLimit" INTEGER NOT NULL DEFAULT 50000,
        "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "TokenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "TokenUsage_userId_key" ON "TokenUsage"("userId");`)
    results.push('✅ TokenUsageテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ApplicationStatus" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "stage" TEXT NOT NULL DEFAULT 'requirement_check',
        "requirementCheckDone" BOOLEAN NOT NULL DEFAULT false,
        "amountCheckDone" BOOLEAN NOT NULL DEFAULT false,
        "hearingDone" BOOLEAN NOT NULL DEFAULT false,
        "shokoukaiFiled" BOOLEAN NOT NULL DEFAULT false,
        "shokoukaiFiingDate" TIMESTAMP(3),
        "electronicFiled" BOOLEAN NOT NULL DEFAULT false,
        "electronicFiledDate" TIMESTAMP(3),
        "adopted" BOOLEAN NOT NULL DEFAULT false,
        "reportFiled" BOOLEAN NOT NULL DEFAULT false,
        "notes" TEXT NOT NULL DEFAULT '',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ApplicationStatus_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ApplicationStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationStatus_userId_key" ON "ApplicationStatus"("userId");`)
    results.push('✅ ApplicationStatusテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSettings" (
        "id" TEXT NOT NULL,
        "globalTokenLimit" INTEGER NOT NULL DEFAULT 1000000,
        "perUserTokenLimit" INTEGER NOT NULL DEFAULT 50000,
        "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
        "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
        "resendApiKey" TEXT,
        "twilioSid" TEXT,
        "twilioToken" TEXT,
        "twilioFrom" TEXT,
        CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
      );
    `)
    results.push('✅ SystemSettingsテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationLog" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
      );
    `)
    results.push('✅ NotificationLogテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationSettings" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT,
        "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
        "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
        "deadlineAlerts" BOOLEAN NOT NULL DEFAULT true,
        "weeklyReport" BOOLEAN NOT NULL DEFAULT true,
        "documentRemind" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSettings_userId_key" ON "NotificationSettings"("userId");`)
    results.push('✅ NotificationSettingsテーブル作成')

  } catch (e) {
    results.push(`⚠️ テーブル作成エラー: ${String(e)}`)
  }

  // ③ adminアカウント作成
  try {
    const adminPassword = await bcrypt.hash('admin1234', 10)
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        companyName: '管理者',
        contactName: '管理者',
      }
    })
    results.push('✅ adminアカウント作成完了')
  } catch (e) {
    results.push(`⚠️ adminアカウント: ${String(e)}`)
  }

  // ④ システム設定
  try {
    await prisma.systemSettings.upsert({
      where: { id: '1' },
      update: {},
      create: { id: '1', globalTokenLimit: 1000000, perUserTokenLimit: 50000 }
    })
    results.push('✅ システム設定作成完了')
  } catch (e) {
    results.push(`⚠️ システム設定: ${String(e)}`)
  }

  // ⑤ 確認
  try {
    const count = await prisma.user.count()
    results.push(`✅ DBユーザー数: ${count}件`)
  } catch (e) {
    results.push(`⚠️ ユーザー数確認失敗: ${String(e)}`)
  }

  const allOk = results.every(r => r.startsWith('✅'))

  return NextResponse.json({
    success: allOk,
    message: allOk ? '🎉 セットアップ完了！ /login からログインできます' : '⚠️ 一部エラーがあります',
    results,
    loginInfo: allOk ? { id: 'admin', password: 'admin1234' } : undefined
  })
}
