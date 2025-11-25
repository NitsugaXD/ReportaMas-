const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@reporta.plus' },
    update: {},
    create: {
      email: 'admin@reporta.plus',
      name: 'Admin',
      password: hash,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin creado: admin@reporta.plus / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })