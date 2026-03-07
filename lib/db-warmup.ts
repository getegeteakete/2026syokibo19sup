// Neon無料枠のコールドスタート対策
// auto-setup.ts から呼ばれ、定期的にDBをwake upする

import { prisma } from './db'

let warmupInterval: ReturnType<typeof setInterval> | null = null

export function startDbWarmup() {
  if (warmupInterval) return
  // 4分ごとにpingしてNeonをスリープさせない（無料枠スリープは5分）
  warmupInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      // ignore
    }
  }, 4 * 60 * 1000) // 4分
}
