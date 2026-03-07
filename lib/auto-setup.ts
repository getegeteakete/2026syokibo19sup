import { prisma } from './db'
import { startDbWarmup } from './db-warmup'
import bcrypt from 'bcryptjs'

// 同一プロセス内で1回だけ実行するフラグ
let setupDone = false

export async function autoSetup() {
  if (setupDone) return
  setupDone = true
  startDbWarmup() // Neonコールドスタート防止
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
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "HearingData" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    // 追加フィールド（様式2・様式3対応）
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "representativeBackground" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "location" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "salesBreakdown" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "salesTrend" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "profitRate" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "competitors" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "customerNeeds" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "weaknesses" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "managementPolicy" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "threeYearTarget" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "newTargetCustomers" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "efficiencyPlan" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "salesForecast1y" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "salesForecast2y" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "salesForecast3y" TEXT;`).catch(()=>{})
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "mediaAchievements" TEXT;`).catch(()=>{})
  } catch (e) { console.error('[auto-setup] HearingData migration:', e) }


  // 全テーブルのタイムスタンプ列マイグレーション
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationLog" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    console.log('[setup] timestamp migration done')
  } catch (e) { console.error('[setup] timestamp migration:', e) }
  // ===== 全列マイグレーション =====
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "companyName" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "contactName" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "email" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "aiGenerateEnabled" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "companyName" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "representativeName" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "address" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "phone" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "email" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "businessType" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "employeeCount" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "foundingYear" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "annualSales" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "currentBusiness" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "mainProducts" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "targetCustomers" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "salesChannels" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "strengths" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "challenges" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "subsidyPurpose" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "plannedActivities" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "expectedEffects" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "requestedAmount" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "ownContribution" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "implementationPlan" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "requirementCheck" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "applicationDraft" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "completionRate" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "HearingData" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" ADD COLUMN IF NOT EXISTS "tokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ChatMessage" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER NOT NULL DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "TokenUsage" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'requirement_check';`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "requirementCheckDone" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "amountCheckDone" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "hearingDone" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "shokoukaiFiled" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "shokoukaiFiingDate" TIMESTAMP(3);`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "electronicFiled" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "electronicFilingDate" TIMESTAMP(3);`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "adopted" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "adoptedDate" TIMESTAMP(3);`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "reportFiled" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "reportFiledDate" TIMESTAMP(3);`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "notes" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "ApplicationStatus" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationLog" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "email" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "phone" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "emailEnabled" BOOLEAN NOT NULL DEFAULT true;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "smsEnabled" BOOLEAN NOT NULL DEFAULT false;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "deadlineAlerts" BOOLEAN NOT NULL DEFAULT true;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "weeklyReport" BOOLEAN NOT NULL DEFAULT true;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "NotificationSettings" ADD COLUMN IF NOT EXISTS "documentRemind" BOOLEAN NOT NULL DEFAULT true;`)
  } catch(e) { console.error('[auto-setup] migration', e) }

  // admin アカウント作成
  try {
    const exists = await prisma.user.findUnique({ where: { username: 'admin' } })
    if (!exists) {
      const { default: bcrypt } = await import('bcryptjs')
      const hashed = await bcrypt.hash('admin1234', 8)
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
