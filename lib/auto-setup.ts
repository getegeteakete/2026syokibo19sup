import { prisma } from './db'
import bcrypt from 'bcryptjs'

export async function autoSetup() {
  try {
    // DB接続確認
    await prisma.$queryRaw`SELECT 1`
    console.log('[auto-setup] DB接続OK')
  } catch (e) {
    console.error('[auto-setup] DB接続失敗:', e)
    return
  }

  // User テーブル
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
  } catch (e) { console.error('[auto-setup] User:', e) }

  // HearingData
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HearingData" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "companyName" TEXT, "representativeName" TEXT, "address" TEXT,
        "phone" TEXT, "email" TEXT, "businessType" TEXT, "employeeCount" TEXT,
        "foundingYear" TEXT, "annualSales" TEXT, "currentBusiness" TEXT,
        "mainProducts" TEXT, "targetCustomers" TEXT, "salesChannels" TEXT,
        "strengths" TEXT, "challenges" TEXT, "subsidyPurpose" TEXT,
        "plannedActivities" TEXT, "expectedEffects" TEXT, "requestedAmount" TEXT,
        "ownContribution" TEXT, "implementationPlan" TEXT,
        "requirementCheck" TEXT DEFAULT '{}', "applicationDraft" TEXT,
        "completionRate" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HearingData_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "HearingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "HearingData_userId_key" ON "HearingData"("userId");`)
  } catch (e) { console.error('[auto-setup] HearingData:', e) }

  // ChatMessage
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL, "content" TEXT NOT NULL,
        "section" TEXT NOT NULL DEFAULT 'general',
        "imageUrl" TEXT, "tokens" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)
  } catch (e) { console.error('[auto-setup] ChatMessage:', e) }

  // TokenUsage — 列マイグレーション含む
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TokenUsage" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "inputTokens" INTEGER NOT NULL DEFAULT 0,
        "outputTokens" INTEGER NOT NULL DEFAULT 0,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "TokenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)
    // 旧列があれば削除・新列追加
    await prisma.$executeRawUnsafe(`ALTER TABLE "TokenUsage" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "TokenUsage" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "TokenUsage" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    for (const col of ['totalTokens', 'monthlyTokens', 'tokenLimit', 'lastResetAt', 'updatedAt']) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "TokenUsage" DROP COLUMN IF EXISTS "${col}";`)
    }
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "TokenUsage_userId_key";`)
  } catch (e) { console.error('[auto-setup] TokenUsage:', e) }

  // ApplicationStatus
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ApplicationStatus" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
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
        CONSTRAINT "ApplicationStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationStatus_userId_key" ON "ApplicationStatus"("userId");`)
  } catch (e) { console.error('[auto-setup] ApplicationStatus:', e) }

  // SystemSettings
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSettings" (
        "id" TEXT NOT NULL DEFAULT '1',
        "globalTokenLimit" INTEGER NOT NULL DEFAULT 1000000,
        "perUserTokenLimit" INTEGER NOT NULL DEFAULT 50000,
        CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
      );
    `)
  } catch (e) { console.error('[auto-setup] SystemSettings:', e) }

  // NotificationLog / NotificationSettings
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationLog" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL, "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL, "status" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationSettings" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "email" TEXT, "phone" TEXT,
        "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
        "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
        "deadlineAlerts" BOOLEAN NOT NULL DEFAULT true,
        "weeklyReport" BOOLEAN NOT NULL DEFAULT true,
        "documentRemind" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSettings_userId_key" ON "NotificationSettings"("userId");`)
  } catch (e) { console.error('[auto-setup] Notification:', e) }

  // ChatMessage列マイグレーション
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "tokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "tokensUsed";`)
  } catch (e) { console.error('[auto-setup] ChatMessage migration:', e) }

  // admin アカウント作成
  try {
    const exists = await prisma.user.findUnique({ where: { username: 'admin' } })
    if (!exists) {
      const { default: bcrypt } = await import('bcryptjs')
      const hashed = await bcrypt.hash('admin1234', 10)
      await prisma.user.create({
        data: { username: 'admin', password: hashed, role: 'admin', companyName: '管理者', contactName: '管理者' }
      })
      console.log('[auto-setup] adminアカウント作成完了')
    }
  } catch (e) { console.error('[auto-setup] admin:', e) }

  // SystemSettings初期化
  try {
    await prisma.systemSettings.upsert({
      where: { id: '1' },
      update: {},
      create: { id: '1', globalTokenLimit: 1000000, perUserTokenLimit: 50000 }
    })
  } catch (e) { console.error('[auto-setup] SystemSettings init:', e) }

  console.log('[auto-setup] 完了')
}
