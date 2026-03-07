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

  // ② テーブル作成 — Prismaスキーマと完全一致させる
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

    // HearingData — スキーマの全フィールドを列挙
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HearingData" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "companyName" TEXT,
        "representativeName" TEXT,
        "address" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "businessType" TEXT,
        "employeeCount" TEXT,
        "foundingYear" TEXT,
        "annualSales" TEXT,
        "currentBusiness" TEXT,
        "mainProducts" TEXT,
        "targetCustomers" TEXT,
        "salesChannels" TEXT,
        "strengths" TEXT,
        "challenges" TEXT,
        "subsidyPurpose" TEXT,
        "plannedActivities" TEXT,
        "expectedEffects" TEXT,
        "requestedAmount" TEXT,
        "ownContribution" TEXT,
        "implementationPlan" TEXT,
        "requirementCheck" TEXT DEFAULT '{}',
        "applicationDraft" TEXT,
        "completionRate" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HearingData_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "HearingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "HearingData_userId_key" ON "HearingData"("userId");`)
    results.push('✅ HearingDataテーブル作成')

    // ChatMessage — tokensフィールド（スキーマに合わせる）
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "section" TEXT NOT NULL DEFAULT 'general',
        "imageUrl" TEXT,
        "tokens" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    results.push('✅ ChatMessageテーブル作成')

    // TokenUsage — inputTokens/outputTokens/date（スキーマに合わせる）
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TokenUsage" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "inputTokens" INTEGER NOT NULL DEFAULT 0,
        "outputTokens" INTEGER NOT NULL DEFAULT 0,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "TokenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    results.push('✅ TokenUsageテーブル作成')

    // ApplicationStatus — electronicFilingDate (typo修正済み)
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
        "electronicFilingDate" TIMESTAMP(3),
        "adopted" BOOLEAN NOT NULL DEFAULT false,
        "adoptedDate" TIMESTAMP(3),
        "reportFiled" BOOLEAN NOT NULL DEFAULT false,
        "reportFiledDate" TIMESTAMP(3),
        "notes" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ApplicationStatus_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ApplicationStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationStatus_userId_key" ON "ApplicationStatus"("userId");`)
    results.push('✅ ApplicationStatusテーブル作成')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSettings" (
        "id" TEXT NOT NULL DEFAULT '1',
        "globalTokenLimit" INTEGER NOT NULL DEFAULT 100000,
        "perUserTokenLimit" INTEGER NOT NULL DEFAULT 10000,
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


  // ⑤ TokenUsageの列修正（旧スキーマからの移行）
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    // 旧列を削除（あれば）
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" DROP COLUMN IF EXISTS "totalTokens";`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" DROP COLUMN IF EXISTS "monthlyTokens";`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" DROP COLUMN IF EXISTS "tokenLimit";`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" DROP COLUMN IF EXISTS "lastResetAt";`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" DROP COLUMN IF EXISTS "updatedAt";`)
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "TokenUsage_userId_key";`)
    results.push('✅ TokenUsage列マイグレーション完了')
  } catch (e) {
    results.push(`⚠️ TokenUsage移行: ${String(e)}`)
  }

  // ⑥ ChatMessageの列修正
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" ADD COLUMN IF NOT EXISTS "tokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" DROP COLUMN IF EXISTS "tokensUsed";`)
    results.push('✅ ChatMessage列マイグレーション完了')
  } catch (e) {
    results.push(`⚠️ ChatMessage移行: ${String(e)}`)
  }

  // HearingData列マイグレーション
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "companyName" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "representativeName" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "address" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "phone" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "email" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "businessType" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "employeeCount" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "foundingYear" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "annualSales" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "currentBusiness" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "mainProducts" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "targetCustomers" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "salesChannels" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "strengths" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "challenges" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "subsidyPurpose" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "plannedActivities" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "expectedEffects" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "requestedAmount" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "ownContribution" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "implementationPlan" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "requirementCheck" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "applicationDraft" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "completionRate" INTEGER NOT NULL DEFAULT 0;`)
    results.push('✅ HearingData列マイグレーション完了')
  } catch (e) {
    results.push(`⚠️ HearingData移行: ${String(e)}`)
  }

  // ③ adminアカウント作成
  try {
    const adminPassword = await bcrypt.hash('admin1234', 10)
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: { username: 'admin', password: adminPassword, role: 'admin', companyName: '管理者', contactName: '管理者' }
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
    results.push(`⚠️ ユーザー数確認: ${String(e)}`)
  }

  const allOk = results.every(r => r.startsWith('✅'))
  return NextResponse.json({
    success: allOk,
    message: allOk ? '🎉 セットアップ完了！ /login からログインできます' : '⚠️ 一部エラーがあります',
    results,
    loginInfo: allOk ? { id: 'admin', password: 'admin1234' } : undefined
  })
}
