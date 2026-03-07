import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Vercelサーバーレス環境ではglobalThisにキャッシュしてコールド起動を最小化
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// 本番でもグローバルキャッシュ（Vercelは関数インスタンスを再利用するため有効）
globalThis.__prisma = prisma
