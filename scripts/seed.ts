import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Bauru1347!@', 12);
  await prisma.user.upsert({
    where: { email: 'marcelowiz@gmail.com' },
    update: { password: adminPassword },
    create: {
      email: 'marcelowiz@gmail.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  // About page
  const existingAbout = await prisma.aboutPage.findFirst();
  if (!existingAbout) {
    await prisma.aboutPage.create({
      data: {
        biography: 'Um poeta que dedicou mais de nove d\u00e9cadas \u00e0 beleza das palavras. Nascido em uma pequena cidade do interior do Brasil, encontrou na poesia a express\u00e3o mais pura de sua alma. Seus versos refletem a profundidade de uma vida vivida com plenitude, amor e contempla\u00e7\u00e3o.',
        photoUrls: [],
        photoKeys: [],
        poemTitle: '',
        poemText: '',
      },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
