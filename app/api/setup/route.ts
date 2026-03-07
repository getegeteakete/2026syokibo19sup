import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  // Simple auth check
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (key !== 'setup2026') {
    return NextResponse.json({ error: '認証キーが必要です ?key=setup2026' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`
    results.push('✅ DB接続成功')
  } catch (e) {
    return NextResponse.json({ 
      error: 'DB接続失敗', 
      detail: String(e),
      hint: 'DATABASE_URLを確認してください（pooler URLの場合は ?pgbouncer=true を末尾に追加）'
    }, { status: 500 })
  }

  try {
    // Create admin user
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

  try {
    // Create system settings
    await prisma.systemSettings.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        globalTokenLimit: 1000000,
        perUserTokenLimit: 50000,
      }
    })
    results.push('✅ システム設定作成完了')
  } catch (e) {
    results.push(`⚠️ システム設定: ${String(e)}`)
  }

  // Count users
  try {
    const count = await prisma.user.count()
    results.push(`✅ DBユーザー数: ${count}件`)
  } catch (e) {
    results.push(`⚠️ ユーザー数確認失敗: ${String(e)}`)
  }

  return NextResponse.json({ 
    success: true, 
    message: 'セットアップ完了！ /login からログインできます',
    results,
    loginInfo: { id: 'admin', password: 'admin1234' }
  })
}
