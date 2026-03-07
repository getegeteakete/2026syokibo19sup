import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin1234', 8)
  
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

  await prisma.systemSettings.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      globalTokenLimit: 1000000,
      perUserTokenLimit: 50000,
    }
  })

  console.log('✅ Seed完了: admin / admin1234 でログインできます')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
