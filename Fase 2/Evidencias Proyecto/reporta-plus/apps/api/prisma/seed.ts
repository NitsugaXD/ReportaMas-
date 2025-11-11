import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@reporta.plus' },
    update: {},
    create: { email: 'admin@reporta.plus', name: 'Admin', password: hash, role: 'ADMIN' }
  })
  console.log('✅ Admin: admin@reporta.plus / admin123')
}
main().finally(() => prisma.$disconnect())