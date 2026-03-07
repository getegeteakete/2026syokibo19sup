import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// サーバーレス環境向け最適化
// - log を本番では error のみ
// - globalThis キャッシュで再接続を最小化
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

globalThis.__prisma = prisma
